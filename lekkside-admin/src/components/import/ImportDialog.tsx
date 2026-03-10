import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, ClipboardPaste, X, ChevronRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useImportGuests } from '@/hooks/useGuests';
import { useToast } from '@/hooks/use-toast';
import { ColumnMapper } from './ColumnMapper';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ImportDialogProps {
  eventId: string;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  fileName?: string;
}

export function ImportDialog({ eventId }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [pasteData, setPasteData] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importGuests = useImportGuests();
  const { toast } = useToast();

  const parseCSV = (text: string): ParsedData => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const headers = lines[0].split(/[,\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(/[,\t]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      return values;
    }).filter(row => row.some(cell => cell.length > 0));
    
    return { headers, rows };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const data = parseCSV(text);
      setParsedData({ ...data, fileName: file.name });
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = () => {
    if (!pasteData.trim()) {
      toast({
        title: 'Empty Input',
        description: 'Please paste some guest data to continue.',
        variant: 'destructive',
      });
      return;
    }
    const data = parseCSV(pasteData);
    if (data.headers.length < 1) {
      toast({
        title: 'Invalid Data',
        description: 'Could not detect any headers or rows in the pasted content.',
        variant: 'destructive',
      });
      return;
    }
    setParsedData(data);
  };

  const handleImport = async (mappedGuests: any[]) => {
    try {
      await importGuests.mutateAsync({
        eventId,
        guests: mappedGuests,
      });
      
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${mappedGuests.length} attendees.`,
      });
      
      setOpen(false);
      setParsedData(null);
      setPasteData('');
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'An error occurred during the import process.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    setParsedData(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="h-11 px-6 rounded-2xl border-border/50 bg-white hover:bg-muted font-semibold text-muted-foreground gap-2 transition-all shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Import</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-premium bg-white">
        <div className="relative">
          {/* Header Gradient */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
          
          <div className="p-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-2xl font-heading font-semibold text-foreground">
                    {parsedData ? 'Analyze & Map' : 'Import Guests'}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-medium">
                    {parsedData 
                      ? `We found ${parsedData.rows.length} records in ${parsedData.fileName || 'your data'}` 
                      : 'Bring your attendees from CSV or Excel files'}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {parsedData ? (
                <motion.div
                  key="mapper"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ColumnMapper
                    headers={parsedData.headers}
                    rows={parsedData.rows}
                    onImport={handleImport}
                    onBack={handleBack}
                    isLoading={importGuests.isPending}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="uploader"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <Tabs defaultValue="file" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 p-1.5 h-auto bg-muted/30 rounded-2xl border border-border/40">
                      <TabsTrigger value="file" className="rounded-xl py-3 text-xs font-semibold uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        File Upload
                      </TabsTrigger>
                      <TabsTrigger value="paste" className="rounded-xl py-3 text-xs font-semibold uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <ClipboardPaste className="w-3.5 h-3.5" />
                        Paste Data
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="mt-8 focus-visible:outline-none focus-visible:ring-0">
                      <div 
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={cn(
                          "relative group border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300",
                          dragActive 
                            ? "border-primary bg-primary/5 scale-[1.02]" 
                            : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          ref={fileInputRef}
                        />
                        <div className="relative z-0 space-y-4">
                          <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <FileSpreadsheet className="w-10 h-10 text-primary transition-colors duration-500 group-hover:text-white" />
                          </div>
                          <div>
                            <p className="text-xl font-heading font-semibold text-foreground">Drop your CSV here</p>
                            <p className="text-sm text-muted-foreground font-medium mt-1">or click to browse your computer</p>
                          </div>
                          <div className="flex items-center justify-center gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 pt-4">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> UTF-8 Only</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Max 10MB</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="paste" className="mt-8 space-y-6 focus-visible:outline-none focus-visible:ring-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-sm font-semibold text-foreground uppercase tracking-widest">Raw Content</Label>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase opacity-60">Supports CSV & TSV</span>
                        </div>
                        <Textarea
                          value={pasteData}
                          onChange={(e) => setPasteData(e.target.value)}
                          placeholder="First Name, Last Name, Email, Ticket&#10;John, Doe, john@example.com, VIP"
                          className="min-h-[240px] rounded-[1.5rem] bg-muted/20 border-border/40 font-mono text-xs p-5 focus-visible:ring-primary/20 transition-all"
                        />
                      </div>
                      <Button 
                        onClick={handlePaste} 
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold uppercase tracking-widest shadow-xl shadow-primary/20 gap-3"
                      >
                        Process Pasted Data
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </TabsContent>
                  </Tabs>

                  <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-900">Important Note</p>
                      <p className="text-xs text-amber-700 leading-relaxed font-medium">
                        Ensure your headers are clear. You will be able to map each column to the correct matching field in the next step.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
