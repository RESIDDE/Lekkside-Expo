import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Check, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ColumnMapperProps {
  headers: string[];
  rows: string[][];
  onImport: (guests: any[]) => void;
  onBack: () => void;
  isLoading: boolean;
}

const FIELD_OPTIONS = [
  { value: 'skip', label: "Don't import" },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'ticket_type', label: 'Ticket Type' },
  { value: 'ticket_number', label: 'Ticket Number' },
  { value: 'notes', label: 'Notes' },
];

const AUTO_MAP_RULES: Record<string, string[]> = {
  first_name: ['first name', 'firstname', 'first', 'given name', 'forename'],
  last_name: ['last name', 'lastname', 'last', 'surname', 'family name'],
  email: ['email', 'e-mail', 'email address', 'mail'],
  phone: ['phone', 'telephone', 'mobile', 'cell', 'phone number', 'tel'],
  ticket_type: ['ticket type', 'type', 'ticket', 'category', 'admission'],
  ticket_number: ['ticket number', 'ticket id', 'ticket #', 'order number', 'order id', 'confirmation'],
  notes: ['notes', 'note', 'comments', 'comment', 'remarks'],
};

export function ColumnMapper({ headers, rows, onImport, onBack, isLoading }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase().trim();
      
      for (const [field, keywords] of Object.entries(AUTO_MAP_RULES)) {
        if (keywords.some(k => headerLower.includes(k) || k.includes(headerLower))) {
          initial[index] = field;
          break;
        }
      }
      
      if (!initial[index]) {
        initial[index] = 'skip';
      }
    });
    
    return initial;
  });

  const handleImport = () => {
    const guests = rows.map(row => {
      const guest: any = {};
      const customFields: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        const field = mapping[index];
        const value = row[index]?.trim();
        
        if (!value) return;
        
        if (field === 'skip') {
          customFields[header] = value;
        } else {
          guest[field] = value;
        }
      });

      if (Object.keys(customFields).length > 0) {
        guest.custom_fields = customFields;
      }
      
      return guest;
    });
    
    onImport(guests);
  };

  const previewData = rows.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary/80 font-medium leading-relaxed">
            Match your file columns to Lekkside fields. Columns marked as <span className="font-bold">"Don't import"</span> will be saved as metadata for each guest.
          </p>
        </div>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {headers.map((header, index) => (
            <div 
              key={index} 
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                mapping[index] !== 'skip' 
                  ? "bg-white border-primary/20 shadow-sm" 
                  : "bg-muted/20 border-border/40"
              )}
            >
              <div className="w-1/3 flex flex-col gap-0.5">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest opacity-60">Source Column</span>
                <p className="text-sm font-bold text-foreground truncate" title={header}>{header}</p>
              </div>

              <div className="w-1/3">
                <Select
                  value={mapping[index]}
                  onValueChange={(value) => setMapping(prev => ({ ...prev, [index]: value }))}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border/50 bg-white font-bold text-xs uppercase tracking-wider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 shadow-premium">
                    {FIELD_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-xs font-bold uppercase tracking-wider py-3 rounded-lg">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-1/3 flex flex-col gap-0.5">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest opacity-60">Sample Data</span>
                <p className="text-xs font-medium text-muted-foreground truncate italic" title={previewData[0]?.[index]}>
                  "{previewData[0]?.[index] || 'Empty field'}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-6 bg-muted/30 border-dashed">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Data Preview ({rows.length} records)</h4>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
            <Check className="w-3 h-3" />
            Live Sync
          </div>
        </div>
        <div className="space-y-2.5">
          {previewData.map((row, i) => (
            <div key={i} className="flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground bg-white/50 p-2 rounded-lg border border-border/20">
              {Object.entries(mapping)
                .filter(([, field]) => field !== 'skip')
                .map(([index, field]) => (
                  <span key={index} className="flex items-center gap-1 border-r border-border/50 pr-2 last:border-0 last:pr-0">
                    <span className="text-foreground font-black opacity-40">{FIELD_OPTIONS.find(f => f.value === field)?.label}:</span>
                    <span className="text-foreground">{row[parseInt(index)] || '—'}</span>
                  </span>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="h-12 px-6 rounded-2xl font-bold text-muted-foreground hover:bg-muted gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={isLoading}
          className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-3"
        >
          {isLoading ? 'Processing...' : `Confirm Import`}
          {!isLoading && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
