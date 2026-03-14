import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 32);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks: Array<{ to: string; label: string }> = [
    { to: '/', label: 'Surface' },
    { to: '/facilities', label: 'Sectors' },
    { to: '/tournaments', label: 'Operations' },
    { to: '/events', label: 'Transmissions' },
    { to: '/coaches', label: 'Tacticians' },
    { to: '/equipment', label: 'Armory' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0814] text-white selection:bg-fast-primary selection:text-black">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-50 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fast-primary/10 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fast-accent/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <nav
        className={cn(
          'fixed left-0 right-0 top-0 z-[100] transition-all duration-500',
          scrolled 
            ? 'h-20 bg-[rgba(13,8,20,0.8)] border-b border-white/5 backdrop-blur-2xl' 
            : 'h-28 bg-transparent'
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8 md:px-12">
          <Link to="/" className="group flex items-center gap-4">
            <div className="relative group overflow-hidden rounded-2xl p-1 bg-white/5 border border-white/10 transition-transform group-hover:scale-110 group-active:scale-95">
               <img src="/logo.png" className="h-12 w-12 object-contain brightness-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] shadow-2xl" alt="FSCM Logo" />
            </div>
            <div className="flex flex-col">
               <span className="font-display text-2xl font-black tracking-widest text-white uppercase italic leading-none">FSCM</span>
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#7a6a9a]">Network Core</span>
            </div>
          </Link>

          <div className="hidden items-center gap-12 lg:flex">
            <div className="flex items-center gap-10">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'relative text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:text-white',
                      isActive ? 'text-white' : 'text-[#7a6a9a]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.div 
                          layoutId="nav-underline"
                          className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="h-10 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/5 rounded-xl border border-white/5"
                >
                  Access
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  className="h-10 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-black bg-white hover:bg-gray-200 rounded-xl shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 active:scale-95"
                >
                  Induct
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <div className="flex flex-col gap-1.5">
               <div className={cn("h-0.5 w-6 bg-white transition-all", mobileOpen && "rotate-45 translate-y-2")} />
               <div className={cn("h-0.5 w-6 bg-white transition-all", mobileOpen && "opacity-0")} />
               <div className={cn("h-0.5 w-4 bg-white transition-all self-end", mobileOpen && "-rotate-45 -translate-y-2 !w-6")} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-40 bg-[#0d0814]/98 backdrop-blur-3xl lg:hidden flex flex-col p-12"
          >
            <div className="flex flex-col gap-8 mt-20">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'text-4xl font-black uppercase italic tracking-tighter transition-all',
                      isActive ? 'text-white' : 'text-[#7a6a9a] opacity-40'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            
            <div className="mt-auto flex flex-col gap-6">
              <Link to="/login">
                <Button className="w-full h-16 rounded-3xl bg-white text-black font-black uppercase tracking-widest text-[11px]">
                   Authenticate
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="w-full h-16 rounded-3xl border-white/10 text-white font-black uppercase tracking-widest text-[11px]">
                   Request Induction
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      <main className={cn("pt-28", location.pathname === '/' ? "pt-0" : "max-w-7xl mx-auto px-8 md:px-12")}>
        <Outlet />
      </main>
    </div>
  );
}

