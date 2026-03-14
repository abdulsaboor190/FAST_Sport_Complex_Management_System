import { resolveImageUrl } from '@/config';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isAfter } from 'date-fns';
import { CalendarDays, MapPin, Users, ChevronRight } from 'lucide-react';
import { useGetEventsQuery } from '@/store/api/eventsApi';
import type { Event, EventType } from '@/store/api/eventsApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/Button';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  Workshop: 'Workshop',
  Seminar: 'Seminar',
  SportsDay: 'Championship',
  FitnessChallenge: 'Fitness Lab',
};

function EventCard({ event }: { event: Event }) {
  const start = new Date(event.startTime);
  const isUpcoming = isAfter(start, new Date());
  const regCount = event._count?.registrations ?? 0;
  const capacity = event.capacity ?? 0;
  const full = capacity > 0 && regCount >= capacity;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link to={`/dashboard/events/${event.id}`}>
        <Card className="relative overflow-hidden border-white/5 bg-[rgba(18,10,30,0.4)] shadow-3xl backdrop-blur-2xl transition-all duration-500 hover:border-fast-primary/30 hover:bg-[rgba(18,10,30,0.6)] rounded-[48px]">
          <div className="absolute inset-0 bg-gradient-to-br from-fast-primary/5 via-transparent to-pink-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div className="flex flex-col md:flex-row">
            <div className="relative h-64 w-full overflow-hidden md:h-auto md:w-96 shrink-0 border-r border-white/5">
               {event.bannerUrl ? (
                 <img src={resolveImageUrl(event.bannerUrl)} alt="" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
               ) : (
                 <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fast-primary/20 via-[#120a1e] to-fast-accent/20">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <CalendarDays className="h-20 w-20 text-fast-primary/40 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
                 </div>
               )}
               <div className="absolute top-6 left-6">
                  <div className="rounded-2xl bg-fast-primary/90 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl backdrop-blur-xl border border-white/10">
                    {EVENT_TYPE_LABELS[event.type]}
                  </div>
               </div>
               {!isUpcoming && (
                  <div className="absolute inset-0 bg-[#0d0814]/80 flex items-center justify-center backdrop-blur-[4px]">
                     <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 border border-white/10 px-6 py-2 rounded-xl">Operational Conclusion</span>
                  </div>
               )}
            </div>

            <CardContent className="flex flex-1 flex-col p-10 justify-between">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                   <div className="space-y-1">
                      <h3 className="font-display text-3xl font-black tracking-tight text-white group-hover:text-fast-primary transition-colors leading-tight">{event.title}</h3>
                      <p className="text-sm font-medium text-[#7a6a9a] uppercase tracking-widest">Sector Clearance Required</p>
                   </div>
                   <div className="rounded-2xl bg-white/5 p-3 transition-all duration-300 group-hover:bg-fast-primary group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                      <ChevronRight className="h-6 w-6 text-white" />
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-fast-primary border border-white/5">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Time Matrix</span>
                       <span className="text-sm font-bold text-white/90">{format(start, 'PPp')}</span>
                    </div>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-fast-accent border border-white/5">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Deployment Zone</span>
                         <span className="text-sm font-bold text-white/90">{event.venue}</span>
                      </div>
                    </div>
                  )}
                  {(event.capacity ?? 0) > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-pink-500 border border-white/5">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Personnel Count</span>
                         <span className="text-sm font-bold text-white/90">{regCount} / {event.capacity} Enrolled</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-8">
                <div className="flex items-center gap-4">
                  {isUpcoming && (
                    <div className={cn(
                      'rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-0',
                      full ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    )}>
                      {full ? 'Quota Reached' : 'Operational Status: Active'}
                    </div>
                  )}
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Entry Protocol</span>
                     {Number(event.entryFee) > 0 ? (
                        <span className="text-sm font-black text-white/90">PKR {Number(event.entryFee)}</span>
                     ) : (
                        <span className="text-sm font-black text-emerald-400">Classified Access</span>
                     )}
                  </div>
                </div>
                <Button variant="ghost" className="h-12 rounded-2xl border border-white/10 bg-white/5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-fast-primary hover:border-fast-primary transition-all">
                  Initiate Clearance
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function EventList() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'Admin';
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('');
  const from = format(new Date(), "yyyy-MM-dd'T00:00:00");
  const to = format(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T23:59:59");
  
  const { data: events, isLoading } = useGetEventsQuery({
    from,
    to,
    type: typeFilter || undefined,
    status: isAdmin ? undefined : 'Published',
  });

  return (
    <div className="max-w-7xl mx-auto space-y-16 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 md:flex-row md:items-end justify-between border-b border-white/5 pb-12"
      >
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-fast-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-fast-primary border border-fast-primary/20">
            Sector: Events & Championships
          </div>
          <h1 className="font-display text-5xl font-black tracking-tighter text-white md:text-6xl uppercase italic">The Circuit</h1>
          <p className="text-base font-medium tracking-wide text-[#7a6a9a] max-w-2xl">Precision engineered training deployments, strategic intelligence seminars, and elite world-class championships.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/dashboard/events/my-registrations" className="w-full sm:w-auto">
            <Button variant="outline" className="h-14 w-full sm:w-auto rounded-2xl border-white/10 bg-[rgba(255,255,255,0.03)] px-8 font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-all">
               Clearance Archive
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/dashboard/events/create" className="w-full sm:w-auto">
              <Button className="h-14 w-full sm:w-auto rounded-2xl bg-white font-black text-[10px] uppercase tracking-widest text-black shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:bg-gray-100 active:scale-95 transition-all">
                Broadcast Operations
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[rgba(18,10,30,0.4)] border border-white/5 p-8 rounded-[32px] backdrop-blur-xl">
        <div className="flex flex-col gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a] ml-4">Deployment Frequency Filter</span>
           <div className="flex flex-wrap gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setTypeFilter('')}
                className={cn(
                  "h-10 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest transition-all", 
                  typeFilter === '' ? "bg-white text-black shadow-xl" : "text-[#7a6a9a] hover:bg-white/5"
                )}
              >
                Full Spectrum
              </Button>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
                <Button 
                  key={t}
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "h-10 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest transition-all", 
                    typeFilter === t ? "bg-white text-black shadow-xl" : "text-[#7a6a9a] hover:bg-white/5"
                  )}
                >
                  {EVENT_TYPE_LABELS[t]}
                </Button>
              ))}
           </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-4 text-right">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Operational Range</span>
              <span className="text-sm font-bold text-white">Next 180 Days</span>
           </div>
           <div className="h-10 w-[1px] bg-white/5" />
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Active Transmissions</span>
              <span className="text-sm font-bold text-fast-primary">{events?.length || 0} Sectors</span>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-[48px] bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : events?.length ? (
        <div className="grid gap-10">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-dashed border-white/10 bg-transparent py-32 rounded-[48px]">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                 <CalendarDays className="h-12 w-12 text-[#7a6a9a]" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 uppercase italic">Radio Silence</h3>
              <p className="text-base font-medium text-[#7a6a9a] max-w-md">No new operations detected in this sector. Clearances are currently suspended pending fresh transmissions.</p>
              <Button onClick={() => setTypeFilter('')} variant="outline" className="mt-10 h-12 rounded-2xl border-white/10 px-8 font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/5">
                 Reset All Sensors
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

