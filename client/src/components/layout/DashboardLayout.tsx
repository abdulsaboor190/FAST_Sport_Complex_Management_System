import { resolveImageUrl } from '@/config';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  Calendar,
  BarChart3,
  Trophy,
  Package,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Users,
  CalendarDays,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useLogoutMutation } from '@/store/api/authApi';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const navItems: Array<{
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles?: readonly string[];
}> = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
  { to: '/dashboard/facilities', icon: Building2, label: 'Facilities' },
  { to: '/dashboard/bookings', icon: Calendar, label: 'My Bookings' },
  { to: '/dashboard/issues', icon: AlertTriangle, label: 'Issues' },
  { to: '/dashboard/coaches', icon: Users, label: 'Coaches' },
  { to: '/dashboard/events', icon: CalendarDays, label: 'Events' },
  { to: '/dashboard/tournaments', icon: Trophy, label: 'Tournaments' },
  { to: '/dashboard/equipment', icon: Package, label: 'Equipment' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', roles: ['Admin'] as const },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(logout());
      navigate('/');
      toast.success('Logged out');
    } catch {
      dispatch(logout());
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0814] text-[#f0e8ff]">
      {/* Premium Glassmorphic Sidebar - Desktop */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-full w-72 flex-col border-r border-white/5 bg-[rgba(13,8,20,0.8)] shadow-[20px_0_40px_rgba(0,0,0,0.3)] backdrop-blur-3xl transition-all duration-300 lg:flex',
          sidebarOpen ? 'translate-x-0' : 'translate-x-0'
        )}
      >
        <div className="flex h-20 items-center justify-center border-b border-white/5 relative">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-lg">
               <img src="/logo.png" className="h-6 w-6 object-contain brightness-110" alt="Logo" />
            </div>
            <span className="bg-[linear-gradient(135deg,#fff,#a855f7)] bg-clip-text font-display text-xl font-black uppercase tracking-[0.25em] text-transparent">
              FSCM
            </span>
          </Link>
          <div className="absolute -right-[1px] top-1/4 h-1/2 w-[2px] bg-gradient-to-b from-transparent via-fast-primary/40 to-transparent" />
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar px-4 py-8">
          <p className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a9a]">Main Navigation</p>
          <nav className="space-y-1.5">
            {navItems
              .filter((item) => !item.roles || (user?.role && item.roles.includes(user.role)))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-r from-fast-primary/20 to-fast-primary/5 text-white shadow-[0_10px_20px_rgba(168,85,247,0.1)]'
                        : 'text-[#7a6a9a] hover:bg-white/[0.03] hover:text-[#f0e8ff]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn(
                        'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
                        isActive ? 'text-fast-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-[#7a6a9a] group-hover:text-white'
                      )} />
                      <span className="relative z-10">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-y-2 left-0 w-1 rounded-full bg-fast-primary shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/5 bg-white/[0.01] p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-11 w-11 border-2 border-fast-primary/20 shadow-xl">
                <AvatarImage src={resolveImageUrl(user?.avatarUrl ?? undefined)} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-fast-primary/40 to-fast-accent/40 text-sm font-black text-white">
                  {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#120a1e] bg-emerald-500 shadow-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{user?.name}</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-fast-primary/70">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 w-full justify-start rounded-xl border border-white/5 bg-white/[0.03] text-xs font-bold uppercase tracking-widest text-[#7a6a9a] transition-all hover:bg-red-500/10 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer Redesign */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-[70] h-full w-4/5 max-w-[320px] border-r border-white/5 bg-[#0d0814] shadow-2xl lg:hidden"
            >
              <div className="flex h-20 items-center justify-between border-b border-white/5 px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-lg">
                    <img src="/logo.png" className="h-6 w-6 object-contain brightness-110" alt="Logo" />
                  </div>
                  <span className="font-display text-lg font-black uppercase tracking-widest text-white">FSCM</span>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5 text-white/70" />
                </Button>
              </div>
              <div className="p-4 pt-6 space-y-1">
                {navItems
                  .filter((item) => !item.roles || (user?.role && item.roles.includes(user.role)))
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-bold transition-all',
                          isActive
                            ? 'bg-fast-primary text-white shadow-xl shadow-fast-primary/20'
                            : 'text-[#7a6a9a] hover:bg-white/5 hover:text-white'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-6">
                 <Button variant="ghost" className="h-12 w-full justify-start rounded-xl bg-red-500/10 text-xs font-bold uppercase tracking-widest text-red-400" onClick={handleLogout}>
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign Out
                  </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-72 transition-all duration-300">
        <header className="sticky top-0 z-50 flex h-20 items-center gap-4 border-b border-white/5 bg-[rgba(13,8,20,0.8)] px-6 backdrop-blur-3xl lg:px-12">
          <Button
            variant="ghost"
            size="icon"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <p className="hidden text-xs font-bold uppercase tracking-[0.2em] text-[#7a6a9a] md:block">
               FAST Sports Complex Management
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10 cursor-pointer">
              <Settings className="h-5 w-5 text-[#7a6a9a]" onClick={() => navigate('/dashboard/settings')} />
            </div>
            
            <div className="h-8 w-[1px] bg-white/5" />

            <button 
              onClick={() => navigate('/dashboard/profile')}
              className="group flex items-center gap-3 rounded-2xl bg-white/[0.03] p-1.5 pr-4 border border-white/5 transition-all hover:bg-white/10 active:scale-95"
            >
              <Avatar className="h-8 w-8 border border-fast-primary/20">
                <AvatarImage src={resolveImageUrl(user?.avatarUrl ?? undefined)} alt={user?.name} />
                <AvatarFallback className="bg-fast-primary/20 text-[10px] font-black">{user?.name?.slice(0, 2).toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-none group-hover:text-fast-primary transition-colors">{user?.name}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-[#7a6a9a] leading-none">ID: {user?.fastId?.split('-')[0]}</p>
              </div>
            </button>
          </div>
        </header>

        <main className="relative min-h-[calc(100vh-80px)]">
           {/* Background subtle gradients */}
           <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-fast-primary/5 blur-[120px]" />
              <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-fast-accent/5 blur-[120px]" />
           </div>

          <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12 lg:px-16 lg:py-14">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
