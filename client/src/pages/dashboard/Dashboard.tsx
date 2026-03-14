import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Trophy, Package, Building2, Users, CalendarDays, AlertTriangle } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="space-y-12">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-gradient-to-br from-[rgba(168,85,247,0.1)] to-transparent p-8 md:p-12 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-fast-primary/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-fast-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-fast-primary border border-fast-primary/20 backdrop-blur-md">
               Elite Membership · {user?.role}
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
              Focus on <span className="bg-gradient-to-r from-fast-primary to-fast-accent bg-clip-text text-transparent italic">your game</span>,<br />
              we handle the <span className="text-white/40 underline decoration-fast-primary/30 underline-offset-8">rest</span>.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-[#7a6a9a]">
              Welcome back, <span className="text-white font-bold">{user?.name}</span>. Your current registration ID is <span className="font-mono text-fast-accent">{user?.fastId}</span>. All your sport activities managed in one premium space.
            </p>
          </div>
          
          <div className="hidden lg:block shrink-0">
             <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-16 w-16 rounded-2xl border-4 border-[#120a1e] bg-white/5 flex items-center justify-center text-2xl shadow-2xl backdrop-blur-xl">
                    {['🏟️', '🎾', '🏆', '⚽'][i-1]}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Quick Stats / Today's Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Upcoming Bookings', value: '02', icon: Calendar, color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400' },
          { label: 'Active Tournaments', value: '01', icon: Trophy, color: 'from-fast-primary/20 to-fast-primary/5', iconColor: 'text-fast-primary' },
          { label: 'Equipment Out', value: '00', icon: Package, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
          { label: 'Reports Pending', value: '00', icon: AlertTriangle, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br p-6 shadow-xl backdrop-blur-sm transition-all hover:scale-105",
              stat.color
            )}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
              <div className={cn("rounded-xl bg-white/5 p-3", stat.iconColor)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation Grid */}
      <div className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#7a6a9a] px-2 text-center">Quick Access</h2>
        <div className="grid grid-cols-1 justify-items-center gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Facilities', desc: 'Premium courts and fields', icon: Building2, href: '/dashboard/facilities', accent: 'group-hover:text-emerald-400' },
            { title: 'My Bookings', desc: 'Secure your next session', icon: Calendar, href: '/dashboard/bookings', accent: 'group-hover:text-fast-primary' },
            { title: 'Coaches', desc: 'Train with professional elite staff', icon: Users, href: '/dashboard/coaches', accent: 'group-hover:text-blue-400' },
            { title: 'Events', desc: 'Seminars and workshops catalog', icon: CalendarDays, href: '/dashboard/events', accent: 'group-hover:text-amber-400' },
            { title: 'Tournaments', desc: 'Competitive play registration', icon: Trophy, href: '/dashboard/tournaments', accent: 'group-hover:text-purple-400' },
            { title: 'Equipment', desc: 'Gear up for performance', icon: Package, href: '/dashboard/equipment', accent: 'group-hover:text-pink-400' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="group relative h-[140px] w-full max-w-[360px]"
            >
              <Link to={item.href} className="block h-full">
                <div className="flex h-full flex-col justify-center rounded-[24px] border border-white/5 bg-white/[0.02] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:border-white/20 group-hover:bg-white/[0.05]">
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent shadow-inner transition-colors group-hover:from-fast-primary/20">
                      <item.icon className={cn("h-6 w-6 text-[#7a6a9a] transition-colors duration-300", item.accent)} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white transition-colors group-hover:text-fast-primary">{item.title}</h3>
                      <p className="text-xs text-[#7a6a9a] leading-tight">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-lg" />
    </div>
  );
}
