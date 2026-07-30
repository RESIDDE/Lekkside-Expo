import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRoomContext } from '@livekit/components-react';
import { DataPacket_Kind } from 'livekit-client';
import { Smile, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomEvent } from 'livekit-client';

const EMOJIS = ['👍', '👏', '🎉', '❤️', '😂', '🔥'];

export function ReactionControls() {
  const room = useRoomContext();
  const [isOpen, setIsOpen] = useState(false);
  const [container, setContainer] = useState<Element | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(() => room.localParticipant.attributes?.handRaised === 'true');

  useEffect(() => {
    // Poll to wait for the LiveKit control bar to appear in the DOM
    const interval = setInterval(() => {
      const bar = document.querySelector('.lk-control-bar');
      if (bar) {
        let div = document.getElementById('reaction-control-container');
        if (!div) {
          div = document.createElement('div');
          div.id = 'reaction-control-container';
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.justifyContent = 'center';
          // In LiveKit, elements in lk-control-bar: Mic, Cam, Share, Chat, Settings, Leave.
          // Try to insert it before the disconnect button, or settings button.
          const leaveBtn = bar.querySelector('.lk-disconnect-button');
          if (leaveBtn) {
            bar.insertBefore(div, leaveBtn);
          } else {
            bar.appendChild(div);
          }
        }
        setContainer(div);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleAttributesChanged = (changed: Record<string, string>) => {
      if (changed.handRaised !== undefined) {
        setIsHandRaised(changed.handRaised === 'true');
      }
    };
    room.localParticipant.on(RoomEvent.ParticipantAttributesChanged, handleAttributesChanged);
    return () => {
      room.localParticipant.off(RoomEvent.ParticipantAttributesChanged, handleAttributesChanged);
    };
  }, [room.localParticipant]);

  const toggleHand = async () => {
    const newState = !isHandRaised;
    await room.localParticipant.setAttributes({ handRaised: newState ? 'true' : 'false' });
    setIsHandRaised(newState);
  };

  const sendReaction = async (emoji: string) => {
    try {
      const payload = JSON.stringify({ type: 'reaction', emoji });
      const data = new TextEncoder().encode(payload);
      
      // Send to other participants
      await room.localParticipant.publishData(data, { reliable: true, topic: 'reactions' });
      
      // Optimistically dispatch to self
      const event = new CustomEvent('lk-data-received', { detail: { payload: data, topic: 'reactions' } });
      window.dispatchEvent(event);
      
      room.emit('dataReceived', data, room.localParticipant as any, undefined, 'reactions');
      
    } catch (e) {
      console.error('Failed to send reaction', e);
    }
  };

  const content = (
    <div className="relative flex items-center justify-center gap-2">
      <div className="relative flex flex-col items-center justify-center">
        {isOpen && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-background border rounded-full shadow-lg p-2 flex gap-2 animate-in fade-in slide-in-from-bottom-4 whitespace-nowrap z-50">
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
        <button 
          className="lk-button"
          onClick={() => setIsOpen(!isOpen)}
          title="Reactions"
        >
          <Smile style={{ width: '20px', height: '20px' }} />
        </button>
      </div>

      <button 
        className="lk-button"
        onClick={toggleHand}
        title={isHandRaised ? "Lower Hand" : "Raise Hand"}
        style={{
          backgroundColor: isHandRaised ? 'rgba(255, 255, 255, 0.2)' : undefined,
          color: isHandRaised ? '#60a5fa' : undefined
        }}
      >
        <Hand style={{ width: '20px', height: '20px' }} />
      </button>
    </div>
  );

  return container ? createPortal(content, container) : null;
}
