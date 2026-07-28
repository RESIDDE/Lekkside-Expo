import React, { useState } from 'react';
import { useParticipants, useRoomContext } from '@livekit/components-react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, MicOff, VideoOff, UserX, Lock, Unlock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModerator } from './ModeratorContext';

export function ModerationPanel() {
  const room = useRoomContext();
  const participants = useParticipants();
  const [isLocked, setIsLocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isModerator } = useModerator();

  // If the user isn't an admin, we don't render this.
  if (!isModerator) {
    return null;
  }

  const handleModerationAction = async (action: string, payload: any) => {
    try {
      setIsProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      const hostSecret = localStorage.getItem(`host_secret_${room.name}`) || undefined;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-moderation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action,
          roomName: room.name,
          hostSecret,
          ...payload
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Action failed");
      }
    } catch (err: any) {
      console.error("Moderation action failed:", err);
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMuteAll = async () => {
    // We can iterate over participants and update permissions
    for (const p of participants) {
      if (p.identity === room.localParticipant.identity) continue; // don't mute self
      await handleModerationAction('updateParticipant', {
        identity: p.identity,
        permissions: { canPublish: false }
      });
    }
  };

  const handleMuteParticipant = async (identity: string) => {
    await handleModerationAction('updateParticipant', {
      identity,
      permissions: { canPublish: false, canPublishData: true, canSubscribe: true }
    });
  };

  const handleRemoveParticipant = async (identity: string) => {
    if (!confirm("Are you sure you want to remove this participant?")) return;
    await handleModerationAction('removeParticipant', { identity });
  };

  const toggleRoomLock = async () => {
    const action = isLocked ? 'unlockRoom' : 'lockRoom';
    await handleModerationAction(action, {});
    setIsLocked(!isLocked);
  };

  return (
    <div className="absolute right-4 top-24 w-80 bg-background border rounded-xl shadow-lg p-4 flex flex-col max-h-[70vh] z-50">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Moderation Panel
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleRoomLock}
          disabled={isProcessing}
          className={isLocked ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-none" : "border-none"}
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleMuteAll}
          disabled={isProcessing || participants.length <= 1}
          className="w-full"
        >
          <MicOff className="w-4 h-4 mr-2" />
          Mute All Attendees
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
          <Users className="w-3 h-3" />
          Participants ({participants.length})
        </h4>
        <div className="flex flex-col gap-2">
          {participants.map(p => (
            <div key={p.identity} className="flex items-center justify-between p-2 rounded-lg border bg-card text-sm">
              <span className="truncate pr-2 font-medium">
                {p.name || p.identity}
                {p.identity === room.localParticipant.identity && " (You)"}
              </span>
              
              {p.identity !== room.localParticipant.identity && (
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                    onClick={() => handleMuteParticipant(p.identity)}
                    title="Mute/Disable Mic"
                    disabled={isProcessing}
                  >
                    <MicOff className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveParticipant(p.identity)}
                    title="Remove Participant"
                    disabled={isProcessing}
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
