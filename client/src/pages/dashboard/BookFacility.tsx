import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, addMinutes, startOfDay, setHours, setMinutes, addDays, subDays } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronLeft, ChevronRight, Clock4 } from 'lucide-react';
import { useGetFacilityQuery, useGetBookedSlotsQuery } from '@/store/api/facilitiesApi';
import { useCreateBookingMutation } from '@/store/api/bookingsApi';
import { useAppSelector } from '@/store/hooks';
import { subscribeFacilitySlots } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const formSchema = z.object({
  purpose: z.string().max(500).optional(),
  participantCount: z.number().int().min(1).max(500).optional(),
  specialRequirements: z.string().max(500).optional(),
});
type FormData = z.infer<typeof formSchema>;

interface SlotInfo {
  start: Date;
  end: Date;
}

export function BookFacility() {
  const [searchParams] = useSearchParams();
  const facilityId = searchParams.get('facilityId') ?? '';
  const navigate = useNavigate();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const dateStr = format(viewDate, 'yyyy-MM-dd');

  const { data: facility, isLoading: facilityLoading } = useGetFacilityQuery(facilityId, {
    skip: !facilityId,
  });
  const { data: slotsData, refetch: refetchSlots } = useGetBookedSlotsQuery(
    { facilityId, date: dateStr },
    { skip: !facilityId || !dateStr }
  );
  const [createBooking, { isLoading: creating }] = useCreateBookingMutation();

  useEffect(() => {
    if (!facilityId || !dateStr) return;
    return subscribeFacilitySlots(facilityId, dateStr, () => {
      refetchSlots();
    });
  }, [facilityId, dateStr, refetchSlots]);

  const bookedSet = useMemo(() => {
    const set = new Set<string>();
    (slotsData?.slots ?? []).forEach((s) => {
      const start = new Date(s.start).getTime();
      for (let t = start; t < new Date(s.end).getTime(); t += (facility?.slotDurationMinutes ?? 30) * 60 * 1000) {
        set.add(String(t));
      }
    });
    return set;
  }, [slotsData, facility?.slotDurationMinutes]);

  const handleSelectSlot = (slot: { start: Date; end: Date }) => {
    if (!facility) return;
    const durationMins = (slot.end.getTime() - slot.start.getTime()) / 60000;
    const slotCount = durationMins / facility.slotDurationMinutes;
    if (slotCount < facility.minBookingSlots || slotCount > facility.maxBookingSlots) {
      toast.error(
        `Select ${facility.minBookingSlots}-${facility.maxBookingSlots} slot(s) (${facility.slotDurationMinutes} min each)`
      );
      return;
    }
    setSelectedSlot({ start: slot.start, end: slot.end });
  };

  const dayStart = setMinutes(setHours(startOfDay(viewDate), 8), 0);
  const visualEnd = setMinutes(setHours(startOfDay(viewDate), 22), 0);
  const bookingEnd = setMinutes(setHours(startOfDay(viewDate), 16), 0);
  const slotMinutes = facility?.slotDurationMinutes ?? 30;
  const allSlotStarts: Date[] = [];
  for (let t = dayStart.getTime(); t < visualEnd.getTime(); t += slotMinutes * 60 * 1000) {
    allSlotStarts.push(new Date(t));
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { purpose: '', participantCount: undefined, specialRequirements: '' },
  });

  const onSubmit = async (data: FormData) => {
    if (!selectedSlot || !facilityId) return;
    try {
      await createBooking({
        facilityId,
        startTime: selectedSlot.start.toISOString(),
        endTime: selectedSlot.end.toISOString(),
        purpose: data.purpose || undefined,
        participantCount: data.participantCount,
        specialRequirements: data.specialRequirements || undefined,
      }).unwrap();
      toast.success('Booking confirmed!');
      setSelectedSlot(null);
      form.reset();
      refetchSlots();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; code?: string; conflicts?: unknown } };
      const msg = e?.data?.message ?? 'Booking failed';
      if (e?.data?.code === 'CONFLICT') {
        toast.error('Slot was just taken. Please pick another.');
        refetchSlots();
        setSelectedSlot(null);
      } else {
        toast.error(msg);
      }
    }
  };

  if (!facilityId) {
    navigate('/dashboard/facilities');
    return null;
  }

  if (facilityLoading || !facility) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    );
  }

  const slotCount = selectedSlot
    ? Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / 60000 / facility.slotDurationMinutes)
    : 0;
  const slotStartMins = selectedSlot
    ? selectedSlot.start.getHours() * 60 + selectedSlot.start.getMinutes()
    : 0;
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold">Book: {facility.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Click and drag on the calendar to select a slot, or click a single slot. Green = available.
        </p>
      </motion.div>

      <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Availability — {format(viewDate, 'EEE, MMM d, yyyy')}</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setViewDate((d) => subDays(d, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setViewDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => setViewDate((d) => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Click an available (green) slot between 8:00 AM and 4:00 PM to start. Then select end time.{' '}
            {facility.minBookingSlots}-{facility.maxBookingSlots} slots per booking.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {allSlotStarts.map((start) => {
              const key = start.getTime();
              const isBooked = bookedSet.has(String(key));
              const myBooking = slotsData?.slots?.some(
                (s) => s.userId === userId && new Date(s.start).getTime() === start.getTime()
              );
              const isWithinHours = start >= dayStart && start < bookingEnd;
              const handleClick = () => {
                if (!isWithinHours) {
                  toast.error('Bookings are available between 8:00 AM and 4:00 PM');
                  return;
                }
                if (isBooked) return;
                const slotEnd = addMinutes(start, slotMinutes * facility.minBookingSlots);
                handleSelectSlot({ start, end: slotEnd });
              };
              return (
                <button
                  key={key}
                  type="button"
                  onClick={handleClick}
                  disabled={isBooked}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm transition',
                    !isWithinHours && 'cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50',
                    isWithinHours && myBooking && 'border-blue-500 bg-blue-500/20 text-blue-400',
                    isWithinHours &&
                      isBooked &&
                      !myBooking &&
                      'cursor-not-allowed border-red-500/50 bg-red-500/15 text-red-400',
                    isWithinHours &&
                      !isBooked &&
                      'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                  )}
                >
                  {format(start, 'HH:mm')}
                  {myBooking && ' (Yours)'}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">Available (08:00–16:00)</span>
        <span className="rounded bg-red-100 px-2 py-1 text-red-800">Booked</span>
        <span className="rounded bg-blue-100 px-2 py-1 text-blue-800">Your booking</span>
        <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">Outside hours</span>
      </div>

      <AnimatePresence>
        {selectedSlot && (
          <>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity duration-300"
              onClick={(e) => { if (e.target === e.currentTarget) { setSelectedSlot(null); form.reset(); } }}
              aria-hidden
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg"
              >
                <Card className="max-h-[85vh] overflow-hidden border-border/50 bg-[#120a1e] shadow-2xl backdrop-blur-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-fast-primary/5 to-transparent pointer-events-none" />
                  
                  <CardHeader className="relative flex flex-row items-center justify-between border-b border-white/5 pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold tracking-tight text-white">Complete Booking</CardTitle>
                      <p className="text-xs text-[#7a6a9a]">Double check your slot and details below.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full hover:bg-white/10"
                      onClick={() => { setSelectedSlot(null); form.reset(); }}
                    >
                      <X className="h-5 w-5 text-white/50" />
                    </Button>
                  </CardHeader>

                  <CardContent className="overflow-y-auto px-6 py-6 custom-scrollbar" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                    <div className="mb-6 rounded-2xl bg-white/[0.03] p-4 border border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest text-[#7a6a9a]">Selected Slot</span>
                          <p className="text-sm font-bold text-fast-primary">
                             {format(selectedSlot.start, 'MMM d, yyyy')}
                          </p>
                          <p className="text-xl font-black text-white">
                            {format(selectedSlot.start, 'HH:mm')} – {format(selectedSlot.end, 'HH:mm')}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-fast-primary/20 flex items-center justify-center text-fast-primary">
                          <Clock4 className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-[11px] uppercase tracking-wider text-[#7a6a9a]">Duration</Label>
                          <select
                            className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm text-white focus:border-fast-primary/50 focus:ring-1 focus:ring-fast-primary/30"
                            value={slotCount}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (!selectedSlot || !facility) return;
                              setSelectedSlot({
                                ...selectedSlot,
                                end: addMinutes(selectedSlot.start, facility.slotDurationMinutes * n),
                              });
                            }}
                          >
                            {Array.from(
                              { length: facility.maxBookingSlots - facility.minBookingSlots + 1 },
                              (_, i) => facility.minBookingSlots + i
                            ).map((n) => (
                              <option key={n} value={n} className="bg-[#120a1e]">
                                {n} slot(s) ({n * facility.slotDurationMinutes} min)
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[11px] uppercase tracking-wider text-[#7a6a9a]">Participants</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="e.g. 4"
                            className="h-11 rounded-xl border-white/10 bg-white/[0.02] text-white focus:border-fast-primary/50 focus:ring-1 focus:ring-fast-primary/30"
                            {...form.register('participantCount', { valueAsNumber: true })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] uppercase tracking-wider text-[#7a6a9a]">Purpose of Booking</Label>
                        <Input 
                          {...form.register('purpose')} 
                          placeholder="Match, practice, training..." 
                          className="h-11 rounded-xl border-white/10 bg-white/[0.02] text-white focus:border-fast-primary/50 focus:ring-1 focus:ring-fast-primary/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] uppercase tracking-wider text-[#7a6a9a]">Special Requirements (Optional)</Label>
                        <textarea
                          {...form.register('specialRequirements')}
                          placeholder="Need extra balls, nets, or specific setup..."
                          className="w-full min-h-[80px] rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white focus:border-fast-primary/50 focus:ring-1 focus:ring-fast-primary/30 outline-none transition-all"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          disabled={creating} 
                          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-fast-primary to-fast-accent text-sm font-bold uppercase tracking-wider text-white shadow-xl transition-all duration-300 hover:brightness-110 active:scale-95"
                        >
                          {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Selection'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-12 rounded-xl border border-white/5 bg-white/5 px-6 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10"
                          onClick={() => { setSelectedSlot(null); form.reset(); }}
                        >
                          Discard
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
