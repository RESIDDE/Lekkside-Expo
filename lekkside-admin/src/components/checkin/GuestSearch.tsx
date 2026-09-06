import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

interface GuestSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function GuestSearch({ value, onChange }: GuestSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync from parent
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative flex items-center gap-3"
    >
      <div className="relative flex-1 group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          placeholder="Search by name, email, phone (+234...), ticket #, university..."
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
          }}
          className="pl-11 pr-16 h-14 rounded-2xl bg-white border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-sm transition-all text-sm font-medium placeholder:text-muted-foreground/50"
        />
        {localValue && (
          <button
            type="button"
            onClick={() => {
              setLocalValue('');
              onChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
