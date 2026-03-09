import { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface LeadNote {
  id: string;
  booth_lead_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface BoothLead {
  id: string;
  guest_id: string;
  is_relevant: boolean;
  tags: string[];
  lead_score: number;
  guest?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface LeadNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: BoothLead;
  onNotesUpdated: () => void;
}

export function LeadNotesDialog({
  open,
  onOpenChange,
  lead,
  onNotesUpdated,
}: LeadNotesDialogProps) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadNotes();
    }
  }, [open, lead.id]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("booth_lead_id", lead.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notes.",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) {
      toast({
        title: "Validation Error",
        description: "Note text cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add notes.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("lead_notes").insert({
        booth_lead_id: lead.id,
        note: newNoteText.trim(),
        created_by: user.id,
      });

      if (error) throw error;

      setNewNoteText("");
      await loadNotes();
      onNotesUpdated();

      toast({
        title: "Note Added",
        description: "Your note has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add note.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteText.trim()) {
      toast({
        title: "Validation Error",
        description: "Note text cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("lead_notes")
        .update({ note: editingNoteText.trim() })
        .eq("id", noteId);

      if (error) throw error;

      setEditingNoteId(null);
      setEditingNoteText("");
      await loadNotes();
      onNotesUpdated();

      toast({
        title: "Note Updated",
        description: "Your note has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update note.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("lead_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      await loadNotes();
      onNotesUpdated();

      toast({
        title: "Note Deleted",
        description: "Your note has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (note: LeadNote) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black flex items-center gap-2">
            Notes for {lead.guest?.first_name} {lead.guest?.last_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-bold">
            {lead.guest?.email}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-primary">
              Add New Note
            </label>
            <Textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Enter your note here..."
              className="min-h-[100px] rounded-2xl bg-muted/20 border-border/40 resize-none"
            />
            <Button
              onClick={handleAddNote}
              disabled={isLoading || !newNoteText.trim()}
              className="w-full rounded-2xl font-bold gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </Button>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-primary">
              Previous Notes ({notes.length})
            </label>
            <AnimatePresence mode="popLayout">
              {notes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No notes yet. Add your first note above.
                </motion.div>
              ) : (
                notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    layout
                  >
                    <Card className="p-4 rounded-2xl border-border/40 space-y-3">
                      {editingNoteId === note.id ? (
                        <>
                          <Textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            className="min-h-[80px] rounded-xl bg-muted/20 border-border/40 resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={isLoading}
                              className="rounded-xl gap-1"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              disabled={isLoading}
                              className="rounded-xl gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {note.note}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-border/40">
                            <p className="text-xs text-muted-foreground font-bold">
                              {new Date(note.created_at).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(note)}
                                disabled={isLoading}
                                className="rounded-xl gap-1 h-8"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={isLoading}
                                className="rounded-xl gap-1 h-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
