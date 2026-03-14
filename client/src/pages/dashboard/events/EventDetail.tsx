import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { useGetEventQuery, useRegisterForEventMutation, useUnregisterFromEventMutation, useGetEventRegistrationsQuery, useGetMyRegistrationsQuery } from '@/store/api/eventsApi';
import type { EventType } from '@/store/api/eventsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store/hooks';
import { ArrowLeft, CalendarDays, MapPin, Users, Banknote, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

import { motion } from 'framer-motion';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  Workshop: 'Workshop',
  Seminar: 'Seminar',
  SportsDay: 'Championship',
  FitnessChallenge: 'Fitness Lab',
};

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'Admin';
  const { data: event, isLoading } = useGetEventQuery(id!, { skip: !id });
  const { data: registrations } = useGetEventRegistrationsQuery(id!, { skip: !id || !isAdmin });
  const { data: myRegs } = useGetMyRegistrationsQuery(undefined, { skip: !user });
  const isRegistered = myRegs?.some((r) => r.eventId === id && r.status === 'Registered') ?? false;
  const [register, { isLoading: registering }] = useRegisterForEventMutation();
  const [unregister, { isLoading: unregistering }] = useUnregisterFromEventMutation();

  const onRegister = async () => {
    if (!id) return;
    try {
      await register({ eventId: id }).unwrap();
      toast.success('Clearance Granted');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Clearance Denied');
    }
  };

  const onUnregister = async () => {
    if (!id) return;
    try {
      await unregister(id).unwrap();
      toast.success('Clearance Revoked');
    } catch {
      toast.error('Revocation Failed');
    }
  };

  if (!id) return null;
  if (isLoading || !event) {
    return (
      <div className="max-w-7xl mx-auto space-y-12 px-6 py-20">
         <div className="h-10 w-48 rounded-2xl bg-white/5 animate-pulse" />
         <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 h-[500px] rounded-[48px] bg-white/5 animate-pulse" />
            <div className="h-[500px] rounded-[48px] bg-white/5 animate-pulse" />
         </div>
      </div>
    );
  }

  const startStr = event.startTime;
  const endStr = event.endTime;
  const start = startStr ? new Date(startStr) : new Date();
  const end = endStr ? new Date(endStr) : new Date();
  const isUpcoming = startStr ? isAfter(start, new Date()) : false;
  const regCount = event._count?.registrations ?? 0;
  const capacity = event.capacity ?? 0;
  const full = capacity > 0 && regCount >= capacity;
  const canShowRegisterCta = isUpcoming && event.status === 'Published' && !full;
  const isLoggedIn = !!user;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-white">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-6 mb-12"
      >
        <Link to="/dashboard/events">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="space-y-1">
          <div className="inline-flex rounded-full bg-fast-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-fast-primary border border-fast-primary/20 mb-2">
            Operational Sector: {EVENT_TYPE_LABELS[event.type] || 'Mission Personnel'}
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-white uppercase italic">{event.title}</h1>
          <p className="text-sm font-medium text-[#7a6a9a] uppercase tracking-wider">Mission ID: EVT-{event.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </motion.div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[48px] border border-white/5 bg-[rgba(18,10,30,0.4)] shadow-3xl backdrop-blur-2xl group"
          >
            {event.bannerUrl ? (
              <div className="relative aspect-video w-full overflow-hidden">
                <img src={event.bannerUrl} alt="" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0814] via-transparent to-transparent opacity-60" />
              </div>
            ) : (
              <div className="aspect-video w-full flex items-center justify-center bg-gradient-to-br from-fast-primary/10 via-[#120a1e] to-fast-accent/10">
                <CalendarDays className="h-24 w-24 text-fast-primary/40" />
              </div>
            )}
            
            <div className="p-12 space-y-8">
               <div className="space-y-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white border-b border-white/5 pb-6">Mission Objectives</h2>
                  <p className="text-lg leading-relaxed text-white/80 font-medium whitespace-pre-wrap">{event.description || "No mission brief provided. Exercise caution."}</p>
               </div>
            </div>
          </motion.div>

          {isAdmin && registrations && (
            <Card className="rounded-[40px] border-white/5 bg-[rgba(18,10,30,0.4)] p-10 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                 <CardTitle className="text-xl font-black uppercase tracking-tight text-white">Personnel Manifest ({registrations.length})</CardTitle>
                 <Link to={`/dashboard/events/${id}/checkin`}>
                   <Button className="h-10 rounded-xl bg-fast-primary px-6 text-[10px] font-black uppercase tracking-widest text-white">Intake QR Scan</Button>
                 </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                {registrations.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 p-5 transition-all hover:bg-white/[0.08]">
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-white">{r.user?.name}</span>
                       <span className="text-[10px] font-medium text-[#7a6a9a] uppercase tracking-widest">{r.user?.fastId}</span>
                    </div>
                    {r.checkedIn && (
                       <div className="rounded-full bg-emerald-500/20 px-3 py-1 border border-emerald-500/20">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Deployed</span>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-10">
          <Card className="rounded-[40px] border-white/5 bg-[rgba(18,10,30,0.4)] p-8 shadow-xl backdrop-blur-xl">
             <div className="flex items-center justify-between mb-8">
                <CardTitle className="text-base font-black uppercase tracking-tight text-white">Temporal Data</CardTitle>
                <div className={cn(
                  "rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-0",
                  isUpcoming ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]' : 'bg-slate-500/20 text-slate-400'
                )}>
                  {isUpcoming ? 'Active' : 'Concluded'}
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                   <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-fast-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Deployment Window</span>
                   </div>
                   <p className="text-sm font-bold text-white pl-7">{format(start, 'PPp')} – {format(end, 'HH:mm')}</p>
                </div>

                {event.venue && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                     <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-fast-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Coordinates</span>
                     </div>
                     <p className="text-sm font-bold text-white pl-7">{event.venue}</p>
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                   <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-pink-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Personnel Count</span>
                   </div>
                   <p className="text-sm font-bold text-white pl-7">{regCount} / {capacity > 0 ? capacity : "∞"} Active Units</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                   <div className="flex items-center gap-3">
                      <Banknote className="h-4 w-4 text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Protocol Fee</span>
                   </div>
                   <p className="text-sm font-black text-white pl-7">{Number(event.entryFee) > 0 ? `PKR ${Number(event.entryFee)}` : 'Complimentary Class-A Access'}</p>
                </div>
             </div>
          </Card>

          <Card className="rounded-[40px] border-white/5 bg-gradient-to-br from-fast-primary/20 to-fast-accent/20 p-10 shadow-2xl backdrop-blur-xl">
             <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-8">Clearance Protocol</CardTitle>
             <div className="space-y-6">
                {!isLoggedIn ? (
                  <Button
                    onClick={() => navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`)}
                    className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:brightness-90 transition-all shadow-2xl"
                  >
                    Authenticate for Clearance
                  </Button>
                ) : isRegistered ? (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/10 border border-white/20 text-center">
                       <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-white">Clearance Active</span>
                       <p className="text-xs text-white/60 mt-2">Identity verified for deployment.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={onUnregister} 
                      disabled={unregistering}
                      className="w-full h-14 rounded-2xl border-white/20 bg-transparent text-white font-black uppercase tracking-widest hover:bg-white/5"
                    >
                      Revoke Clearance
                    </Button>
                  </div>
                ) : canShowRegisterCta ? (
                  <Button
                    onClick={onRegister}
                    disabled={registering}
                    className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:brightness-90 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.2)]"
                  >
                    {registering ? 'Processing...' : 'Request Clearance'}
                  </Button>
                ) : (
                  <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-3xl">
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed uppercase">Registration Link Inactive</p>
                  </div>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
