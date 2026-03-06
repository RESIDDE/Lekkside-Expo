import { Calendar, MapPin, Mail, Phone, Clock, CheckCircle2, FileText } from "lucide-react";
import { format } from "date-fns";
import { QRCodeCanvas } from 'qrcode.react';

interface RegistrationTicketProps {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  customFields?: Record<string, string | boolean>;
  eventName: string;
  eventDate?: string;
  eventVenue?: string;
  image_url?: string;
  confirmationNumber: string;
  registeredAt: string;
}

export default function RegistrationTicket({
  firstName,
  lastName,
  email,
  phone,
  notes,
  customFields,
  eventName,
  eventDate,
  eventVenue,
  image_url,
  confirmationNumber,
  registeredAt,
}: RegistrationTicketProps) {
  return (
    <div 
      id="printable-ticket"
      className="w-full max-w-md mx-auto rounded-[2rem] overflow-hidden border-2 border-dashed border-primary/30 bg-[#111111] shadow-2xl"
    >
      {/* Ticket Header */}
      <div className="relative h-32 flex flex-col items-center justify-center text-center overflow-hidden">
        {image_url ? (
          <>
            <img 
              src={image_url} 
              alt={eventName} 
              className="absolute inset-0 w-full h-full object-cover brightness-[0.4] grayscale-[0.3]" 
            />
            <div className="absolute inset-0 bg-primary/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-primary" />
        )}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full mt-2" />
        <h2 className="relative text-2xl font-bold text-white font-display mt-2 px-4 line-clamp-2">{eventName}</h2>
        <div className="relative inline-flex items-center gap-2 mt-3 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
          <CheckCircle2 className="h-3 w-3" />
          Confirmed
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-8 space-y-6 relative">
        {/* Decorator Circles */}
        <div className="absolute -left-3 top-[-12px] w-6 h-6 rounded-full bg-[#0A0A0A]" />
        <div className="absolute -right-3 top-[-12px] w-6 h-6 rounded-full bg-[#0A0A0A]" />
        
        {/* Attendee Name */}
        <div className="text-center pb-6 border-b border-dashed border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Attendee</p>
          <h3 className="text-3xl font-bold font-display text-white">{firstName} {lastName}</h3>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 gap-4">
          {eventDate && (
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Date & Time</p>
                <p className="text-sm font-semibold text-white">{format(new Date(eventDate), "EEEE, MMMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(eventDate), "h:mm a")}</p>
              </div>
            </div>
          )}

          {eventVenue && (
            <div className="flex items-start gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Venue</p>
                <p className="text-sm font-semibold text-white">{eventVenue}</p>
              </div>
            </div>
          )}
        </div>

        {/* Registration Details */}
        <div className="space-y-4 pt-2">
          {email && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-white/80">{email}</span>
            </div>
          )}

          {phone && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-white/80">{phone}</span>
            </div>
          )}

          {notes && (
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="italic text-white/80">"{notes}"</span>
            </div>
          )}

          {/* Custom Fields */}
          {customFields && Object.keys(customFields).length > 0 && (
            <div className="grid grid-cols-1 gap-3 pt-2">
              {Object.entries(customFields).map(([label, value]) => (
                <div key={label} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-medium text-white">
                    {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation Footer */}
        <div className="pt-6 border-t border-dashed border-white/10">
          <div className="bg-white/5 rounded-[1.5rem] p-5 text-center space-y-4 border border-white/10">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Confirmation Number</p>
              <p className="text-2xl font-mono font-bold tracking-[0.2em] text-primary">
                {confirmationNumber}
              </p>
            </div>
            
            {/* QR Code Section */}
            <div className="flex justify-center py-2 bg-white rounded-xl p-4">
              <QRCodeCanvas 
                value={confirmationNumber} 
                size={120}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(registeredAt), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Notch */}
      <div className="h-4 bg-primary/20 flex items-center justify-center">
        <div className="flex gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-primary/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
