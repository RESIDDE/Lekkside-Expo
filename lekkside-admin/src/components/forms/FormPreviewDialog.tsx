import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CustomField } from "./FormFieldsEditor";
import { motion } from "framer-motion";
import { Smartphone, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formName: string;
  customFields: CustomField[];
}

export const FormPreviewDialog = ({
  open,
  onOpenChange,
  formName,
  customFields,
}: FormPreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-premium bg-slate-50/50 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Side: Info */}
          <div className="w-full md:w-5/12 p-8 bg-white/40 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-heading font-black text-foreground leading-tight mb-2">
                Viewport Preview
              </h2>
              <p className="text-sm text-muted-foreground font-medium mb-8">
                This is how your attendees will experience the registration flow on their devices.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Smartphone className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Mobile Optimized</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Fluid layouts for all screens</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Premium Interaction</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Lekkside smooth-motion engine</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full h-11 rounded-xl font-bold bg-white/50 border-border/40"
              >
                Close Preview
              </Button>
            </div>
          </div>

          {/* Right Side: Phone Frame Preview */}
          <div className="flex-1 p-8 flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent overflow-y-auto max-h-[85vh] custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-[340px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[6px] border-slate-950/5 relative"
            >
              <div className="h-6 w-32 bg-slate-950/5 rounded-b-2xl mx-auto mb-2" /> {/* Mock Notch */}
              
              <div className="p-6 space-y-6">
                <header className="text-center space-y-1">
                  <h3 className="text-lg font-heading font-black text-foreground">{formName}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Registration Portal</p>
                </header>

                <div className="space-y-4 pointer-events-none">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">First Name</Label>
                      <Input placeholder="John" className="h-10 rounded-xl bg-muted/20 border-none text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">Last Name</Label>
                      <Input placeholder="Doe" className="h-10 rounded-xl bg-muted/20 border-none text-xs" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">Email Access</Label>
                    <Input placeholder="john@example.com" className="h-10 rounded-xl bg-muted/20 border-none text-xs" />
                  </div>

                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">
                        {field.label} {field.required && <span className="text-primary">*</span>}
                      </Label>
                      {field.type === "text" && (
                        <Input
                          placeholder={field.placeholder || "Your answer..."}
                          className="h-10 rounded-xl bg-muted/20 border-none text-xs"
                        />
                      )}
                      {field.type === "textarea" && (
                        <Textarea
                          placeholder={field.placeholder || "Provide details..."}
                          className="rounded-xl bg-muted/20 border-none text-xs resize-none"
                          rows={2}
                        />
                      )}
                      {field.type === "select" && (
                        <div className="h-10 rounded-xl bg-muted/20 border-none flex items-center justify-between px-3 text-xs text-muted-foreground/60">
                          {field.options?.[0] || "Select option"}
                          <ChevronDown className="w-3 h-3" />
                        </div>
                      )}
                      {field.type === "checkbox" && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-4 h-4 rounded border border-border/40 bg-muted/20" />
                          <span className="text-[11px] font-medium text-muted-foreground">Confirm selection</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-4">
                    <Button className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                      Complete Registration
                    </Button>
                    <p className="text-[9px] text-center text-muted-foreground font-medium mt-4 px-2">
                      Secure processing by Lekkside Engine. No password required.
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-24 bg-slate-950/5 rounded-full mx-auto my-3" /> {/* Mock Home Indicator */}
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
