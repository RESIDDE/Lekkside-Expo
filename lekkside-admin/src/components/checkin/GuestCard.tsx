import { memo, useState } from 'react';
import { Check, Undo2, User, Mail, Phone, Ticket, ChevronDown, ChevronUp, MoreHorizontal, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import RegistrationTicket from '../forms/RegistrationTicket';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Guest = Tables<'guests'>;

interface GuestCardProps {
  guest: Guest;
  onCheckIn: (guestId: string) => void;
  onUndoCheckIn: (guestId: string) => void;
  isLoading?: boolean;
  index?: number;
  eventName?: string;
  eventDate?: string;
  eventVenue?: string;
}

export const GuestCard = memo(function GuestCard({ 
  guest, 
  onCheckIn, 
  onUndoCheckIn, 
  isLoading, 
  index = 0,
  eventName = "Event",
  eventDate,
  eventVenue
}: GuestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const fullName = [guest.first_name, guest.last_name].filter(Boolean).join(' ') || 'Anonymous Guest';
  
  const customFields = guest.custom_fields as Record<string, unknown> | null;
  const hasCustomFields = customFields && Object.keys(customFields).length > 0;
  const hasNotes = Boolean(guest.notes);
  const hasExpandableContent = hasCustomFields || hasNotes;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    // Increased timeout to ensure React portal is fully rendered and images are ready
    setTimeout(() => {
      window.print();
      // We don't immediately set isPrinting to false because some browsers 
      // might unmount the portal before the print job is fully sent to the spooler
      setTimeout(() => {
        setIsPrinting(false);
      }, 500);
    }, 500);
  };

  const PrintPortal = ({ children }: { children: React.ReactNode }) => {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-8 print:p-0 print:static print:z-auto no-screen">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body > *:not(.print-portal-container) { display: none !important; }
            .print-portal-container { display: block !important; position: static !important; }
            .no-print { display: none !important; }
          }
          /* Hide the print preview from screen if needed, but here we want the admin to see it briefly */
          .print-portal-container { background: white; }
        ` }} />
        <div className="print-container">
          {children}
        </div>
      </div>,
      (() => {
        let el = document.getElementById('print-portal-root');
        if (!el) {
          el = document.createElement('div');
          el.id = 'print-portal-root';
          el.className = 'print-portal-container';
          document.body.appendChild(el);
        }
        return el;
      })()
    );
  };

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'bg-white border-border/40 hover:border-primary/20 rounded-[1.5rem] border shadow-sm hover:shadow-premium',
        guest.checked_in && 'bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/20'
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          {/* Status Indicator / Avatar */}
          <div className="relative">
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500',
                guest.checked_in 
                  ? 'bg-[hsl(var(--success))] scale-100 shadow-lg shadow-[hsl(var(--success))]/20' 
                  : 'bg-muted/50 group-hover:bg-primary/10'
              )}
            >
              {guest.checked_in ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <User className={cn(
                  "w-6 h-6 transition-colors duration-300",
                  guest.checked_in ? "text-white" : "text-muted-foreground group-hover:text-primary"
                )} />
              )}
            </div>
            {guest.checked_in && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm"
              >
                <div className="w-2 h-2 bg-[hsl(var(--success))] rounded-full animate-pulse" />
              </motion.div>
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-foreground text-sm sm:text-base tracking-tight truncate">
                {fullName}
              </h3>
              {guest.ticket_type && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                  {guest.ticket_type}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground/80">
              {guest.email && (
                <span className="flex items-center gap-1.5 truncate max-w-[140px] sm:max-w-[220px]">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{guest.email}</span>
                </span>
              )}
              {guest.phone && (
                <span className="hidden sm:flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {guest.phone}
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {guest.checked_in ? (
                <motion.div
                  key="undo"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUndoCheckIn(guest.id)}
                    disabled={isLoading}
                    className="h-10 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground gap-2"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Undo</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="checkin"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isLoading}
                        className="h-10 px-4 rounded-xl text-xs font-semibold bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white shadow-lg shadow-[hsl(var(--success))]/10 gap-2 pr-2"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        <span className="hidden sm:inline">Check In</span>
                        <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl shadow-premium border-border/40 p-2 min-w-[180px]">
                      <DropdownMenuItem 
                        onClick={() => onCheckIn(guest.id)}
                        className="rounded-xl py-2.5 font-semibold text-xs gap-3 cursor-pointer"
                      >
                        <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                        Check-in Only
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          onCheckIn(guest.id);
                          handlePrint();
                        }}
                        className="rounded-xl py-2.5 font-semibold text-xs gap-3 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-primary" />
                        Check-in & Print
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrint}
              className="h-10 w-10 rounded-xl border-border/40 text-muted-foreground hover:text-primary hover:border-primary/20"
              title="Print Ticket"
            >
              <Printer className="w-4 h-4" />
            </Button>
            
            {hasExpandableContent && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  "h-10 w-10 rounded-xl transition-colors",
                  isExpanded ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && hasExpandableContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-4 border-t border-border/40 space-y-4">
                {/* Check-in Details */}
                {guest.checked_in && guest.checked_in_at && (
                  <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/10 w-fit">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                      Arrival: {format(new Date(guest.checked_in_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom Fields */}
                  {hasCustomFields && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">Metadata</p>
                      <div className="space-y-1.5">
                        {Object.entries(customFields).map(([key, value]) => {
                          if (!value) return null;
                          const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                          return (
                            <div key={key} className="flex items-center justify-between p-2 px-3 rounded-lg bg-muted/30 border border-transparent hover:border-border/30 transition-colors">
                              <span className="text-[11px] font-semibold text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="text-[11px] font-semibold text-foreground">{displayValue}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {hasNotes && (
                    <div className="space-y-2">
                       <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">Notes</p>
                       <div className="p-3 rounded-xl bg-muted/30 border border-border/30 min-h-[60px]">
                         <p className="text-[11px] font-medium leading-relaxed text-muted-foreground italic">
                           "{guest.notes}"
                         </p>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isPrinting && (
        <PrintPortal>
          <RegistrationTicket
            firstName={guest.first_name}
            lastName={guest.last_name}
            email={guest.email || undefined}
            phone={guest.phone || undefined}
            notes={guest.notes || undefined}
            customFields={customFields as Record<string, string | boolean> || undefined}
            eventName={eventName}
            eventDate={eventDate}
            eventVenue={eventVenue}
            confirmationNumber={`LEKK-${guest.id.slice(0, 8).toUpperCase()}`}
            registeredAt={guest.created_at}
            image_url={(customFields?.['Attendee Photo'] as string) || undefined}
          />
        </PrintPortal>
      )}
    </motion.div>
  );
});
