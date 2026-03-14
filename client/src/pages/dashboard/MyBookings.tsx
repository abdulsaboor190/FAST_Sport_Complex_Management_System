import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw } from 'lucide-react';
import { useGetMyBookingsQuery } from '@/store/api/bookingsApi';
import { useCancelBookingMutation } from '@/store/api/bookingsApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CANCELLATION_POLICY, getRefundTierLabel } from '@/lib/refundPolicy';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Booking } from '@/store/api/bookingsApi';
import { differenceInHours } from 'date-fns';

function RefundBadge({ booking }: { booking: Booking }) {
  if (booking.status !== 'Cancelled' || !booking.cancelledAt) return null;
  const start = new Date(booking.startTime);
  const cancelledAt = new Date(booking.cancelledAt);
  const hoursUntil = differenceInHours(start, cancelledAt);
  let tier: 'full' | 'half' | 'none' = 'none';
  if (hoursUntil >= CANCELLATION_POLICY.fullRefundHours) tier = 'full';
  else if (hoursUntil >= CANCELLATION_POLICY.halfRefundHours) tier = 'half';
  const refund = booking.refundAmount ?? 0;
  return (
    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
      {tier !== 'none' ? `${getRefundTierLabel(tier)}: PKR ${refund}` : 'No refund'}
    </span>
  );
}

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: (id: string, reason?: string) => void;
  cancelling: string | null;
}) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const isPast = end < new Date();
  const canCancel =
    booking.status === 'Confirmed' &&
    !isPast &&
    differenceInHours(start, new Date()) >= CANCELLATION_POLICY.minNoticeHours;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className="relative overflow-hidden rounded-[24px] border border-white/5 bg-[rgba(18,10,30,0.4)] p-6 shadow-xl backdrop-blur-md transition-all hover:bg-[rgba(18,10,30,0.6)]"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-fast-primary/10 flex items-center justify-center text-fast-primary">
               {isPast ? <RefreshCw className="h-6 w-6 opacity-40" /> : <XCircle className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{booking.facility?.name ?? 'Facility'}</h3>
              <p className="text-xs font-black uppercase tracking-widest text-[#7a6a9a]">
                {format(start, 'EEE, MMM d, yyyy')} · {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                PKR {booking.totalAmount}
             </span>
             <span className={cn(
                'text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border',
                booking.status === 'Confirmed' && 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                booking.status === 'Pending' && 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                booking.status === 'Cancelled' && 'text-red-400 bg-red-500/10 border-red-500/20'
             )}>
                {booking.status}
             </span>
             {booking.status === 'Cancelled' && <RefundBadge booking={booking} />}
             {!isPast && booking.status === 'Confirmed' && (
                <span className="text-[10px] font-black uppercase tracking-widest text-fast-primary bg-fast-primary/10 px-2 py-1 rounded-md border border-fast-primary/20 animate-pulse">
                   Starts {formatDistanceToNow(start, { addSuffix: true })}
                </span>
             )}
          </div>

          {booking.purpose && (
            <p className="text-sm text-[#7a6a9a] italic">“{booking.purpose}”</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {canCancel && (
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-red-500/20 bg-red-500/5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all"
              disabled={cancelling === booking.id}
              onClick={() => onCancel(booking.id)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Abandon Mission
            </Button>
          )}
          {(!isPast || booking.status === 'Confirmed') && (
            <Link to={`/dashboard/book?facilityId=${booking.facilityId}`}>
              <Button size="lg" className="h-12 rounded-xl bg-fast-primary text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:scale-105 transition-all">
                Assemble Again
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MyBookings() {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { data: bookings, isLoading } = useGetMyBookingsQuery(
    filter === 'upcoming' ? { upcoming: true } : filter === 'past' ? { past: true } : undefined
  );
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

  const handleCancel = async (id: string, reason?: string) => {
    setCancellingId(id);
    try {
      const res = await cancelBooking({ id, reason }).unwrap();
      toast.success(
        res.refundAmount > 0
          ? `Mission aborted. Refund of PKR ${res.refundAmount} (${res.refundTier}) will be processed.`
          : 'Booking successfully terminated.'
      );
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } })?.data?.message ?? 'Termination failed';
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-10"
      >
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">My Sessions</h1>
          <p className="text-sm font-medium tracking-wide text-[#7a6a9a] uppercase">Oversee your clinical athletic schedule</p>
        </div>
        <Card className="border-white/5 bg-white/[0.02] p-4 rounded-2xl md:max-w-xs">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-fast-primary/20 flex items-center justify-center text-fast-primary">
                <RefreshCw className="h-4 w-4" />
             </div>
             <p className="text-[10px] leading-tight text-[#7a6a9a] font-medium">Notice 24h prior is required for credit redistribution.</p>
          </div>
        </Card>
      </motion.div>

      <div className="flex flex-wrap gap-4">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <Button
            key={f}
            variant="ghost"
            onClick={() => setFilter(f)}
            className={cn(
               "h-12 rounded-2xl px-8 text-[10px] font-black uppercase tracking-widest transition-all",
               filter === f
                ? "bg-fast-primary text-white shadow-[0_8px_16px_rgba(168,85,247,0.2)]"
                : "text-[#7a6a9a] hover:bg-white/5 hover:text-white"
            )}
          >
            {f === 'upcoming' ? 'Scheduled' : f === 'past' ? 'Historical' : 'Entire Archive'}
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-[24px] bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : bookings?.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-transparent py-24">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                 <RefreshCw className="h-10 w-10 text-[#7a6a9a]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Sessions Found</h3>
              <p className="text-sm text-[#7a6a9a] max-w-sm">Your athletic schedule is currently empty. Book a facility to start your journey.</p>
              <Link to="/dashboard/facilities" className="mt-8">
                 <Button className="bg-fast-primary text-white font-bold uppercase tracking-widest px-8 rounded-xl shadow-xl">Browse Facilities</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          bookings?.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={handleCancel}
              cancelling={cancelling ? cancellingId : null}
            />
          ))
        )}
      </div>
    </div>
  );
}
