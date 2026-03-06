import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Sparkles, Calendar, MapPin, AlignLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateEvent } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  
  const { user } = useAuth();
  const createEvent = useCreateEvent();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Event name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const event = await createEvent.mutateAsync({
        name: name.trim(),
        date: date ? new Date(date).toISOString() : null,
        venue: venue.trim() || null,
        capacity: capacity ? parseInt(capacity) : null,
        description: description.trim() || null,
        created_by: user?.id,
      });

      toast({
        title: 'Event created',
        description: 'Your event has been created successfully.',
      });
      
      setOpen(false);
      setName('');
      setDate('');
      setVenue('');
      setCapacity('');
      setDescription('');
      
      navigate(`/events/${event.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground font-bold tracking-tight transition-all duration-300">
            <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
            Create Event
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
        <div className="bg-gradient-to-br from-primary/5 to-transparent p-8 sm:p-10">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Sparkles className="w-5 h-5 fill-current" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">New Venture</span>
            </div>
            <DialogTitle className="text-3xl font-heading font-extrabold tracking-tight">Create New Event</DialogTitle>
            <p className="text-muted-foreground font-medium text-sm mt-1">Set the stage for your next memorable gathering.</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" /> Event Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Annual Design Summit 2026"
                className="h-14 rounded-2xl bg-white/50 border-border/50 focus:border-primary/40 focus:ring-primary/10 transition-all text-base font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-primary" /> Date & Time
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-14 rounded-2xl bg-white/50 border-border/50 focus:border-primary/40 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="capacity" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <Users className="w-3 h-3 text-primary" /> Capacity
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="500"
                  className="h-14 rounded-2xl bg-white/50 border-border/50 focus:border-primary/40 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="venue" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-primary" /> Venue
              </Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Convention Center, Hall A"
                className="h-14 rounded-2xl bg-white/50 border-border/50 focus:border-primary/40 focus:ring-primary/10 transition-all font-medium"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <AlignLeft className="w-3 h-3 text-primary" /> Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your vision for this event..."
                rows={4}
                className="rounded-2xl bg-white/50 border-border/50 focus:border-primary/40 focus:ring-primary/10 transition-all font-medium resize-none py-4"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="h-14 px-8 rounded-2xl font-bold text-muted-foreground hover:bg-muted"
              >
                Discard
              </Button>
              <Button 
                type="submit" 
                disabled={createEvent.isPending}
                className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {createEvent.isPending ? 'Creating...' : 'Launch Event'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
