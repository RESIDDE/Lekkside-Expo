import { useRef } from 'react';
import { Calendar, MapPin, Users, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import gsap from 'gsap';
import { type Database } from '../../../lekkside-admin/src/integrations/supabase/types';

type Event = Database['public']['Tables']['events']['Row'];

interface EventCardProps {
  event: Event;
  className?: string;
  onRegister: (event: Event) => void;
}

export function EventCard({ event, className, onRegister }: EventCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const formattedDate = event.date ? format(new Date(event.date), 'MMM do, yyyy') : 'TBA';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !glowRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(glowRef.current, {
      opacity: 1,
      x: x - 100, // half of glow width
      y: y - 100, // half of glow height
      duration: 0.5,
      ease: 'power2.out'
    });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    gsap.to(cardRef.current, {
      rotateX: rotateX,
      rotateY: rotateY,
      duration: 0.5,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !glowRef.current) return;
    
    gsap.to(glowRef.current, {
      opacity: 0,
      duration: 0.5
    });

    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onRegister(event)}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[2rem] glass p-8 transition-all duration-500 hover:border-primary/50 perspective-1000 cursor-pointer will-change-[transform,opacity,filter]",
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Interactive Glow Effect */}
      <div 
        ref={glowRef}
        className="pointer-events-none absolute h-[200px] w-[200px] rounded-full bg-primary/20 blur-[60px] opacity-0"
        style={{ pointerEvents: 'none' }}
      />
      
      <div className="relative z-10 flex flex-col flex-grow translate-z-20">
        <div className="mb-8 flex items-start justify-between">
          <div className="rounded-full bg-primary/10 px-4 py-1.5 border border-primary/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Upcoming
            </span>
          </div>
          <div className="rounded-full p-2 bg-white/5 border border-white/10 group-hover:bg-primary group-hover:border-primary transition-all duration-500 group-hover:rotate-45">
            <ArrowUpRight className="h-5 w-5 text-foreground group-hover:text-primary-foreground" />
          </div>
        </div>

        <h3 className="mb-4 text-3xl font-bold font-display tracking-tight text-foreground transition-all duration-500 group-hover:translate-x-1">
          {event.name}
        </h3>
        
        <p className="mb-8 text-base text-muted-foreground/80 line-clamp-3 flex-grow leading-relaxed">
          {event.description || 'Join us for an unforgettable experience at our upcoming gathering.'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Date</span>
            <div className="flex items-center text-sm font-medium text-foreground">
              <Calendar className="mr-2 h-3.5 w-3.5 text-primary" />
              {formattedDate}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Venue</span>
            <div className="flex items-center text-sm font-medium text-foreground truncate">
              <MapPin className="mr-2 h-3.5 w-3.5 text-primary" />
              {event.venue || 'TBA'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 mt-10 translate-z-10">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span>{event.capacity || 'Open'} available</span>
          </div>
          <span className="text-xs font-bold text-primary tracking-widest uppercase">Reserve Now</span>
        </div>
      </div>
    </div>
  );
}
