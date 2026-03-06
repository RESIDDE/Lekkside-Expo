import { useState } from "react";
import { FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormsDialog } from "./FormsDialog";
import { motion } from "framer-motion";

interface FormsButtonProps {
  eventId: string;
}

export const FormsButton = ({ eventId }: FormsButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="h-11 px-6 rounded-2xl border-border/50 bg-white hover:bg-muted font-bold text-muted-foreground gap-2 transition-all shadow-sm"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-4 w-4" />
        <span>Forms</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
      </Button>
      <FormsDialog eventId={eventId} open={open} onOpenChange={setOpen} />
    </>
  );
};
