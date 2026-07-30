import React, { useEffect } from 'react';
import { useParticipants } from '@livekit/components-react';

export function RaisedHandsList() {
  const participants = useParticipants();

  // Also apply big hand emojis on the participant tiles directly
  useEffect(() => {
    const syncHands = () => {
      participants.forEach((p) => {
        // Find the tile by data attribute which livekit provides
        // Also fallback to looking at the name tag if data attribute is missing
        const tiles = document.querySelectorAll('.lk-participant-tile');
        let targetTile: Element | null = null;
        
        tiles.forEach(tile => {
           if (tile.getAttribute('data-lk-participant-identity') === p.identity) {
             targetTile = tile;
           }
        });

        if (targetTile) {
          let handDiv = targetTile.querySelector('.raised-hand-overlay');
          const isRaised = p.attributes?.handRaised === "true";
          
          if (isRaised) {
            if (!handDiv) {
              handDiv = document.createElement('div');
              handDiv.className = 'raised-hand-overlay';
              // Style it to be a big plain emoji on the profile
              handDiv.style.position = 'absolute';
              handDiv.style.top = '16px';
              handDiv.style.right = '16px';
              handDiv.style.fontSize = '48px';
              handDiv.style.zIndex = '50';
              handDiv.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))';
              handDiv.innerText = '✋';
              targetTile.appendChild(handDiv);
            }
          } else {
            if (handDiv) {
              handDiv.remove();
            }
          }
        }
      });
    };

    const intervalId = setInterval(syncHands, 500);
    return () => clearInterval(intervalId);
  }, [participants]);

  const raisedHands = participants.filter(p => p.attributes?.handRaised === "true");

  if (raisedHands.length === 0) return null;

  return (
    <div className="absolute top-20 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {raisedHands.map(p => (
        <div key={p.identity} className="bg-blue-600/90 backdrop-blur text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-left-4 fade-in">
          <span className="text-lg">✋</span>
          <span className="text-sm font-semibold truncate max-w-[250px]">
            {p.name || p.identity} wants to speak
          </span>
        </div>
      ))}
    </div>
  );
}
