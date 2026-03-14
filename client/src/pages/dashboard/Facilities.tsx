import { resolveImageUrl } from '@/config';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';
import { useGetFacilitiesQuery } from '@/store/api/facilitiesApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function Facilities() {
  const { data: facilities, isLoading } = useGetFacilitiesQuery();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-10"
      >
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl uppercase italic tracking-wider">The Complex</h1>
          <p className="text-sm font-medium tracking-wide text-[#7a6a9a] uppercase">World-class infrastructure for the unconventional athlete</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 rounded-[32px] bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(facilities ?? []).map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.01 }}
              className="group"
            >
              <button type="button" onClick={() => navigate(`/facilities/${f.slug}`)} className="w-full text-left">
                <Card className="relative h-full overflow-hidden border-white/5 bg-[rgba(18,10,30,0.4)] shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-fast-primary/30 hover:bg-[rgba(18,10,30,0.6)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fast-primary via-fast-accent to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  <div className="relative h-64 bg-[rgba(255,255,255,0.02)] p-8 flex items-center justify-center border-b border-white/5 overflow-hidden">
                    {f.imageUrl ? (
                      <img
                        src={resolveImageUrl(f.imageUrl)}
                        alt={f.name}
                        className="h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fast-primary/10 to-fast-accent/10">
                        <span className="text-6xl opacity-30">🏟️</span>
                      </div>
                    )}
                    <div className="absolute top-6 left-6">
                      <span className="rounded-full bg-fast-primary/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl backdrop-blur-md">
                        {f.category}
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                       <h3 className="font-display text-2xl font-black tracking-tight text-white group-hover:text-fast-primary transition-colors">{f.name}</h3>
                       <p className="line-clamp-2 text-sm font-medium leading-relaxed text-[#7a6a9a]">
                         {f.description ?? 'A state-of-the-art facility engineered for peak performance and strategic play.'}
                       </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-[#7a6a9a]">
                            <Users className="h-4 w-4" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Capacity</span>
                            <span className="text-xs font-bold text-white/80">{f.capacity} Units</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-[#7a6a9a]">
                            <Calendar className="h-4 w-4" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#7a6a9a]">Window</span>
                            <span className="text-xs font-bold text-white/80">{f.slotDurationMinutes} Min</span>
                         </div>
                      </div>
                    </div>
                    
                    <Button className="w-full h-12 rounded-xl bg-fast-primary font-bold text-[10px] uppercase tracking-widest text-white shadow-xl hover:brightness-110 active:scale-95 transition-all">
                      Initiate Booking Protocol
                    </Button>
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
