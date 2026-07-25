import React from 'react';
import { ChatWindow } from './ChatWindow';

interface LekksideSupportChatProps {
  user: any;
}

export function LekksideSupportChat({ user }: LekksideSupportChatProps) {
  if (!user) return null;

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div className="w-full max-w-4xl h-[700px] bg-black rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)] relative">
        <ChatWindow 
          universityId="00000000-0000-0000-0000-000000000000"
          universityName="Lekkside Support"
          onClose={() => {}}
          inline={true}
        />
      </div>
    </div>
  );
}
