import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, setHours, setMinutes, startOfDay } from 'date-fns';
import { Clock4 } from 'lucide-react';
import { useGetFacilityQuery, useGetBookedSlotsQuery } from '@/store/api/facilitiesApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function FacilityPublicDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const { data: facility, isLoading } = useGetFacilityQuery(slug!, { skip: !slug });
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  const { data: slotsData } = useGetBookedSlotsQuery(
    { facilityId: facility?.id ?? '', date: dateStr },
    { skip: !facility?.id }
  );

  const bookedSet = useMemo(() => {
    const set = new Set<string>();
    if (!slotsData) return set;
    const slotMinutes = facility?.slotDurationMinutes ?? 30;
    for (const s of slotsData.slots ?? []) {
      const start = new Date(s.start).getTime();
      for (let t = start; t < new Date(s.end).getTime(); t += slotMinutes * 60 * 1000) {
        set.add(String(t));
      }
    }
    return set;
  }, [slotsData, facility?.slotDurationMinutes]);

  if (!slug) return null;
  if (isLoading || !facility) {
    return (
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-20">
        <div className="h-12 w-64 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-[500px] w-full rounded-[40px] bg-white/5 animate-pulse" />
      </div>
    );
  }

  const heroImage = facility.imageUrl;
  const dayStart = setMinutes(setHours(startOfDay(today), 8), 0);
  const visualEnd = setMinutes(setHours(startOfDay(today), 22), 0);
  const bookingEnd = setMinutes(setHours(startOfDay(today), 16), 0);
  const slotMinutes = facility.slotDurationMinutes;
  const allSlotStarts: Date[] = [];
  for (let t = dayStart.getTime(); t < visualEnd.getTime(); t += slotMinutes * 60 * 1000) {
    allSlotStarts.push(new Date(t));
  }

  const handleBook = () => {
    const target = `/dashboard/book?facilityId=${facility.id}`;
    if (!isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(target)}`);
    } else {
      navigate(target);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[48px] border border-white/5 bg-[rgba(18,10,30,0.4)] shadow-3xl backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-fast-primary/10 via-transparent to-fast-accent/10 opacity-30 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* Visual Sector */}
          <div className="relative flex-1 bg-[rgba(255,255,255,0.02)] p-12 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-fast-primary/5 to-transparent blur-[100px]" />
            {heroImage ? (
              <img 
                src={heroImage} 
                alt={facility.name} 
                className="max-h-[350px] max-w-full object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-2" 
              />
            ) : (
              <div className="text-[120px] opacity-20 filter grayscale drop-shadow-2xl">🏟️</div>
            )}
            
            <div className="absolute bottom-8 left-8 right-8 flex justify-center">
               <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 flex gap-6">
                  <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Capacity</span>
                     <span className="text-sm font-bold text-white">{facility.capacity} pax</span>
                  </div>
                  <div className="h-8 w-[1px] bg-white/10 my-auto" />
                  <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Duration</span>
                     <span className="text-sm font-bold text-white">{facility.slotDurationMinutes}m</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Content Sector */}
          <div className="relative flex-1 p-12 lg:p-16 flex flex-col justify-center space-y-10">
            <div className="space-y-4">
              <div className="inline-flex rounded-full bg-fast-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-fast-primary border border-fast-primary/20">
                {facility.category} Protocol
              </div>
              <h1 className="font-display text-5xl font-black tracking-tight text-white md:text-6xl uppercase italic">
                {facility.name}
              </h1>
              <p className="max-w-xl text-lg font-medium leading-relaxed text-[#7a6a9a]">
                {facility.description ?? 'A high-spec athletic environment engineered for strategic play and elite physical conditioning.'}
              </p>
            </div>

            <div className="space-y-6">
               <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="h-10 w-10 rounded-xl bg-fast-primary/20 flex items-center justify-center text-fast-primary">
                     <Clock4 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-fast-primary">Operational Hours</span>
                     <p className="text-sm font-bold text-white">08:00 AM &mdash; 04:00 PM Active</p>
                  </div>
               </div>

               <Button 
                onClick={handleBook}
                className="w-full h-16 rounded-2xl bg-fast-primary px-10 text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all duration-300 hover:brightness-110 active:scale-95"
               >
                {isAuthenticated ? 'Initiate Clearance' : 'Authenticate to Proceed'}
               </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3 mt-12">
        <div className="lg:col-span-2 space-y-8">
           <Card className="rounded-[32px] border-white/5 bg-[rgba(18,10,30,0.4)] p-8 shadow-xl backdrop-blur-xl">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-6">Manifesto & Rules</CardTitle>
              <div className="grid sm:grid-cols-2 gap-8 text-sm">
                 <div className="space-y-1 relative">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Objective Guidelines</span>
                    <p className="text-white/80 leading-relaxed italic">&ldquo;{facility.rules || 'Follow standard athletic protocols. Non-marking gear mandatory.'}&rdquo;</p>
                 </div>
                 <div className="space-y-1 relative">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Hardware Intel</span>
                    <p className="text-white/80 leading-relaxed italic">&ldquo;{facility.equipmentInfo || 'Standard equipment provided at the sector headquarters.'}&rdquo;</p>
                 </div>
              </div>
           </Card>

           <Card className="rounded-[32px] border-white/5 bg-[rgba(18,10,30,0.4)] p-8 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <CardTitle className="text-xl font-black uppercase tracking-tight text-white">Live Grid Availability</CardTitle>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                   Sector Nominal
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {allSlotStarts.map((start) => {
                  const key = start.getTime();
                  const isBooked = bookedSet.has(String(key));
                  const isWithinHours = start >= dayStart && start < bookingEnd;
                  return (
                    <div
                      key={key}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-center text-[10px] font-bold transition-all',
                        !isWithinHours
                          ? 'border-white/5 bg-white/5 text-white/20'
                          : isBooked
                          ? 'border-red-500/20 bg-red-500/10 text-red-400'
                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      )}
                    >
                      {format(start, 'HH:mm')}
                    </div>
                  );
                })}
              </div>
           </Card>
        </div>

        <div className="space-y-8">
           <Card className="rounded-[32px] border-white/5 bg-gradient-to-br from-fast-primary/20 to-fast-accent/20 p-8 shadow-xl backdrop-blur-xl">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-6">Mission Brief</CardTitle>
              <div className="space-y-6">
                 {[
                   { step: '01', title: 'Authenticate', desc: 'Secure login via FAST credentials' },
                   { step: '02', title: 'Window', desc: 'Selection of tactical time slot' },
                   { step: '03', title: 'Dispatch', desc: 'Confirmation of field deployment' },
                 ].map((s) => (
                   <div key={s.step} className="flex gap-4">
                      <span className="text-2xl font-black text-white/10">{s.step}</span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">{s.title}</h4>
                        <p className="text-xs text-[#7a6a9a]">{s.desc}</p>
                      </div>
                   </div>
                 ))}
                 <Button onClick={handleBook} variant="outline" className="w-full mt-4 h-12 rounded-xl border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10">
                    Access Armory
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
