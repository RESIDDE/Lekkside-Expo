import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Calendar, MapPin, AlignLeft, Users, ImageIcon, Upload, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const createEvent = useCreateEvent();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 2MB.',
          variant: 'destructive',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

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
      setIsUploading(true);
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast({
            title: 'Upload failed',
            description: 'Failed to upload event image. Continuing without image.',
            variant: 'destructive',
          });
        }
      }

      const event = await createEvent.mutateAsync({
        name: name.trim(),
        date: date ? new Date(date).toISOString() : null,
        venue: venue.trim() || null,
        capacity: capacity ? parseInt(capacity) : null,
        description: description.trim() || null,
        created_by: user?.id,
        image_url: imageUrl,
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
      setImageFile(null);
      setImagePreview(null);
      
      navigate(`/events/${event.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-primary/5 to-transparent p-8 sm:p-10">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 text-primary mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">New Venture</span>
            </div>
            <DialogTitle className="text-3xl font-heading font-extrabold tracking-tight">Create New Event</DialogTitle>
            <p className="text-muted-foreground font-medium text-sm mt-1">Set the stage for your next memorable gathering.</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Area */}
            <div className="space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <ImageIcon className="w-3 h-3 text-primary" /> Event Cover Image
              </Label>
              <div 
                onClick={() => !imagePreview && fileInputRef.current?.click()}
                className={`relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 bg-white/50
                  ${imagePreview ? 'border-primary aspect-video' : 'border-border/50 hover:border-primary/40 aspect-[21/9] flex flex-col items-center justify-center'}`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-xl font-bold"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      >
                        Change
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        className="rounded-xl font-bold"
                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                      >
                        Remove
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Upload cover photo</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                Event Name *
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
                rows={3}
                className="rounded-2xl bg-white/50 border-border/50 focus:border-primary/40 focus:ring-primary/10 transition-all font-medium resize-none py-4"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="h-14 px-8 rounded-2xl font-bold text-muted-foreground hover:bg-muted"
                disabled={isUploading}
              >
                Discard
              </Button>
              <Button 
                type="submit" 
                disabled={createEvent.isPending || isUploading}
                className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {(createEvent.isPending || isUploading) ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Creating...'}
                  </>
                ) : 'Launch Event'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
