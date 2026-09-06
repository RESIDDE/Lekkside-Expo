import { memo, useState } from 'react';
import { Check, Undo2, User, Mail, Phone, Ticket, ChevronDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const handleToggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
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
    <div
      className={cn(
        'group relative transition-all duration-300',
        'bg-white border-border/40 hover:border-primary/20 rounded-[1.5rem] border shadow-sm hover:shadow-md',
        guest.checked_in && 'bg-emerald-50/30 border-emerald-200/50'
      )}
    >
      <div className="p-4 sm:p-5">
        {/* Header Block: Responsive Flex */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Main Info (Avatar + Name + Details) */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative shrink-0 mt-0.5 sm:mt-0">
              <div
                className={cn(
                  'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300',
                  guest.checked_in 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                )}
              >
                {guest.checked_in ? (
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" />
                ) : (
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              {guest.checked_in && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {/* Attendee Name and Badges */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate max-w-[200px] xs:max-w-[280px] sm:max-w-none">
                  {fullName}
                </h3>
                {guest.ticket_type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {guest.ticket_type}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                {guest.email && (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate max-w-[170px] xs:max-w-[240px] sm:max-w-[280px] font-medium">{guest.email}</span>
                  </span>
                )}
                {guest.phone && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>{guest.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
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
                      className="h-10 px-3.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 gap-1.5"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Undo</span>
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
                          className="h-10 px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          <span>Check In</span>
                          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl shadow-premium border-border/40 p-2 min-w-[180px]">
                        <DropdownMenuItem 
                          onClick={() => onCheckIn(guest.id)}
                          className="rounded-xl py-2.5 font-semibold text-xs gap-3 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
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
                className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30"
                title="Print Ticket"
              >
                <Printer className="w-4 h-4" />
              </Button>
            </div>

            {/* Dropdown Chevron Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleExpand}
              className={cn(
                "h-10 px-3 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold",
                isExpanded 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
              )}
              title={isExpanded ? "Hide Details" : "View Details"}
            >
              <span className="hidden xs:inline">{isExpanded ? "Hide" : "Details"}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
            </Button>
          </div>
        </div>

        {/* Expandable Mobile Dropdown Box */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                {/* Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Attendee Information & Metadata
                    </span>
                  </div>
                  {guest.checked_in && guest.checked_in_at && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                      Arrival: {format(new Date(guest.checked_in_at), 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>

                {/* Grid of Clean Card Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirmation Ref</span>
                    <span className="text-xs font-mono font-bold text-slate-800 mt-0.5">LEKK-{guest.id.slice(0, 8).toUpperCase()}</span>
                  </div>

                  {guest.created_at && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registration Date</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5">{format(new Date(guest.created_at), 'PPP, h:mm a')}</span>
                    </div>
                  )}

                  {guest.ticket_number && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket Number</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 break-all">{guest.ticket_number}</span>
                    </div>
                  )}

                  {guest.email && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 break-all">{guest.email}</span>
                    </div>
                  )}

                  {guest.phone && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 break-all">{guest.phone}</span>
                    </div>
                  )}

                  {/* Custom Metadata Fields */}
                  {hasCustomFields && Object.entries(customFields!).map(([key, value]) => {
                    if (value === null || value === undefined || value === '') return null;
                    const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                    return (
                      <div key={key} className="p-3 rounded-xl bg-white border border-slate-200/60 flex flex-col justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 break-all">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Special Notes */}
                {hasNotes && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Special Notes</span>
                    <p className="text-xs font-medium text-amber-900 leading-relaxed italic">
                      "{guest.notes}"
                    </p>
                  </div>
                )}
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
    </div>
  );
});
