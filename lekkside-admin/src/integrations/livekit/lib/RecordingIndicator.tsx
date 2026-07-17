import { useIsRecording } from '@livekit/components-react';
import * as React from 'react';
import { useToast } from "@/components/ui/use-toast";

export function RecordingIndicator() {
  const isRecording = useIsRecording();
  const [wasRecording, setWasRecording] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isRecording !== wasRecording) {
      setWasRecording(isRecording);
      if (isRecording) {
        toast({
          title: "🎥 Recording Started",
          description: "This meeting is being recorded",
          duration: 3000,
        });
      }
    }
  }, [isRecording, wasRecording, toast]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        boxShadow: isRecording ? 'var(--lk-danger3) 0px 0px 0px 3px inset' : 'none',
        pointerEvents: 'none',
      }}
    ></div>
  );
}
