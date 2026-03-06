import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Share2, ClipboardCheck, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formUrl: string;
  formName: string;
}

export const QRCodeDialog = ({ open, onOpenChange, formUrl, formName }: QRCodeDialogProps) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      const padding = 60; // Increased padding for premium look
      const qrSize = 600;
      canvas.width = qrSize + padding * 2;
      canvas.height = qrSize + padding * 2 + 100; // Extra room for branding
      
      // Premium background
      ctx.fillStyle = "#ffffff";
      ctx.roundRect ? ctx.roundRect(0, 0, canvas.width, canvas.height, 40) : ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fill();
      
      // Draw QR code
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      
      // Branding text
      ctx.fillStyle = "#020617";
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formName.toUpperCase(), canvas.width / 2, canvas.height - 80);
      
      ctx.fillStyle = "#64748b";
      ctx.font = "500 16px Inter, sans-serif";
      ctx.fillText("SCAN TO REGISTER • LEKKSIDE ENGINE", canvas.width / 2, canvas.height - 50);
      
      const link = document.createElement("a");
      link.download = `${formName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_access_qr.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      
      toast.success("High-resolution QR identity saved");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success("Portal URL copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-premium bg-white">
        <div className="relative p-8">
          {/* Background decoration */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-[hsl(220,100%,97%)] via-transparent to-transparent -z-10" />
          
          <DialogHeader className="mb-8 items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-premium flex items-center justify-center text-primary mb-4 border border-primary/5">
              <QrCode className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-heading font-black text-foreground">
              Gateway Identity
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium max-w-[280px]">
              Deploy this QR code at physical touchpoints for instant registration access.
            </p>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative p-8 bg-white rounded-[2rem] shadow-xl border border-border/20 group"
            >
              <div 
                ref={qrRef}
                className="transition-transform duration-500 group-hover:scale-[1.02]"
              >
                <QRCodeSVG 
                  value={formUrl}
                  size={220}
                  level="H"
                  includeMargin={false}
                  fgColor="#020617"
                />
              </div>
              
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="w-5 h-5" />
              </div>
            </motion.div>
            
            <div className="w-full space-y-3">
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/40 flex items-center justify-between group cursor-pointer hover:bg-muted/50 transition-colors" onClick={copyUrl}>
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Direct Access URL</p>
                  <p className="text-xs font-bold text-foreground truncate">{formUrl}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleDownload}
                  className="h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-foreground/20 gap-2.5"
                >
                  <Download className="w-4 h-4" />
                  Save Identity
                </Button>
                <Button 
                  variant="outline"
                  onClick={copyUrl}
                  className="h-14 rounded-2xl border-border/50 font-black uppercase tracking-widest text-[10px] gap-2.5 hover:bg-muted"
                >
                  <Share2 className="w-4 h-4" />
                  Share Link
                </Button>
              </div>
            </div>

            <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-40">
              Lekkside Visual Engine v2.0
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
