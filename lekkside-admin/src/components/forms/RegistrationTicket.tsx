import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, User, Mail, Phone, FileText, Hash, Clock } from "lucide-react";
import { format } from "date-fns";
import lekkLogo from "@/assets/lekkside-logo.png";
import { Badge } from "@/components/ui/badge";
import { QRCodeCanvas } from "qrcode.react";

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

const RegistrationTicket = ({
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
}: RegistrationTicketProps) => {
  return (
    <Card className="w-full max-w-md rounded-2xl overflow-hidden border-2 border-dashed border-primary/30 bg-card">
      {/* Ticket Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-12 text-center relative">
        <img src={lekkLogo} alt="Lekkside" className="h-8 mx-auto mb-2 brightness-0 invert" />
        <h2 className="text-xl font-semibold">{eventName}</h2>
        <Badge variant="secondary" className="mt-2 bg-white/20 text-white hover:bg-white/30">
          ✓ Registration Confirmed
        </Badge>
      </div>

      {/* Attendee Photo - Floating */}
      {image_url && (
        <div className="relative -mt-10 mb-2 flex justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
            <img src={image_url} alt="Attendee" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Ticket Body */}
      <CardContent className="p-6 space-y-4">
        {/* Attendee Name - Prominent */}
        <div className="text-center pb-4 border-b border-dashed">
          <p className="text-sm text-muted-foreground mb-1">Attendee</p>
          <h3 className="text-2xl font-semibold">{firstName} {lastName}</h3>
        </div>

        {/* Event Details */}
        <div className="space-y-3">
          {eventDate && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date & Time</p>
                <p className="font-medium">{format(new Date(eventDate), "EEEE, MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(eventDate), "h:mm a")}</p>
              </div>
            </div>
          )}

          {eventVenue && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Venue</p>
                <p className="font-medium">{eventVenue}</p>
              </div>
            </div>
          )}
        </div>

        {/* Registration Details */}
        <div className="pt-4 border-t border-dashed space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Registration Details</p>
          
          {email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{email}</span>
            </div>
          )}

          {phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{phone}</span>
            </div>
          )}

          {notes && (
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm">{notes}</span>
            </div>
          )}

          {/* Custom Fields */}
          {customFields && Object.keys(customFields).length > 0 && (
            <div className="space-y-2 pt-2">
              {Object.entries(customFields).map(([label, value]) => (
                <div key={label} className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <p className="text-sm font-medium">
                      {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation Footer */}
        <div className="pt-4 border-t border-dashed">
          <div className="bg-muted/50 rounded-xl p-6 text-center space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Confirmation Number</p>
              <p className="text-2xl font-mono font-bold tracking-[0.2em] text-primary">
                {confirmationNumber}
              </p>
            </div>

            {/* QR Code Section */}
            <div className="flex justify-center py-2">
              <div className="bg-white p-3 rounded-2xl shadow-sm inline-block border border-gray-100">
                <QRCodeCanvas 
                  value={confirmationNumber} 
                  size={140}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="h-3 w-3" />
              <span>Registered on {format(new Date(registeredAt), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationTicket;
