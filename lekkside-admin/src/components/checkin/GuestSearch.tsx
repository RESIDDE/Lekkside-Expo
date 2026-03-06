import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
          placeholder="Search by name, email, or ticket..."
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
          }}
          className="pl-11 h-14 rounded-2xl bg-white border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-sm transition-all text-base font-medium"
        />
        {localValue && (
          <button
            onClick={() => {
              setLocalValue('');
              onChange('');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            Clear
          </button>
        )}
      </div>
      <Button variant="outline" className="h-14 px-6 rounded-2xl border-border/50 bg-white hover:bg-muted font-bold text-muted-foreground gap-2 hidden sm:flex">
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </Button>
    </motion.div>
  );
}
