import { resolveImageUrl } from '@/config';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Star, ChevronRight } from 'lucide-react';
import { useGetCoachesQuery } from '@/store/api/coachApi';
import type { CoachListItem } from '@/store/api/coachApi';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

function CoachCard({ coach }: { coach: CoachListItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="group"
    >
      <Link to={`/dashboard/coaches/${coach.id}`}>
        <Card className="relative h-full overflow-hidden border-white/5 bg-[rgba(18,10,30,0.6)] shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-fast-primary/30">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fast-primary via-fast-accent to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="p-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-8">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-fast-primary to-fast-accent opacity-20 blur group-hover:opacity-40 transition-opacity" />
                <Avatar className="h-32 w-32 border-4 border-white/10 shadow-2xl relative">
                  <AvatarImage src={resolveImageUrl(coach.user.avatarUrl ?? undefined)} alt={coach.user.name} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-fast-primary to-fast-accent text-3xl font-black text-white">
                    {coach.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-[rgba(18,10,30,1)] shadow-lg" />
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-black tracking-tight text-white">{coach.user.name}</h3>
                    <div className="rounded-full bg-white/5 p-2 transition-colors group-hover:bg-fast-primary/20">
                      <ChevronRight className="h-5 w-5 text-fast-primary" />
                    </div>
                  </div>
                  {coach.specializations?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {coach.specializations.map((spec, i) => (
                        <span key={i} className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a] bg-white/5 px-2 py-1 rounded-md border border-white/5">
                          {spec}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-6 pt-2">
                  {coach.avgRating != null && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a] mb-1">Rating</span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex">
                           {[1, 2, 3, 4, 5].map((s) => (
                             <Star key={s} className={cn("h-3 w-3", s <= Math.round(coach.avgRating || 0) ? "fill-amber-400 text-amber-400" : "text-white/10")} />
                           ))}
                        </div>
                        <span className="text-sm font-bold text-white">{coach.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col border-l border-white/10 pl-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a] mb-1">Sessions</span>
                    <span className="text-sm font-bold text-white">{coach.reviewCount}+ sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-8 pb-8 pt-2">
             <Button className="w-full h-12 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/5 group-hover:bg-fast-primary group-hover:text-white group-hover:border-fast-primary transition-all shadow-xl">
                View Expert Profile
             </Button>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function CoachList() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: coaches, isLoading } = useGetCoachesQuery();

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-10"
      >
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">Our Mentors</h1>
          <p className="text-sm font-medium tracking-wide text-[#7a6a9a] uppercase">World-class coaching for elite athletes</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/coaches/sessions">
            <Button variant="outline" className="h-12 rounded-xl border-white/10 bg-white/5 px-6 font-bold text-xs uppercase tracking-widest text-white hover:bg-white/10">
              Manage Sessions
            </Button>
          </Link>
          {user?.role === 'Admin' && (
            <Link to="/dashboard/coaches/performance">
              <Button className="h-12 rounded-xl bg-fast-primary px-6 font-bold text-xs uppercase tracking-widest text-white shadow-xl hover:brightness-110">
                Performance
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[280px] rounded-[32px] bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : coaches?.length ? (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {coaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="border-dashed border-white/10 bg-transparent py-24">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                 <Users className="h-10 w-10 text-[#7a6a9a]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Finding Mentors</h3>
              <p className="text-sm text-[#7a6a9a] max-w-sm">We are currently onboarding world-class coaches to help you reach your peak performance.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
