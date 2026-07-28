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
      room.emit('dataReceived', data, room.localParticipant, undefined, 'reactions');
      
    } catch (e) {
      console.error('Failed to send reaction', e);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-50 flex items-end gap-2">
      {isOpen && (
        <div className="bg-background border rounded-full shadow-lg p-2 flex gap-2 animate-in fade-in slide-in-from-right-4">
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
        variant="default" 
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Smile className="w-6 h-6" />
      </Button>
    </div>
  );
}
