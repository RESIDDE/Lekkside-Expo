import { usePresence } from '../hooks/usePresence';
import { formatDistanceToNow } from 'date-fns';

interface PresenceIndicatorProps {
  userId: string;
  showText?: boolean;
  className?: string;
  // If provided, this timestamp will be used if the user is offline (e.g. from the profile row)
  fallbackLastActive?: string | null; 
}

export function PresenceIndicator({ userId, showText = false, className = '', fallbackLastActive }: PresenceIndicatorProps) {
  const { getUserPresence } = usePresence();
  const presence = getUserPresence(userId);

  const status = presence?.status || 'offline';
  const lastActive = presence?.last_active_at || fallbackLastActive;

  let colorClass = 'bg-gray-400';
  let text = 'Offline';

  if (status === 'online') {
    colorClass = 'bg-green-500';
    text = 'Online';
  } else if (status === 'away') {
    colorClass = 'bg-yellow-400';
    text = 'Away';
  } else {
    if (lastActive) {
      try {
        text = `Active ${formatDistanceToNow(new Date(lastActive), { addSuffix: true })}`;
      } catch (e) {
        text = 'Offline';
      }
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        <span className={`h-2.5 w-2.5 rounded-full ${colorClass} ${status === 'online' ? 'animate-pulse' : ''}`} />
        {status === 'online' && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping" />
        )}
      </div>
      {showText && <span className="text-xs text-gray-500 font-medium">{text}</span>}
    </div>
  );
}
