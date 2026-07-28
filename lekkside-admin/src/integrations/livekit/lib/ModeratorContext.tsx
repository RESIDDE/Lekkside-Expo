import React, { createContext, useContext, useState } from 'react';

interface ModeratorContextValue {
  isModerator: boolean;
  setIsModerator: (val: boolean) => void;
}

const ModeratorContext = createContext<ModeratorContextValue>({
  isModerator: false,
  setIsModerator: () => {},
});

export function ModeratorProvider({ children }: { children: React.ReactNode }) {
  const [isModerator, setIsModerator] = useState(false);
  return (
    <ModeratorContext.Provider value={{ isModerator, setIsModerator }}>
      {children}
    </ModeratorContext.Provider>
  );
}

export function useModerator(): ModeratorContextValue {
  return useContext(ModeratorContext);
}
