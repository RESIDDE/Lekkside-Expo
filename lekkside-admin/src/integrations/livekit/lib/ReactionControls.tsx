import React, { useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { DataPacket_Kind } from 'livekit-client';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMOJIS = ['👍', '👏', '🎉', '❤️', '😂', '🔥'];

export function ReactionControls() {
  const room = useRoomContext();
  const [isOpen, setIsOpen] = useState(false);

  const sendReaction = async (emoji: string) => {
    try {
      const payload = JSON.stringify({ type: 'reaction', emoji });
      const data = new TextEncoder().encode(payload);
      
      // Send to other participants
      await room.localParticipant.publishData(data, { reliable: true, topic: 'reactions' });
      
      // Optimistically dispatch to self (publishData doesn't trigger DataReceived for the sender)
      const event = new CustomEvent('lk-data-received', { detail: { payload: data, topic: 'reactions' } });
      window.dispatchEvent(event);
      
      // Let's also just directly fire it to the room event emitter so the overlay catches it
      room.emit('dataReceived', data, room.localParticipant as any, undefined, 'reactions');
      
    } catch (e) {
      console.error('Failed to send reaction', e);
    }
  };

  return (
    <div className="absolute bottom-[18px] left-1/2 ml-[100px] sm:ml-[120px] md:ml-[140px] z-50 flex flex-col items-center">
      {isOpen && (
        <div className="absolute bottom-[56px] left-1/2 -translate-x-1/2 bg-background border rounded-full shadow-lg p-2 flex gap-2 animate-in fade-in slide-in-from-bottom-4 whitespace-nowrap">
          {EMOJIS.map(emoji => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="text-xl h-10 w-10 hover:scale-110 transition-transform"
              onClick={() => {
                sendReaction(emoji);
                setIsOpen(false);
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}
      <Button 
        variant="outline" 
        size="icon"
        className="h-10 w-10 shadow bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
        title="Reactions"
      >
        <Smile className="w-5 h-5" />
      </Button>
    </div>
  );
}
