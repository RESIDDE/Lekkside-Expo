import React, { useState } from 'react';
import { useParticipants, useRoomContext } from '@livekit/components-react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, MicOff, Mic, UserX, Lock, Unlock, Users, ChevronRight, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModerator } from './ModeratorContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ModerationPanel() {
  const room = useRoomContext();
  const participants = useParticipants();
  const [isLocked, setIsLocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAllMuted, setIsAllMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<string | null>(null);
  const { isModerator: contextIsModerator } = useModerator();
  const isOriginalHost = !!localStorage.getItem(`host_secret_${room.name}`);

  let isModerator = contextIsModerator || isOriginalHost;
  try {
    if (room.localParticipant.metadata) {
      const meta = JSON.parse(room.localParticipant.metadata);
      if (meta.isModerator) isModerator = true;
    }
  } catch (e) {}
  if ((room.localParticipant.permissions as any)?.roomAdmin) {
    isModerator = true;
  }

  const handleModerationAction = async (action: string, payload: any) => {
    try {
      setIsProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      const hostSecret = localStorage.getItem(`host_secret_${room.name}`) || undefined;
      const livekitToken = localStorage.getItem(`livekit_token_${room.name}`) || undefined;

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
          livekitToken,
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

  const toggleMuteAll = async () => {
    const newMutedState = !isAllMuted;
    for (const p of participants) {
      if (p.identity === room.localParticipant.identity) continue;
      await handleModerationAction('updateParticipant', {
        identity: p.identity,
        permissions: { 
          canPublish: !newMutedState,
          canPublishData: true,
          canSubscribe: true 
        }
      });
    }
    setIsAllMuted(newMutedState);
  };

  const handleMuteParticipant = async (identity: string, currentMuted: boolean) => {
    await handleModerationAction('updateParticipant', {
      identity,
      permissions: { canPublish: currentMuted, canPublishData: true, canSubscribe: true }
    });
  };

  const confirmRemoveParticipant = async () => {
    if (!participantToRemove) return;
    await handleModerationAction('removeParticipant', { identity: participantToRemove });
    setParticipantToRemove(null);
  };

  const handleMakeModerator = async (identity: string) => {
    await handleModerationAction('updateMetadata', {
      identity,
      metadata: JSON.stringify({ isModerator: true })
    });
  };

  const toggleRoomLock = async () => {
    const action = isLocked ? 'unlockRoom' : 'lockRoom';
    await handleModerationAction(action, {});
    setIsLocked(!isLocked);
  };

  if (!isOpen) {
    return (
      <Button 
        variant="default"
        className="absolute right-0 top-24 rounded-l-xl rounded-r-none shadow-lg z-50 flex items-center gap-2 pr-4 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
      >
        <ChevronLeft className="w-4 h-4" />
        <Users className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <>
      <div className="absolute right-4 top-24 w-80 bg-background text-foreground border rounded-xl shadow-lg p-4 flex flex-col max-h-[70vh] z-50 transition-all duration-300">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Participants
          </h3>
          <div className="flex items-center gap-1">
            {isOriginalHost && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleRoomLock}
                disabled={isProcessing}
                className={isLocked ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-none" : "border-none"}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="border-none"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isModerator && (
          <div className="flex flex-col gap-2 mb-4">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={toggleMuteAll}
              disabled={isProcessing || participants.length <= 1}
              className="w-full text-foreground"
            >
              {isAllMuted ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
              {isAllMuted ? "Unmute All Attendees" : "Mute All Attendees"}
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" />
            In Meeting ({participants.length})
          </h4>
          <div className="flex flex-col gap-2">
            {participants.map(p => {
              const isLocal = p.identity === room.localParticipant.identity;
              const cannotPublish = p.permissions?.canPublish === false;
              let isMod = false;
              try {
                if (p.metadata) {
                  const meta = JSON.parse(p.metadata);
                  isMod = !!meta.isModerator;
                }
              } catch (e) {
                // ignore parse error
              }
              const isHostOrMod = (p.permissions as any)?.roomAdmin || isMod;
              
              return (
                <div key={p.identity} className="flex items-center justify-between p-2 rounded-lg border bg-card text-foreground text-sm">
                  <span className="truncate pr-2 font-medium flex items-center gap-1 text-foreground">
                    {p.name?.trim() || p.identity}
                    {isLocal && <span className="text-muted-foreground text-xs font-normal">(You)</span>}
                    {isHostOrMod && <span className="text-[10px] uppercase font-bold text-primary border border-primary/30 bg-primary/10 px-1 rounded ml-1">Host</span>}
                  </span>
                  
                  <div className="flex gap-1 items-center">
                    {isModerator ? (
                      <>
                        {!isLocal && !isHostOrMod && isOriginalHost && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleMakeModerator(p.identity)}
                            title="Make Moderator"
                            disabled={isProcessing}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-amber-500 disabled:opacity-50"
                          onClick={() => handleMuteParticipant(p.identity, cannotPublish)}
                          title={cannotPublish ? "Unmute Mic" : "Mute/Disable Mic"}
                          disabled={isProcessing || isLocal}
                        >
                          {cannotPublish ? <Mic className="w-3.5 h-3.5 text-red-500" /> : <MicOff className="w-3.5 h-3.5" />}
                        </Button>
                        {!isLocal && isOriginalHost && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setParticipantToRemove(p.identity)}
                            title="Remove Participant"
                            disabled={isProcessing}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </>
                    ) : (
                      // For non-moderators, just show mic status
                      <div className="p-1">
                        {cannotPublish ? <Mic className="w-3.5 h-3.5 text-red-500" /> : <MicOff className="w-3.5 h-3.5 text-muted-foreground/50" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AlertDialog open={!!participantToRemove} onOpenChange={(open) => !open && setParticipantToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this participant from the meeting? They will need to rejoin to participate again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmRemoveParticipant();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
