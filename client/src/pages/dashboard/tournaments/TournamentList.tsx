import { resolveImageUrl } from '@/config';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGetTournamentsQuery } from '@/store/api/tournamentApi';
import { Button } from '@/components/ui/Button';
import { Plus, Calendar, Users, Trophy, ChevronRight, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';

export function TournamentList() {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const { data: tournaments, isLoading, error } = useGetTournamentsQuery();

    const isAdmin = user?.role === 'Admin';

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-10"
            >
                <div className="space-y-2">
                    <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl uppercase italic">Grand Arena</h1>
                    <p className="text-sm font-medium tracking-wide text-[#7a6a9a] uppercase">Elite competition, strategic mastery, and absolute glory</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => navigate('create')} className="h-12 rounded-xl bg-fast-primary px-8 font-bold text-[10px] uppercase tracking-widest text-white shadow-xl hover:brightness-110 active:scale-95 transition-all">
                        <Plus className="mr-2 h-4 w-4" />
                        Forge Tournament
                    </Button>
                )}
            </motion.div>

            {isLoading ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-96 rounded-[32px] bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <Card className="border-red-500/20 bg-red-500/5 py-12">
                    <CardContent className="flex flex-col items-center text-center space-y-4">
                        <AlertTriangle className="h-12 w-12 text-red-400" />
                        <h3 className="text-lg font-bold text-white">Transmission Interrupted</h3>
                        <p className="text-sm text-[#7a6a9a]">Failed to retrieve laboratory data. Please re-authenticate.</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>Retry Uplink</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {tournaments && tournaments.length > 0 ? (
                        tournaments.map((t) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -8, scale: 1.01 }}
                                className="group"
                                onClick={() => navigate(`${t.id}`)}
                            >
                                <Card className="relative h-full overflow-hidden border-white/5 bg-[rgba(18,10,30,0.4)] shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-fast-primary/30 hover:bg-[rgba(18,10,30,0.6)] cursor-pointer">
                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fast-primary via-fast-accent to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    
                                    <div className="relative h-48 w-full overflow-hidden">
                                       {t.posterUrl ? (
                                           <img src={resolveImageUrl(t.posterUrl)} alt={t.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                       ) : (
                                           <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fast-primary/10 to-fast-accent/10">
                                               <Trophy className="h-16 w-16 text-fast-primary/30" />
                                           </div>
                                       )}
                                       <div className="absolute top-4 right-4">
                                          <span className={cn(
                                              "rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border",
                                              t.status === 'RegistrationOpen' ? "bg-emerald-500/90 text-white border-emerald-500/20" : "bg-white/10 text-white/60 border-white/5"
                                          )}>
                                              {t.status.replace(/([A-Z])/g, ' $1').trim()}
                                          </span>
                                       </div>
                                    </div>

                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                               <h3 className="font-display text-2xl font-black tracking-tight text-white group-hover:text-fast-primary transition-colors line-clamp-1">{t.name}</h3>
                                               <div className="rounded-full bg-white/5 p-2 transition-colors group-hover:bg-fast-primary/20">
                                                  <ChevronRight className="h-4 w-4 text-fast-primary" />
                                               </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                               <span className="text-[10px] font-black uppercase tracking-widest text-fast-primary">{t.sport}</span>
                                               <span className="h-1 w-1 rounded-full bg-white/20" />
                                               <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">{t.format}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-[#7a6a9a]">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                   <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Kickoff</span>
                                                   <span className="text-xs font-bold text-white/80">{format(new Date(t.startDate), 'MMM d, yyyy')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-[#7a6a9a]">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                   <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Sectors</span>
                                                   <span className="text-xs font-bold text-white/80">{t._count?.registrations || 0} / {t.maxTeams}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">
                                               <Activity className="h-3 w-3 text-emerald-400" />
                                               Active Protocol
                                            </div>
                                            <Button variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a] group-hover:text-white transition-all">
                                               Enter Chamber
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full">
                            <Card className="border-dashed border-white/10 bg-transparent py-24">
                                <CardContent className="flex flex-col items-center justify-center text-center">
                                    <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                       <Trophy className="h-10 w-10 text-[#7a6a9a]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Arena Vacant</h3>
                                    <p className="text-sm text-[#7a6a9a] max-w-sm">No grand tournaments are currently active in the sector.</p>
                                    {isAdmin && (
                                        <Button onClick={() => navigate('create')} className="mt-8 bg-fast-primary text-white font-bold uppercase tracking-widest px-8 rounded-xl shadow-xl">Forge First Event</Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
