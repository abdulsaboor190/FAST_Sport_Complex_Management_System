import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, QrCode, Search, Filter, ChevronRight, Star, AlertTriangle, ClipboardList, Wrench, LayoutDashboard } from 'lucide-react';
import { useGetCategoriesQuery, useGetEquipmentQuery } from '@/store/api/equipmentApi';
import { useAppSelector } from '@/store/hooks';
import type { EquipmentItem, EquipmentStatus, EquipmentCondition } from '@/store/api/equipmentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const statusColors: Record<EquipmentStatus, string> = {
  Available: 'bg-emerald-500/90 text-white',
  CheckedOut: 'bg-amber-500/90 text-white',
  UnderMaintenance: 'bg-slate-500/90 text-white',
};

const conditionStars: Record<EquipmentCondition, number> = {
  Excellent: 4,
  Good: 3,
  Fair: 2,
  Poor: 1,
};

function ConditionStars({ condition }: { condition: EquipmentCondition }) {
  const full = conditionStars[condition];
  return (
    <span className="flex items-center gap-0.5 text-amber-500" title={condition}>
      {[1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={cn('h-4 w-4', i <= full ? 'fill-current' : 'text-muted-foreground/40')}
        />
      ))}
    </span>
  );
}

function EquipmentCard({ item }: { item: EquipmentItem }) {
  const photo = item.photos?.[0];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Link to={`/dashboard/equipment/${item.id}`}>
        <Card className="relative overflow-hidden border-white/5 bg-[rgba(18,10,30,0.6)] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-fast-primary/30 hover:shadow-[0_30px_60px_-15px_rgba(168,85,247,0.15)]">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fast-primary/5 blur-[50px] transition-all duration-500 group-hover:bg-fast-primary/10" />
          
          <div className="relative h-44 bg-[rgba(255,255,255,0.02)] p-4 flex items-center justify-center border-b border-white/5">
            {photo ? (
              <img
                src={photo.startsWith('http') ? photo : photo}
                alt={item.name}
                className="max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-16 w-16 text-fast-primary/30" />
              </div>
            )}
            
            <div className="absolute right-3 top-3">
              <Badge className={cn('text-[10px] h-5 px-2 bg-black/40 border border-white/10 text-white backdrop-blur-md shadow-lg', statusColors[item.status])}>
                {item.status.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            </div>
            
            {item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold && (
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-400 shadow-lg backdrop-blur-sm">
                <AlertTriangle className="h-3 w-3" /> LOW STOCK
              </div>
            )}
          </div>

          <CardHeader className="relative pb-1 pt-4 px-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-bold tracking-tight text-white group-hover:text-fast-primary transition-colors truncate">
                {item.name}
              </CardTitle>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#7a6a9a] transition-transform group-hover:translate-x-1" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fast-primary/80">{item.category?.name ?? 'General'}</p>
          </CardHeader>

          <CardContent className="relative flex items-center justify-between pb-4 pt-2 px-6">
            <ConditionStars condition={item.condition} />
            <div className="flex items-center gap-3">
              {item.brand && <span className="text-[10px] uppercase font-bold text-[#7a6a9a]">{item.brand}</span>}
              {item.quantity > 1 && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/80">
                  ×{item.quantity}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
export function EquipmentCatalog() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'Admin';
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<EquipmentStatus | ''>('');
  const [condition, setCondition] = useState<EquipmentCondition | ''>('');
  const [search, setSearch] = useState('');

  const { data: categories, isLoading: catLoading } = useGetCategoriesQuery();
  const { data: items, isLoading: itemsLoading } = useGetEquipmentQuery({
    categoryId: categoryId || undefined,
    status: status || undefined,
    condition: condition || undefined,
    search: search.trim() || undefined,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-10"
      >
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl uppercase italic">The Armory</h1>
          <p className="text-sm font-medium tracking-wide text-[#7a6a9a] uppercase">Elite gear for high-performance operation</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard/equipment/scan">
            <Button variant="outline" className="h-12 rounded-xl border-white/10 bg-white/5 px-6 font-bold text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-all">
              <QrCode className="mr-2 h-4 w-4 text-fast-primary" />
              Scan QR
            </Button>
          </Link>
          <Link to="/dashboard/equipment/my-checkouts">
            <Button variant="outline" className="h-12 rounded-xl border-white/10 bg-white/5 px-6 font-bold text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-all">
              <ClipboardList className="mr-2 h-4 w-4 text-fast-primary" />
              Manifesto
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/dashboard/equipment/admin">
              <Button className="h-12 rounded-xl bg-fast-primary px-8 font-bold text-[10px] uppercase tracking-widest text-white shadow-xl hover:brightness-110 active:scale-95 transition-all">
                Registry Admin
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[rgba(18,10,30,0.4)] p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7a6a9a]" />
            <input
              type="text"
              placeholder="Locate equipment by name or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 text-sm font-medium text-white ring-offset-background placeholder:text-[#7a6a9a] focus:outline-none focus:ring-2 focus:ring-fast-primary/40 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
             <div className="flex flex-col gap-1.5 min-w-[160px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a] ml-1">Class</span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-14 rounded-2xl border border-white/5 bg-white/5 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-fast-primary/40 transition-all cursor-pointer hover:bg-white/10 appearance-none"
                >
                  <option value="" className="bg-[#120a1e]">All Sectors</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#120a1e]">{c.name}</option>
                  ))}
                </select>
             </div>

             <div className="flex flex-col gap-1.5 min-w-[160px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a] ml-1">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EquipmentStatus | '')}
                  className="h-14 rounded-2xl border border-white/5 bg-white/5 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-fast-primary/40 transition-all cursor-pointer hover:bg-white/10 appearance-none"
                >
                  <option value="" className="bg-[#120a1e]">Any Status</option>
                  <option value="Available" className="bg-[#120a1e]">Ready for deployment</option>
                  <option value="CheckedOut" className="bg-[#120a1e]">Currently Active</option>
                  <option value="UnderMaintenance" className="bg-[#120a1e]">Maintenance required</option>
                </select>
             </div>

             <div className="flex flex-col gap-1.5 min-w-[160px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#7a6a9a] ml-1">Integrity</span>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as EquipmentCondition | '')}
                  className="h-14 rounded-2xl border border-white/5 bg-white/5 px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-fast-primary/40 transition-all cursor-pointer hover:bg-white/10 appearance-none"
                >
                  <option value="" className="bg-[#120a1e]">Any Integrity</option>
                  <option value="Excellent" className="bg-[#120a1e]">Pristine</option>
                  <option value="Good" className="bg-[#120a1e]">Combat Ready</option>
                  <option value="Fair" className="bg-[#120a1e]">Field Worn</option>
                  <option value="Poor" className="bg-[#120a1e]">Compromised</option>
                </select>
             </div>
          </div>
        </div>
      </motion.div>

      {catLoading || itemsLoading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-72 rounded-[32px] bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items?.length ? (
              items.map((item) => <EquipmentCard key={item.id} item={item} />)
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full"
              >
                  <Card className="border-dashed border-white/10 bg-transparent py-24">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                      <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                         <Search className="h-10 w-10 text-[#7a6a9a]" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Inventory Out of Search</h3>
                      <p className="text-sm text-[#7a6a9a] max-w-sm">No equipment matching your criteria was found in our current manifest.</p>
                      <Button onClick={() => { setSearch(''); setCategoryId(''); setStatus(''); setCondition(''); }} className="mt-8 bg-white/10 text-white font-bold uppercase tracking-widest px-8 rounded-xl hover:bg-white/20">Clear All Filters</Button>
                    </CardContent>
                  </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
