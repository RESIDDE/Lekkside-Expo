import React, { useState, useEffect } from "react";
import { Video, Copy, Play, DoorOpen, PlusCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UniversityVideoMeetings() {
  const [roomName, setRoomName] = useState(() => localStorage.getItem("lekkside_uni_meeting_room") || "");
  const [isCopied, setIsCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("lekkside_uni_meeting_room", roomName);
  }, [roomName]);

  const generateRoomName = () => {
    const words = ['expo', 'connect', 'global', 'summit', 'insight', 'future', 'edu', 'talent'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomChars = Math.random().toString(36).substring(2, 6);
    setRoomName(`${randomWord}-${randomChars}`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      return;
    }
    const meetingsUrl = import.meta.env.VITE_MEETINGS_URL || 'http://localhost:8080';
    window.open(`${meetingsUrl}/meetings/${roomName}`, "_blank");
  };

  const copyLink = () => {
    if (!roomName.trim()) return;
    const meetingsUrl = import.meta.env.VITE_MEETINGS_URL || 'http://localhost:8080';
    const link = `${meetingsUrl}/meetings/${roomName}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setCopiedMessage("Link Copied!");
    setTimeout(() => {
      setIsCopied(false);
      setCopiedMessage("");
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left side: Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Live Workspace
            </div>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
              Video Meetings
            </h2>
            <p className="text-gray-500 text-lg">
              Create and manage instant high-quality video meetings for your events, exhibitors, and internal teams seamlessly.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Join or Create a Room</h3>
              <p className="text-gray-500 text-sm">
                Enter an existing room name to jump in, or generate a secure new room URL.
              </p>
            </div>

            <form onSubmit={joinMeeting} className="space-y-6 pt-2">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Room Identifier
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g. general-session"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="flex-1 h-14 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-lg px-5 transition-all focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={generateRoomName}
                    title="Auto-generate secure room name"
                    className="h-14 w-14 flex items-center justify-center rounded-2xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                  >
                    <DoorOpen className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={copyLink}
                  disabled={!roomName.trim()}
                  className="h-14 flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                </button>
                <button
                  type="submit"
                  disabled={!roomName.trim()}
                  className="h-14 flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Join Meeting
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Right side: Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden md:flex flex-col justify-center items-center h-full p-8 relative"
        >
          <div className="relative w-full max-w-sm aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute inset-8 bg-white rounded-full shadow-2xl flex items-center justify-center p-8 relative z-10 overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -ml-10 -mb-10" />
               
               <div className="relative z-20 text-center space-y-4">
                 <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                   <Video className="w-8 h-8" />
                 </div>
                 <h3 className="font-bold text-gray-800 text-xl">High Quality Video</h3>
                 <p className="text-sm text-gray-500 font-medium">End-to-end encrypted rooms powered by LiveKit for seamless collaboration.</p>
               </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
