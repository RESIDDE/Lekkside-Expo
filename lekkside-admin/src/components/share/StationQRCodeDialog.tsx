import { useRef } from "react";
import { Download, QrCode, Monitor, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface StationQRCodeDialogProps {
  stationId: string;
  stationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StationQRCodeDialog({
  stationId,
  stationName,
  open,
  onOpenChange,
}: StationQRCodeDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const stationUrl = `${window.location.origin}/checkin/${stationId}`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const padding = 80;
      const qrSize = 600;
      canvas.width = qrSize + padding * 2;
      canvas.height = qrSize + padding * 2 + 140; 

      // High-precision white background
      ctx.fillStyle = "#ffffff";
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, canvas.width, canvas.height, 60);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw QR Code
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      
      // Branding Overlay
      ctx.fillStyle = "#020617";
      ctx.font = "900 32px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(stationName.toUpperCase(), canvas.width / 2, canvas.height - 100);
      
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText("OPERATIONAL CHECK-IN PASSPORT", canvas.width / 2, canvas.height - 65);
      
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(canvas.width / 3, canvas.height - 40, canvas.width / 3, 4);

      const pngFile = canvas.toDataURL("image/png", 1.0);
      const downloadLink = document.createElement("a");
      downloadLink.download = `station_passport_${stationName.toLowerCase().replace(/\s+/g, "_")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast({
        title: "Station Passport Saved",
        description: "High-resolution operational QR code is ready.",
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-premium bg-white">
        <div className="relative p-8">
          {/* Header Background */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-primary/5 via-transparent to-transparent -z-10" />
          
          <DialogHeader className="mb-8 items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-premium flex items-center justify-center text-primary mb-4 border border-primary/5">
              <Monitor className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-heading font-black text-foreground">
              Station Passport
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium max-w-[280px]">
              Point-of-entry authorization for <span className="text-primary font-bold">{stationName}</span>.
            </p>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              className="relative p-8 bg-white rounded-[2.5rem] shadow-2xl border border-border/10 group"
            >
              <div ref={qrRef} className="transition-transform duration-500 group-hover:scale-[1.05]">
                <QRCodeSVG
                  value={stationUrl}
                  size={240}
                  level="H"
                  includeMargin={false}
                  fgColor="#020617"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/40">
                <QrCode className="w-6 h-6" />
              </div>
            </motion.div>
            
            <div className="w-full space-y-4">
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/40 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Gateway Reference</p>
                <p className="text-xs font-bold text-foreground truncate">{stationUrl}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleDownload} 
                  className="h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-foreground/20 gap-2.5"
                >
                  <Download className="h-4 w-4" />
                  Save Passport
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(stationUrl);
                    toast({ title: "Portal ID Copied" });
                  }}
                  className="h-14 rounded-2xl border-border/50 font-black uppercase tracking-widest text-[10px] gap-2.5 hover:bg-muted"
                >
                  <Share2 className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </div>

            <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-[0.3em] opacity-30">
              Lekkside Operational Protocol v4.0
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
