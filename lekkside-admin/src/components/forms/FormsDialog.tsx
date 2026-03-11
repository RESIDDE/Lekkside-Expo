import { useState } from "react";
import { 
  Plus, 
  Link2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  Eye, 
  Settings2, 
  FileText, 
  QrCode,
  ChevronRight,
  ClipboardCheck,
  MoreVertical,
  Activity,
  ShieldCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForms, useFormRegistrationCount, type CustomField } from "@/hooks/useForms";
import { toast } from "sonner";
import { FormFieldsEditor } from "./FormFieldsEditor";
import { FormPreviewDialog } from "./FormPreviewDialog";
import { QRCodeDialog } from "./QRCodeDialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface FormsDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FormsDialog = ({ eventId, open, onOpenChange }: FormsDialogProps) => {
  const { forms, isLoading, createForm, toggleFormActive, deleteForm, updateFormFields } = useForms(eventId);
  const [newFormName, setNewFormName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingForm, setEditingForm] = useState<{ id: string; name: string; fields: CustomField[] } | null>(null);
  const [previewingForm, setPreviewingForm] = useState<{ name: string; fields: CustomField[] } | null>(null);
  const [qrForm, setQrForm] = useState<{ id: string; name: string } | null>(null);

  const handleCreateForm = async () => {
    if (!newFormName.trim()) {
      toast.error("Please enter a form name");
      return;
    }
    try {
      await createForm.mutateAsync(newFormName.trim());
      setNewFormName("");
      setIsCreating(false);
      toast.success("New registration form created!");
    } catch (e) {
      toast.error("Failed to create form");
    }
  };

  const copyFormLink = (formId: string) => {
    const url = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(url);
    toast.success("Form link copied to clipboard!");
  };

  const handleSaveFields = async (fields: CustomField[]) => {
    if (!editingForm) return;
    try {
      await updateFormFields.mutateAsync({ formId: editingForm.id, customFields: fields });
      setEditingForm(null);
      toast.success("Form structure updated");
    } catch (e) {
      toast.error("Failed to update fields");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-premium bg-white">
          <div className="relative">
            {/* Header Decoration */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
            
            <div className="p-8">
              <DialogHeader className="mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <DialogTitle className="text-2xl font-heading font-semibold text-foreground">
                      Registration Forms
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground font-medium">
                      Create and manage distinct attendee registration entry points
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Create new form section */}
                <AnimatePresence mode="wait">
                  {isCreating ? (
                    <motion.div 
                      key="creating"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4 p-6 border border-primary/20 rounded-[1.8rem] bg-primary/5"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="form-name" className="text-[10px] font-semibold uppercase tracking-widest text-primary px-1">
                          Form Identity
                        </Label>
                        <Input
                          id="form-name"
                          value={newFormName}
                          onChange={(e) => setNewFormName(e.target.value)}
                          placeholder="e.g., Early Bird Registration"
                          className="h-12 rounded-xl bg-white border-border/50 focus-visible:ring-primary/20 font-semibold"
                          onKeyDown={(e) => e.key === "Enter" && handleCreateForm()}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateForm}
                          disabled={createForm.isPending}
                          className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold uppercase tracking-widest flex-1 shadow-lg shadow-primary/10"
                        >
                          {createForm.isPending ? 'Working...' : 'Create Form'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsCreating(false);
                            setNewFormName("");
                          }}
                          className="h-11 rounded-xl font-semibold text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-dashed border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary font-semibold uppercase tracking-widest gap-2 transition-all group"
                        onClick={() => setIsCreating(true)}
                      >
                        <Plus className="h-4 w-4 group-hover:scale-125 transition-transform" />
                        New Registration Portal
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forms list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Active Gateways</span>
                    <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
                  </div>
                  
                  {isLoading ? (
                    <div className="grid gap-4">
                      {[1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/30 animate-pulse" />)}
                    </div>
                  ) : forms.length === 0 ? (
                    <div className="text-center py-12 px-6 rounded-3xl bg-muted/10 border-2 border-dashed border-border/40">
                      <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground">Start your first campaign</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Forms allow you to collect custom information from attendees.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {forms.map((form) => (
                        <FormItem
                          key={form.id}
                          form={form}
                          isDefault={form.is_default}
                          onCopyLink={() => copyFormLink(form.id)}
                          onShowQR={() => setQrForm({ id: form.id, name: form.name })}
                          onPreview={() => setPreviewingForm({ name: form.name, fields: form.custom_fields })}
                          onEdit={() => setEditingForm({ id: form.id, name: form.name, fields: form.custom_fields })}
                          onToggle={() => toggleFormActive.mutate({ formId: form.id, isActive: !form.is_active })}
                          onDelete={() => deleteForm.mutate(form.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fields Editor Dialog */}
      {editingForm && (
        <FormFieldsEditor
          open={!!editingForm}
          onOpenChange={(open) => !open && setEditingForm(null)}
          fields={editingForm.fields}
          onSave={handleSaveFields}
          isSaving={updateFormFields.isPending}
        />
      )}

      {/* Preview Dialog */}
      {previewingForm && (
        <FormPreviewDialog
          open={!!previewingForm}
          onOpenChange={(open) => !open && setPreviewingForm(null)}
          formName={previewingForm.name}
          customFields={previewingForm.fields}
        />
      )}

      {/* QR Code Dialog */}
      {qrForm && (
        <QRCodeDialog
          open={!!qrForm}
          onOpenChange={(open) => !open && setQrForm(null)}
          formUrl={`${window.location.origin}/form/${qrForm.id}`}
          formName={qrForm.name}
        />
      )}
    </>
  );
};

interface FormItemProps {
  form: {
    id: string;
    name: string;
    is_active: boolean;
    custom_fields: CustomField[];
  };
  isDefault?: boolean;
  onCopyLink: () => void;
  onShowQR: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const FormItem = ({ form, isDefault, onCopyLink, onShowQR, onPreview, onEdit, onToggle, onDelete }: FormItemProps) => {
  const registrationCount = useFormRegistrationCount(form.id);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "bg-white border-border/40 hover:border-primary/20 rounded-[1.5rem] border shadow-sm hover:shadow-premium p-4 pl-5",
        !form.is_active && "opacity-60 grayscale-[0.5]"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-semibold text-foreground truncate">{form.name}</h4>
            <div className={cn(
                "w-2 h-2 rounded-full",
                form.is_active ? "bg-[hsl(var(--success))] animate-pulse" : "bg-muted"
              )} />
            {isDefault && (
              <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Default</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {registrationCount} Leads
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Settings2 className="h-3 w-3" />
              {form.custom_fields.length} Fields
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={onCopyLink}
            disabled={!form.is_active}
            title="Copy URL"
          >
            <Link2 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-premium border-border/40">
              <DropdownMenuItem onClick={onPreview} className="rounded-xl py-3 font-medium gap-3">
                <Eye className="w-4 h-4 text-primary" />
                Live Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowQR} className="rounded-xl py-3 font-medium gap-3">
                <QrCode className="w-4 h-4 text-primary" />
                Download QR Code
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={onToggle} className="rounded-xl py-3 font-medium gap-3">
                {form.is_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-[hsl(var(--success))]" />
                    Deactivate Portal
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    Activate Portal
                  </>
                )}
              </DropdownMenuItem>

              {!isDefault && (
                <>
                  <DropdownMenuItem onClick={onEdit} className="rounded-xl py-3 font-medium gap-3">
                    <Settings2 className="w-4 h-4 text-primary" />
                    Edit Structure
                  </DropdownMenuItem>
                  <div className="h-px bg-border/40 my-1 mx-2" />
                  <DropdownMenuItem 
                    onClick={onDelete} 
                    className="rounded-xl py-3 font-medium gap-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Form
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};
