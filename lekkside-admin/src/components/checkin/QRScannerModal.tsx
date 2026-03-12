import React from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-slate-900">
        <div className="relative">
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="absolute top-6 left-6 z-50 flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-md">
                <QrCode className="w-4 h-4 text-primary" />
             </div>
             <span className="text-white font-semibold tracking-wider text-sm uppercase">Ticket Scanner</span>
          </div>

          <div className="w-full aspect-square bg-slate-900 relative">
            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm font-medium z-0">
               Initializing Camera...
            </div>
            {isOpen && (
              <div className="relative z-10 w-full h-full">
                <Scanner
                  onScan={(detectedCodes) => {
                    if (detectedCodes && detectedCodes.length > 0) {
                      const data = detectedCodes[0].rawValue;
                      if (data) {
                         // Normalize the scanned data by removing excessive whitespace
                         // This fix addresses cases where tickets scanned with spaces like "L E K K - ..."
                         const normalized = data.trim().replace(/\s+/g, '');
                         onScan(normalized || data);
                      }
                    }
                  }}
                  onError={(error) => {
                    console.error("QR Scan Error:", error);
                  }}
                  styles={{
                     video: { objectFit: 'cover' },
                     container: { width: '100%', height: '100%' }
                  }}
                />
              </div>
            )}
            
            {/* Scanner overlay corners */}
            <div className="absolute inset-0 pointer-events-none z-20 p-12 flex flex-col justify-between">
               <div className="flex justify-between w-full">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl" />
                  <div className="w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl" />
               </div>
               <div className="flex justify-between w-full">
                  <div className="w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl" />
                  <div className="w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl" />
               </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-900/90 backdrop-blur-md text-center border-t border-white/5">
            <p className="text-white/70 text-sm font-medium">Position the QR code within the frame to scan.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
