import { Download, ChevronDown, Check, Users, Clock, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Guest = Tables<'guests'>;

type ExportFilter = 'all' | 'checked-in' | 'pending';

interface ExportButtonProps {
  guests: Guest[];
  eventName: string;
}

export function ExportButton({ guests, eventName }: ExportButtonProps) {
  const { toast } = useToast();

  const handleExport = (filter: ExportFilter) => {
    if (!guests || guests.length === 0) {
      toast({
        title: 'No Data',
        description: 'There are no guests available to export.',
        variant: 'destructive',
      });
      return;
    }

    let filteredGuests = guests;
    let filterSuffix = '';
    
    switch (filter) {
      case 'checked-in':
        filteredGuests = guests.filter(g => g.checked_in);
        filterSuffix = '_arrived';
        break;
      case 'pending':
        filteredGuests = guests.filter(g => !g.checked_in);
        filterSuffix = '_remaining';
        break;
      default:
        filterSuffix = '_full_list';
    }

    if (filteredGuests.length === 0) {
      toast({
        title: 'Empty Segment',
        description: `There are no ${filter === 'checked-in' ? 'checked-in' : 'pending'} guests to export.`,
        variant: 'destructive',
      });
      return;
    }

    const customFieldKeys = new Set<string>();
    filteredGuests.forEach(guest => {
      if (guest.custom_fields && typeof guest.custom_fields === 'object') {
        Object.keys(guest.custom_fields as Record<string, unknown>).forEach(key => {
          customFieldKeys.add(key);
        });
      }
    });
    const sortedCustomFieldKeys = Array.from(customFieldKeys).sort();

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Ticket Type',
      'Ticket Number',
      'Notes',
      'Arrived',
      'Arrival Time',
      ...sortedCustomFieldKeys.map(key => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
    ];

    const rows = filteredGuests.map(guest => {
      const customFields = (guest.custom_fields as Record<string, unknown>) || {};
      const customFieldValues = sortedCustomFieldKeys.map(key => {
        const value = customFields[key];
        if (Array.isArray(value)) return value.join('; ');
        return value ? String(value) : '';
      });

      return [
        guest.first_name || '',
        guest.last_name || '',
        guest.email || '',
        guest.phone || '',
        guest.ticket_type || '',
        guest.ticket_number || '',
        guest.notes || '',
        guest.checked_in ? 'Yes' : 'No',
        guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString() : '',
        ...customFieldValues,
      ];
    });

    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const sanitizedName = eventName
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    
    link.download = `${sanitizedName}${filterSuffix}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Ready',
      description: `CSV file with ${filteredGuests.length} records has been downloaded.`,
    });
  };

  const checkedInCount = guests.filter(g => g.checked_in).length;
  const pendingCount = guests.filter(g => !g.checked_in).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-11 px-6 rounded-2xl border-border/50 bg-white hover:bg-muted font-bold text-muted-foreground gap-2 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-premium border-border/40">
        <div className="px-3 py-2 border-b border-border/40 mb-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <FileType className="w-3 h-3" />
            CSV Export Options
          </p>
        </div>
        <DropdownMenuItem 
          onClick={() => handleExport('all')}
          className="rounded-xl py-3 px-4 font-medium flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            All Attendees
          </div>
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold">{guests.length}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('checked-in')}
          className="rounded-xl py-3 px-4 font-medium flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Check className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(var(--success))] transition-colors" />
            Arrived Only
          </div>
          <span className="text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] px-2 py-0.5 rounded-full font-bold">{checkedInCount}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('pending')}
          className="rounded-xl py-3 px-4 font-medium flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(var(--warning))] transition-colors" />
            Remaining Only
          </div>
          <span className="text-[10px] bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}