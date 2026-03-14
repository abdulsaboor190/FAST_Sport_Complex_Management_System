import { useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import {
  Package,
  ArrowLeft,
  Star,
  QrCode,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useGetEquipmentByIdQuery, useCheckoutMutation, useCheckinMutation } from '@/store/api/equipmentApi';
import type { EquipmentCondition } from '@/store/api/equipmentApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/store/hooks';
import { motion } from 'framer-motion';

const conditionStars: Record<EquipmentCondition, number> = {
  Excellent: 4,
  Good: 3,
  Fair: 2,
  Poor: 1,
};

const checkoutSchema = z.object({
  plannedReturnAt: z.string().min(1, 'Return date is required'),
  notes: z.string().max(500).optional(),
  damageReported: z.string().max(1000).optional(),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

const checkinSchema = z.object({
  conditionOnReturn: z.enum(['Excellent', 'Good', 'Fair', 'Poor']).optional(),
  notes: z.string().max(500).optional(),
  damageReported: z.string().max(1000).optional(),
});
type CheckinForm = z.infer<typeof checkinSchema>;

export function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);

  const { data: item, isLoading } = useGetEquipmentByIdQuery(id!, { skip: !id });
  const [checkout, { isLoading: checkoutLoading }] = useCheckoutMutation();
  const [checkin, { isLoading: checkinLoading }] = useCheckinMutation();

  const checkoutForm = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      plannedReturnAt: '',
      notes: '',
      damageReported: '',
    },
  });
  const checkinForm = useForm<CheckinForm>({
    resolver: zodResolver(checkinSchema),
    defaultValues: { conditionOnReturn: 'Good', notes: '', damageReported: '' },
  });

  const onCheckout = checkoutForm.handleSubmit(async (data) => {
    try {
      await checkout({
        equipmentId: id,
        plannedReturnAt: new Date(data.plannedReturnAt).toISOString(),
        notes: data.notes || undefined,
        damageReported: data.damageReported || undefined,
      }).unwrap();
      toast.success('Check-out successful');
      setCheckoutOpen(false);
      checkoutForm.reset();
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Check-out failed');
    }
  });

  const onCheckin = checkinForm.handleSubmit(async (data) => {
    try {
      await checkin({
        qrCode: item?.qrCode,
        conditionOnReturn: (data.conditionOnReturn as EquipmentCondition) || undefined,
        notes: data.notes || undefined,
        damageReported: data.damageReported || undefined,
      }).unwrap();
      toast.success('Check-in successful');
      setCheckinOpen(false);
      checkinForm.reset();
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Check-in failed');
    }
  });

  if (!id) return null;
  if (isLoading || !item) {
    return (
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-20">
         <div className="h-10 w-48 rounded-2xl bg-white/5 animate-pulse" />
         <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 h-[500px] rounded-[48px] bg-white/5 animate-pulse" />
            <div className="h-[500px] rounded-[48px] bg-white/5 animate-pulse" />
         </div>
      </div>
    );
  }

  const photos = item.photos && item.photos.length > 0 ? item.photos : [];
  const mainImage = photos[galleryIndex];
  const conditionFull = conditionStars[item.condition];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 text-white">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-6 mb-12"
      >
        <Link to="/dashboard/equipment">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="space-y-1">
          <div className="inline-flex rounded-full bg-fast-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-fast-primary border border-fast-primary/20 mb-2">
            Unit Designation: {item.qrCode}
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-white uppercase italic">{item.name}</h1>
          <p className="text-sm font-medium text-[#7a6a9a] uppercase tracking-wider">{item.category?.name} Sector Hardware</p>
        </div>
      </motion.div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[48px] border border-white/5 bg-[rgba(18,10,30,0.4)] shadow-3xl backdrop-blur-2xl group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fast-primary/5 via-transparent to-pink-500/5 opacity-50" />
            <div className="relative aspect-video flex items-center justify-center p-12 overflow-hidden">
              <div className="absolute inset-0 bg-[rgba(255,255,255,0.01)] blur-[100px]" />
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={item.name}
                  className="max-h-[350px] max-w-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.9)] transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
                />
              ) : (
                <div className="text-[120px] opacity-20 filter grayscale drop-shadow-2xl">📦</div>
              )}
              
              <div className="absolute bottom-8 left-8 right-8 flex justify-center gap-4">
                 {photos.length > 0 && photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIndex(i)}
                      className={cn(
                        "h-4 w-4 rounded-full transition-all duration-300",
                        i === galleryIndex ? "bg-fast-primary w-12" : "bg-white/10 hover:bg-white/20"
                      )}
                    />
                 ))}
              </div>
            </div>
            
            {photos.length > 1 && (
              <div className="flex gap-4 p-8 bg-[rgba(255,255,255,0.02)] border-t border-white/5 overflow-x-auto custom-scrollbar">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIndex(i)}
                    className={cn(
                      'h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-300',
                      i === galleryIndex ? 'border-fast-primary scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-transparent hover:border-white/10'
                    )}
                  >
                    <img src={url} alt="" className="h-full w-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <Card className="rounded-[40px] border-white/5 bg-[rgba(18,10,30,0.4)] p-10 shadow-xl backdrop-blur-xl">
            <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-8 border-b border-white/5 pb-6">Operational Log</CardTitle>
            <div className="space-y-6">
              {item.transactions?.length ? (
                <div className="space-y-4">
                  {item.transactions.slice(0, 8).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 p-5 transition-all hover:bg-white/[0.08]"
                    >
                      <div className="flex items-center gap-5">
                         <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs",
                            tx.type === 'CheckOut' ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                         )}>
                            {tx.type === 'CheckOut' ? 'OUT' : 'IN'}
                         </div>
                         <div className="space-y-1">
                            <p className="text-sm font-bold text-white">{tx.type} by {tx.user?.name || 'Unknown Operator'}</p>
                            <p className="text-[10px] font-medium text-[#7a6a9a] uppercase tracking-widest">{format(new Date(tx.createdAt), 'PPp')}</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                   <div className="text-4xl opacity-20">🕳️</div>
                   <p className="text-sm font-black uppercase tracking-widest text-[#7a6a9a]">No historical data found in archive</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="rounded-[40px] border-white/5 bg-[rgba(18,10,30,0.4)] p-8 shadow-xl backdrop-blur-xl">
             <div className="flex items-center justify-between mb-8">
                <CardTitle className="text-base font-black uppercase tracking-tight text-white">Status Report</CardTitle>
                <Badge
                  className={cn(
                    "rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-0",
                    item.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]' : 
                    item.status === 'CheckedOut' ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 
                    'bg-slate-500/20 text-slate-400'
                  )}
                >
                  {item.status.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
             </div>
             
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Condition Index</span>
                   <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map((i) => (
                           <Star
                             key={i}
                             className={cn('h-3.5 w-3.5', i <= conditionFull ? 'fill-emerald-400 text-emerald-400' : 'text-white/10')}
                           />
                        ))}
                      </div>
                      <span className="text-xs font-black uppercase text-white">{item.condition}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Manufacturer</span>
                      <p className="text-sm font-bold text-white">{item.brand || 'Redacted'}</p>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a]">Inventory</span>
                      <p className="text-sm font-bold text-white">{item.quantity} Units Available</p>
                   </div>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex flex-col items-center space-y-4">
                   <QRCodeSVG value={item.qrCode} size={150} level="H" bgColor="transparent" fgColor="#fff" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Secure Identification Matrix</span>
                </div>
             </div>
          </Card>

          <Card className="rounded-[40px] border-white/5 bg-gradient-to-br from-fast-primary/20 to-fast-accent/20 p-10 shadow-2xl backdrop-blur-xl">
             <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-8">Interaction Protocol</CardTitle>
             <div className="space-y-6">
                {item.status === 'Available' ? (
                  !isAuthenticated ? (
                    <Button
                      onClick={() => navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`)}
                      className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:brightness-90 transition-all"
                    >
                      Authenticate to Dispatch
                    </Button>
                  ) : !checkoutOpen ? (
                    <Button
                      onClick={() => setCheckoutOpen(true)}
                      className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:brightness-90 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.2)]"
                    >
                      Initiate Dispatch
                    </Button>
                  ) : (
                    <form onSubmit={onCheckout} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Planned Return Matrix</label>
                          <input
                            type="datetime-local"
                            {...checkoutForm.register('plannedReturnAt')}
                            className="w-full h-14 rounded-2xl border-0 bg-white/10 px-5 text-sm font-bold text-white focus:ring-2 focus:ring-white/40"
                          />
                       </div>
                       <textarea
                        placeholder="Mission Notes..."
                        {...checkoutForm.register('notes')}
                        className="w-full h-24 rounded-2xl border-0 bg-white/10 px-5 py-4 text-sm font-bold text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/40 resize-none"
                       />
                       <div className="flex gap-4">
                         <Button type="submit" disabled={checkoutLoading} className="flex-1 h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest">Confirm</Button>
                         <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)} className="h-14 rounded-2xl border-white/20 bg-transparent text-white font-black uppercase tracking-widest hover:bg-white/5">Abort</Button>
                       </div>
                    </form>
                  )
                ) : item.status === 'CheckedOut' ? (
                   !checkinOpen ? (
                    <Button
                      onClick={() => setCheckinOpen(true)}
                      className="w-full h-16 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-2xl"
                    >
                      Process Intake
                    </Button>
                   ) : (
                    <form onSubmit={onCheckin} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Condition Assessment</label>
                          <select
                            {...checkinForm.register('conditionOnReturn')}
                            className="w-full h-14 rounded-2xl border-0 bg-white/10 px-5 text-sm font-bold text-white focus:ring-2 focus:ring-white/40 appearance-none"
                          >
                             <option value="Excellent" className="bg-[#120a1e]">EXCELLENT</option>
                             <option value="Good" className="bg-[#120a1e]">GOOD</option>
                             <option value="Fair" className="bg-[#120a1e]">FAIR</option>
                             <option value="Poor" className="bg-[#120a1e]">POOR</option>
                          </select>
                       </div>
                       <textarea
                        placeholder="Intake Report..."
                        {...checkinForm.register('notes')}
                        className="w-full h-24 rounded-2xl border-0 bg-white/10 px-5 py-4 text-sm font-bold text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/40 resize-none"
                       />
                       <div className="flex gap-4">
                         <Button type="submit" disabled={checkinLoading} className="flex-1 h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest">Verify</Button>
                         <Button type="button" variant="outline" onClick={() => setCheckinOpen(false)} className="h-14 rounded-2xl border-white/20 bg-transparent text-white font-black uppercase tracking-widest hover:bg-white/5">Cancel</Button>
                       </div>
                    </form>
                   )
                ) : (
                  <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-3xl">
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">Unit Currently unavailable for tactical operations. Check maintenance logs.</p>
                  </div>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}