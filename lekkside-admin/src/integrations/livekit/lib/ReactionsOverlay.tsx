import React, { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export function ReactionsOverlay() {
  const room = useRoomContext();
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
      if (topic === 'reactions') {
        try {
          const str = new TextDecoder().decode(payload);
          const data = JSON.parse(str);
          if (data.type === 'reaction' && data.emoji) {
            const id = Math.random().toString(36).substring(7);
            const x = Math.random() * 80 + 10; // 10% to 90% across the screen
            setReactions(prev => [...prev, { id, emoji: data.emoji, x }]);
            setTimeout(() => {
              setReactions(prev => prev.filter(r => r.id !== id));
            }, 3000); // 3 seconds animation
          }
        } catch (e) {
          console.error('Failed to parse reaction data', e);
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {reactions.map(r => (
        <div
          key={r.id}
          className="absolute bottom-16 text-5xl drop-shadow-md animate-float-up"
          style={{ left: `${r.x}%` }}
        >
          {r.emoji}
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-up {
          0% { transform: translateY(50px) scale(0.5); opacity: 0; }
          20% { transform: translateY(0px) scale(1.2); opacity: 1; }
          80% { transform: translateY(-300px) scale(1); opacity: 1; }
          100% { transform: translateY(-400px) scale(1); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}} />
    </div>
  );
}
