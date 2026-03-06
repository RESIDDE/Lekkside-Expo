import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Sparkles, 
  Check, 
  Info, 
  Settings2,
  Trash,
  MoveVertical,
  Type,
  AlignLeft,
  ChevronDown,
  SquareCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormFieldsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: CustomField[];
  onSave: (fields: CustomField[]) => Promise<void>;
  isSaving: boolean;
}

export const FormFieldsEditor = ({
  open,
  onOpenChange,
  fields: initialFields,
  onSave,
  isSaving,
}: FormFieldsEditorProps) => {
  const [fields, setFields] = useState<CustomField[]>(initialFields);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    label: "",
    type: "text",
    required: false,
    options: [],
    placeholder: "",
  });
  const [optionsInput, setOptionsInput] = useState("");

  const handleAddField = () => {
    if (!newField.label?.trim()) {
      toast.error("Please enter a field label");
      return;
    }

    if (newField.type === "select" && (!newField.options || newField.options.length < 2)) {
      toast.error("Please add at least 2 options for dropdown fields");
      return;
    }

    const field: CustomField = {
      id: crypto.randomUUID(),
      label: newField.label.trim(),
      type: newField.type as CustomField["type"],
      required: newField.required || false,
      placeholder: newField.placeholder?.trim(),
      options: newField.type === "select" ? newField.options : undefined,
    };

    setFields([...fields, field]);
    setNewField({
      label: "",
      type: "text",
      required: false,
      options: [],
      placeholder: "",
    });
    setOptionsInput("");
    setIsAddingField(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    toast.success("Field removed");
  };

  const handleOptionsChange = (value: string) => {
    setOptionsInput(value);
    const options = value.split(",").map((o) => o.trim()).filter(Boolean);
    setNewField((prev) => ({ ...prev, options }));
  };

  const handleSave = async () => {
    await onSave(fields);
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'textarea': return <AlignLeft className="w-3.5 h-3.5" />;
      case 'select': return <ChevronDown className="w-3.5 h-3.5" />;
      case 'checkbox': return <SquareCheck className="w-3.5 h-3.5" />;
      default: return <Type className="w-3.5 h-3.5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-premium bg-white">
        <div className="relative flex flex-col max-h-[90vh]">
          {/* Header Decoration */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
          
          <div className="p-8 pb-0">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Settings2 className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-xl font-heading font-black text-foreground">
                    Form Architecture
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-medium">
                    Configure custom data points for your registration flow
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl flex gap-3 mb-6">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Standard Payload</p>
                <p className="text-xs text-muted-foreground/80 font-medium">Names, Email, Phone, and Notes are always included by default.</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-8 custom-scrollbar">
            {/* Current custom fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Custom Fields</span>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{fields.length} Configured</span>
              </div>
              
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {fields.map((field) => (
                    <motion.div
                      layout
                      key={field.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group flex items-center gap-3 p-4 border border-border/40 rounded-2xl bg-white hover:border-primary/20 hover:shadow-sm transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground/40 group-hover:text-primary/40 transition-colors">
                        <MoveVertical className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-foreground truncate">{field.label}</span>
                          {field.required && (
                            <span className="text-[10px] bg-destructive/10 text-destructive font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Required</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {getFieldIcon(field.type)}
                            {field.type}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {fields.length === 0 && !isAddingField && (
                  <div className="py-12 border-2 border-dashed border-border/40 rounded-3xl flex flex-col items-center justify-center text-center px-6">
                    <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-bold text-muted-foreground/60">No custom fields defined</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add new field */}
            <AnimatePresence mode="wait">
              {isAddingField ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4 p-6 border-2 border-primary/20 rounded-[2rem] bg-primary/5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-label" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Label Name</Label>
                      <Input
                        id="field-label"
                        value={newField.label || ""}
                        onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., Job Title"
                        className="h-11 rounded-xl bg-white border-border/40 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-type" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Input Style</Label>
                      <Select
                        value={newField.type}
                        onValueChange={(value) => setNewField((prev) => ({ ...prev, type: value as CustomField["type"] }))}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-white border-border/40 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 shadow-premium">
                          <SelectItem value="text" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-3">Text Input</SelectItem>
                          <SelectItem value="textarea" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-3">Large Text</SelectItem>
                          <SelectItem value="select" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-3">Dropdown</SelectItem>
                          <SelectItem value="checkbox" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-3">Option Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newField.type === "select" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                      <Label htmlFor="field-options" className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Choices (Comma Separated)</Label>
                      <Input
                        id="field-options"
                        value={optionsInput}
                        onChange={(e) => handleOptionsChange(e.target.value)}
                        placeholder="Option A, Option B, ..."
                        className="h-11 rounded-xl bg-white border-border/40 font-bold"
                      />
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-primary/10">
                    <div className="space-y-0.5">
                      <Label htmlFor="field-required" className="text-[11px] font-bold text-foreground">Mandatory Field</Label>
                      <p className="text-[10px] text-muted-foreground/70 font-medium">User cannot submit without this value</p>
                    </div>
                    <Switch
                      id="field-required"
                      checked={newField.required || false}
                      onCheckedChange={(checked) => setNewField((prev) => ({ ...prev, required: checked }))}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleAddField} className="h-12 flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/10 gap-2">
                      Add to Form
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsAddingField(false);
                        setNewField({
                          label: "",
                          type: "text",
                          required: false,
                          options: [],
                          placeholder: "",
                        });
                        setOptionsInput("");
                      }}
                      className="h-12 rounded-2xl font-bold text-muted-foreground hover:bg-muted"
                    >
                      Discard
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-dashed border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary/70 font-black uppercase tracking-widest gap-2 transition-all group"
                  onClick={() => setIsAddingField(true)}
                >
                  <Plus className="h-4 w-4 group-hover:scale-125 transition-transform" />
                  Define Custom Entry
                </Button>
              )}
            </AnimatePresence>
          </div>

          <div className="p-8 bg-muted/20 border-t border-border/40 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-2xl font-bold text-muted-foreground"
            >
              Go Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 px-10 rounded-2xl bg-foreground hover:bg-foreground/90 text-white font-black uppercase tracking-widest shadow-xl shadow-foreground/20 gap-3"
            >
              {isSaving ? "Finalizing..." : "Save Architecture"}
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
