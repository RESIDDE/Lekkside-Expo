import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  user_id: string;
  status: PresenceStatus;
  last_active_at: string;
}

// Global store for presence to share across components without re-rendering everything
let globalPresenceMap: Record<string, UserPresence> = {};
const listeners = new Set<(map: Record<string, UserPresence>) => void>();

function updateGlobalMap(userId: string, presence: UserPresence) {
  globalPresenceMap = { ...globalPresenceMap, [userId]: presence };
  listeners.forEach(l => l(globalPresenceMap));
}

function removeGlobalMap(userId: string) {
  const newMap = { ...globalPresenceMap };
  delete newMap[userId];
  globalPresenceMap = newMap;
  listeners.forEach(l => l(globalPresenceMap));
}

// Initialize channel once
let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
let currentUserId: string | null = null;
let currentStatus: PresenceStatus = 'online';
let idleTimeout: ReturnType<typeof setTimeout> | null = null;

const IDLE_TIME_MS = 5 * 60 * 1000; // 5 minutes

export function initializePresence(userId: string) {
  if (presenceChannel) return;
  currentUserId = userId;

  presenceChannel = supabase.channel('global-presence', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel!.presenceState();
      
      const newMap: Record<string, UserPresence> = {};
      for (const key in state) {
        // We assume the first presence object is the correct one for that user
        const pState = state[key][0] as any;
        newMap[key] = {
          user_id: key,
          status: pState.status || 'online',
          last_active_at: pState.last_active_at || new Date().toISOString()
        };
      }
      globalPresenceMap = newMap;
      listeners.forEach(l => l(globalPresenceMap));
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      const pState = newPresences[0] as any;
      updateGlobalMap(key, {
        user_id: key,
        status: pState.status || 'online',
        last_active_at: pState.last_active_at || new Date().toISOString()
      });
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      // User disconnected entirely
      removeGlobalMap(key);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await updatePresence('online');
      }
    });

  // Setup idle listeners
  const resetIdle = () => {
    if (currentStatus === 'away') {
      updatePresence('online');
    }
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      updatePresence('away');
    }, IDLE_TIME_MS);
  };

  window.addEventListener('mousemove', resetIdle);
  window.addEventListener('keydown', resetIdle);
  window.addEventListener('click', resetIdle);
  window.addEventListener('scroll', resetIdle);
  window.addEventListener('beforeunload', () => updatePresence('offline'));

  resetIdle();
}

export async function updatePresence(status: PresenceStatus) {
  if (!presenceChannel || !currentUserId) return;
  currentStatus = status;
  
  const now = new Date().toISOString();
  await presenceChannel.track({
    user_id: currentUserId,
    status: status,
    last_active_at: now
  });

  // Try to update profiles table silently
  supabase.from('profiles').update({ last_active_at: now }).eq('user_id', currentUserId).then();
}

// React hook to use presence data
export function usePresence() {
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>(globalPresenceMap);

  useEffect(() => {
    const listener = (newMap: Record<string, UserPresence>) => {
      setPresenceMap(newMap);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const getUserPresence = useCallback((userId: string) => {
    return presenceMap[userId];
  }, [presenceMap]);

  return { presenceMap, getUserPresence };
}
