import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Trophy, ChevronDown, Clock4, Shield, Zap, Target } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { useGetFacilitiesQuery } from '@/store/api/facilitiesApi';
import { useGetTournamentsQuery } from '@/store/api/tournamentApi';
import { useGetCoachesQuery } from '@/store/api/coachApi';
import { cn } from '@/lib/utils';

export function Landing() {
  const navigate = useNavigate();
  const { data: facilities } = useGetFacilitiesQuery();
  const { data: tournaments } = useGetTournamentsQuery({ upcoming: true });
  const { data: coaches } = useGetCoachesQuery();

  return (
    <div className="relative overflow-hidden bg-[#0a0710] text-[#f0e8ff]">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-50 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[#0a0710]" />
          
          {/* Subtle Watermark Branding */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
             <img 
               src="/logo.png" 
               className="w-[120%] h-[120%] object-contain opacity-[0.03] grayscale brightness-200 pointer-events-none" 
               alt=""
             />
          </div>

          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-fast-primary/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fast-accent/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <main className="relative">
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-8">
           <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-12"
              >
                 <div className="space-y-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-5 py-2"
                    >
                       <span className="h-2 w-2 rounded-full bg-fast-primary animate-ping" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fast-primary">Network Online: 2024 Protocol</span>
                    </motion.div>
                    <h1 className="font-display text-[clamp(60px,8vw,120px)] font-black leading-[0.85] tracking-tighter text-white italic uppercase">
                       Master <br />
                       <span className="bg-gradient-to-r from-fast-primary via-fast-accent to-pink-500 bg-clip-text text-transparent">The Grid.</span>
                    </h1>
                    <p className="max-w-lg text-lg font-medium leading-relaxed text-[#7a6a9a]">
                       The definitive interface for elite sports management. Secure courts, command operations, and deploy with the best tacticians in the network.
                    </p>
                 </div>

                 <div className="flex flex-wrap items-center gap-6">
                    <Button 
                      size="lg"
                      onClick={() => navigate('/facilities')}
                      className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-[.2em] text-[11px] shadow-[0_20px_40px_rgba(255,255,255,0.15)] hover:scale-105 transition-all"
                    >
                       Initialize Operations
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/login')}
                      className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase tracking-[.2em] text-[11px] hover:bg-white/10"
                    >
                       Operator Access
                    </Button>
                 </div>

                 <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/5">
                    {[
                      { label: 'Sectors', val: '14+' },
                      { label: 'Operatives', val: '800+' },
                      { label: 'Uptime', val: '99.9%' }
                    ].map(s => (
                      <div key={s.label} className="space-y-1">
                         <div className="text-2xl font-black text-white italic">{s.val}</div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">{s.label}</div>
                      </div>
                    ))}
                 </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative hidden lg:flex flex-col gap-8 h-full justify-center"
              >
                 {/* Current Status Card */}
                 <div className="relative group rounded-[40px] border border-white/10 bg-[#0d0714]/60 p-10 backdrop-blur-2xl shadow-3xl overflow-hidden transition-all hover:bg-[#0d0714]/80">
                    <div className="absolute inset-0 bg-gradient-to-br from-fast-primary/10 to-transparent opacity-50" />
                    <div className="relative space-y-8">
                       <div className="flex items-center justify-between">
                          <div className="space-y-1">
                             <div className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Current Status</div>
                             <div className="text-xl font-black text-white">Active Transmissions</div>
                          </div>
                          <Zap className="h-8 w-8 text-fast-primary animate-pulse" />
                       </div>
                       
                       <div className="space-y-4">
                          {[
                            { name: 'Championship Arena', status: 'In Session', progress: 85, color: 'from-fast-primary to-purple-400', icon: Trophy },
                            { name: 'The Armory', status: 'Restocking', progress: 40, color: 'from-amber-400 to-orange-400', icon: Shield },
                            { name: 'Tactical Lab', status: 'Ready', progress: 100, color: 'from-emerald-400 to-cyan-400', icon: Target }
                          ].map(it => (
                            <div key={it.name} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-5 transition-all hover:bg-white/10">
                               <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                  <it.icon className="h-5 w-5 text-white/60" />
                               </div>
                               <div className="flex-1 space-y-2">
                                  <div className="flex justify-between items-center text-[11px]">
                                     <span className="font-bold text-white/90">{it.name}</span>
                                     <span className="font-black uppercase tracking-widest text-[#7a6a9a] text-[8px]">{it.status}</span>
                                  </div>
                                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       whileInView={{ width: `${it.progress}%` }}
                                       className={cn("h-full rounded-full bg-gradient-to-r", it.color)} 
                                     />
                                   </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Facility Map: Real-Time Card */}
                 <div className="relative group rounded-[40px] border border-white/10 bg-[#0d0714]/60 p-10 backdrop-blur-2xl shadow-3xl overflow-hidden transition-all hover:bg-[#0d0714]/80">
                    <div className="absolute inset-0 bg-gradient-to-tr from-fast-accent/10 to-transparent opacity-50" />
                    <div className="relative space-y-6">
                       <h3 className="text-xl font-black text-white tracking-tight">Facility Map: Real-Time</h3>
                       <div className="relative rounded-3xl overflow-hidden border border-white/10 group-hover:scale-[1.02] transition-transform duration-700">
                          <img 
                            src="/facility_map.png" 
                            className="w-full h-auto object-cover opacity-90 transition-opacity hover:opacity-100" 
                            alt="Facility Map" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0714]/80 via-transparent to-transparent" />
                          
                          {/* Pulse Markers mimicking real-time data */}
                          <div className="absolute top-1/4 left-1/3 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse" />
                          <div className="absolute bottom-1/3 right-1/4 h-3 w-3 rounded-full bg-fast-primary shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse" />
                          
                          {/* Live Legend */}
                          <div className="absolute bottom-6 left-6 flex flex-col gap-2 p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Operational: Ready</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-fast-primary" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Operational: Active</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
           
           <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-20 opacity-40"
           >
              <ChevronDown className="h-8 w-8" />
           </motion.div>
        </section>

        <section className="py-32 px-8">
           <div className="max-w-7xl mx-auto space-y-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                 <div className="space-y-6">
                    <h2 className="font-display text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white">Elite <br /> <span className="text-fast-primary">Sectors.</span></h2>
                    <p className="max-w-md text-[#7a6a9a] font-medium text-lg">High-spec athletic environments engineered for strategic superiority and elite conditioning.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {facilities?.slice(0, 3).map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/facilities/${f.slug}`)}
                      className="group relative h-[520px] rounded-[48px] border border-white/5 bg-[rgba(18,10,30,0.4)] overflow-hidden cursor-pointer shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-4 hover:border-fast-primary/40"
                    >
                       <div className="absolute inset-0 bg-gradient-to-t from-[#0d0814] via-transparent to-transparent opacity-80" />
                       <div className="relative h-2/3 p-10 flex items-center justify-center">
                          {f.imageUrl ? (
                             <img src={f.imageUrl} className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3" />
                          ) : (
                             <Shield className="h-32 w-32 text-fast-primary/20" />
                          )}
                          <div className="absolute top-8 left-8">
                             <div className="rounded-full bg-fast-primary/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl backdrop-blur-md">
                                {f.category}
                             </div>
                          </div>
                       </div>
                       <div className="relative p-10 pt-0 space-y-4">
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tight">{f.name}</h3>
                          <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#7a6a9a]">Capacity</span>
                                <span className="text-[10px] font-bold text-white">{f.capacity} Units</span>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        <section className="py-32 px-8 bg-white/[0.012] border-y border-white/5">
           <div className="max-w-7xl mx-auto space-y-20">
              <div className="text-center space-y-6">
                 <h2 className="font-display text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white">Active <span className="text-fast-accent">Operations.</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {tournaments?.slice(0, 3).map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/tournaments/${t.id}`)}
                      className="group relative rounded-[40px] border border-white/5 bg-[rgba(18,10,30,0.6)] p-8 space-y-8 cursor-pointer hover:bg-white/[0.05] transition-all"
                    >
                       <div className="relative aspect-square rounded-[32px] overflow-hidden bg-white/5 flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                          {t.posterUrl ? (
                             <img src={t.posterUrl} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                          ) : (
                             <Trophy className="h-24 w-24 text-fast-accent/20" />
                          )}
                       </div>
                       <div className="space-y-4">
                          <h3 className="text-2xl font-black text-white uppercase italic leading-none">{t.name}</h3>
                          <div className="flex items-center gap-4 text-xs font-bold text-[#7a6a9a]">
                             <Calendar className="h-4 w-4" />
                             <span>{format(new Date(t.startDate), 'MMM dd')} – {format(new Date(t.endDate), 'MMM dd')}</span>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        <section className="py-32 px-8">
           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-32 items-center">
              <div className="space-y-12">
                 <div className="space-y-6">
                    <h2 className="font-display text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">The <br /> <span className="text-fast-primary">Tacticians.</span></h2>
                    <p className="text-lg font-medium text-[#7a6a9a]">Direct coordination with elite certified specialists for optimized physical performance.</p>
                 </div>
                 
                 <Button 
                   onClick={() => navigate('/coaches')}
                   className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px]"
                 >
                    Full Tactician Directory
                 </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 relative">
                 {coaches?.slice(0, 4).map((c, i) => (
                    <motion.div 
                      key={c.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-6 rounded-[32px] border border-white/5 bg-[#120a1e]/80 backdrop-blur-xl space-y-4",
                        i % 2 === 1 ? "translate-y-12" : ""
                      )}
                    >
                       <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-fast-primary to-fast-accent flex items-center justify-center text-2xl font-black text-white">
                          {c.user.name.slice(0, 1).toUpperCase()}
                       </div>
                       <h4 className="text-sm font-black text-white uppercase">{c.user.name}</h4>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        <footer className="py-20 px-8 border-t border-white/5">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-[#7a6a9a]">
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <img src="/logo.png" className="h-12 w-12 object-contain brightness-110" alt="FSCM Logo" />
                    <span className="font-display text-2xl font-black tracking-widest text-white uppercase italic">FSCM</span>
                 </div>
                 <p className="max-w-xs text-sm font-medium leading-relaxed">
                    FAST University Sports Complex Management System. Engineered for elite athletic coordination.
                 </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-12 items-center">
                 <Link to="/facilities" className="text-[10px] font-black uppercase tracking-widest text-white hover:text-fast-primary transition-colors">Sectors</Link>
                 <Link to="/tournaments" className="text-[10px] font-black uppercase tracking-widest text-white hover:text-fast-primary transition-colors">Operations</Link>
                 <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-white hover:text-fast-primary transition-colors">Terminal</Link>
              </div>
           </div>
           
           <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7a6a9a]">© 2024 NETWORK CORE. ALL RIGHTS RESERVED.</p>
           </div>
        </footer>
      </main>
    </div>
  );
}
