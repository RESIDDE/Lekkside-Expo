import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Video, Copy, Play, DoorOpen, VideoIcon, PlusCircle, Check, Radio, Trash2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export default function Meetings() {
  const [roomName, setRoomName] = useState(() => localStorage.getItem("lekkside_admin_meeting_room") || "");
  const [isCopied, setIsCopied] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [lastMeetingRoomId, setLastMeetingRoomId] = useState<string | null>(null);
  const [isCopiedLast, setIsCopiedLast] = useState(false);
  
  useEffect(() => {
    if (roomName) {
      localStorage.setItem("lekkside_admin_meeting_room", roomName);
    }
  }, [roomName]);

  // Fetch current live status on mount
  useEffect(() => {
    async function fetchStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_live, meeting_room_id, last_meeting_room_id')
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setIsLive(data.is_live || false);
        if (data.last_meeting_room_id) {
          setLastMeetingRoomId(data.last_meeting_room_id);
          setRoomName(data.last_meeting_room_id);
        }
        if (data.meeting_room_id) {
          setRoomName(data.meeting_room_id);
        }
      }
    }
    fetchStatus();
  }, []);

  const saveLastRoom = async (room: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('profiles')
        .update({ last_meeting_room_id: room })
        .eq('user_id', user.id);
      setLastMeetingRoomId(room);
    } catch (error) {
      console.error("Failed to save last room", error);
    }
  };

  const deleteLastRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('profiles')
        .update({ last_meeting_room_id: null })
        .eq('user_id', user.id);
      setLastMeetingRoomId(null);
      toast({ title: "Deleted", description: "Last used room cleared." });
    } catch (error) {
      console.error("Failed to delete last room", error);
    }
  };

  const toggleBroadcast = async () => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newStatus = !isLive;
      const { error } = await supabase
        .from('profiles')
        .update({
          is_live: newStatus,
          meeting_room_id: newStatus ? roomName : null
        })
        .eq('user_id', user.id);

      if (error) throw error;
      setIsLive(newStatus);
      if (newStatus && roomName) {
        await saveLastRoom(roomName);
      }
      
      toast({
        title: newStatus ? "Broadcast Started" : "Broadcast Ended",
        description: newStatus ? "Your event is now live to all students and universities." : "Your live event has been taken down.",
      });
    } catch (err) {
      console.error("Error toggling broadcast:", err);
      toast({
        title: "Error",
        description: "Failed to update broadcast status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const generateRoomName = () => {
    const words = ['expo', 'connect', 'global', 'summit', 'insight', 'future', 'edu', 'talent'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomChars = Math.random().toString(36).substring(2, 6);
    setRoomName(`${randomWord}-${randomChars}`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast({
        title: "Room Name Required",
        description: "Please enter or generate a room name.",
        variant: "destructive",
      });
      return;
    }
    saveLastRoom(roomName);
    navigate(`/meetings/${roomName}`);
  };

  const copyLink = () => {
    if (!roomName.trim()) return;
    const link = `${window.location.origin}/meetings/${roomName}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard. You can share this link with participants.",
    });
  };

  const copyLastRoomLink = () => {
    if (!lastMeetingRoomId) return;
    const link = `${window.location.origin}/meetings/${lastMeetingRoomId}`;
    navigator.clipboard.writeText(link);
    setIsCopiedLast(true);
    setTimeout(() => setIsCopiedLast(false), 2000);
    toast({
      title: "Link Copied",
      description: "Previous meeting link copied to clipboard.",
    });
  };

  return (
    <AppLayout>
      <div className="relative min-h-[80vh] flex flex-col p-6 sm:p-12 overflow-hidden bg-slate-50/50">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[100px] opacity-60 pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest mx-auto mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Live Workspace
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-900 drop-shadow-sm">
              Video Meetings
            </h1>
            <p className="text-slate-500 text-lg max-w-xl mx-auto font-light leading-relaxed">
              Create, manage, and join high-quality video meetings for your events, exhibitors, and internal teams seamlessly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-0 shadow-2xl shadow-indigo-100/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <CardHeader className="pb-6 pt-10 px-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                    <VideoIcon className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-display font-bold text-slate-800">
                    Join or Create a Room
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-base">
                    Enter an existing room name to jump in, or automatically generate a secure new room URL to share.
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={joinMeeting}>
                  <CardContent className="px-8 pb-6 space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="roomName" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Room Identifier
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          id="roomName"
                          placeholder="e.g. general-session"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          disabled={isLive}
                          className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500/20 font-medium text-lg placeholder:font-normal placeholder:text-slate-400 px-5 transition-all focus:bg-white disabled:opacity-50"
                        />
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={generateRoomName}
                                disabled={isLive}
                                className="h-14 w-14 rounded-2xl border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 p-0 disabled:opacity-50"
                              >
                                <DoorOpen className="h-5 w-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Auto-generate secure room name</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Broadcast Toggle */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          <Radio className={`w-4 h-4 ${isLive ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                          Broadcast as Main Event
                        </span>
                        <span className="text-xs text-slate-500 mt-1 max-w-[200px]">
                          Push this meeting to all student and university dashboards.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleBroadcast}
                        disabled={isUpdating || !roomName.trim()}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          isLive ? 'bg-red-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                            isLive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                  </CardContent>
                  
                  <div className="px-8 pb-8 flex gap-3 flex-col sm:flex-row pt-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={copyLink}
                      disabled={!roomName.trim()}
                      className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold tracking-wide transition-all flex-1"
                    >
                      <AnimatePresence mode="wait">
                        {isCopied ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-700">Copied</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            Copy Link
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!roomName.trim()}
                      className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide transition-all shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 flex-1 flex gap-2 items-center"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Join Meeting
                    </Button>
                  </div>
                </form>

                {lastMeetingRoomId && (
                  <div className="px-8 pb-8 pt-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <History className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">Last Active Session</h4>
                            <p className="text-xs text-slate-500 font-medium">{lastMeetingRoomId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                                  onClick={copyLastRoomLink}
                                >
                                  {isCopiedLast ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Copy Link</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl border-red-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  onClick={deleteLastRoom}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Delete Room History</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden md:flex flex-col justify-center items-center h-full p-8"
            >
              <div className="relative w-full max-w-sm aspect-square">
                {/* Abstract illustrative elements for the meetings page */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute inset-8 bg-white rounded-full shadow-2xl flex items-center justify-center p-8 z-10 overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10" />
                   <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -ml-10 -mb-10" />
                   
                   <div className="relative z-20 text-center space-y-4">
                     <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                       <Video className="w-8 h-8" />
                     </div>
                     <h3 className="font-display font-bold text-slate-800 text-xl">High Quality Audio & Video</h3>
                     <p className="text-sm text-slate-500">End-to-end encrypted rooms powered by LiveKit for seamless collaboration.</p>
                   </div>
                </div>
                
                {/* Floating elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute top-4 -right-4 w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center z-20 rotate-12 border border-slate-100"
                >
                  <span className="text-xl">👋</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
          
        </div>
      </div>
    </AppLayout>
  );
}
