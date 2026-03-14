import { useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ReactStars from 'react-rating-stars-component';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  BookOpen,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useGetCoachQuery,
  useGetCoachSlotsQuery,
  useBookSessionMutation,
} from '@/store/api/coachApi';
import type { CoachSessionType } from '@/store/api/coachApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';

const SESSION_TYPES: { value: CoachSessionType; label: string }[] = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Group', label: 'Group' },
  { value: 'Team', label: 'Team' },
];

export function CoachDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = !!user;
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [sessionType, setSessionType] = useState<CoachSessionType>('Individual');
  const [notes, setNotes] = useState('');

  const { data: coach, isLoading } = useGetCoachQuery(id!, { skip: !id });
  const { data: slotsData } = useGetCoachSlotsQuery(
    { coachId: id!, date: selectedDate },
    { skip: !id || !selectedDate }
  );
  const [bookSession, { isLoading: booking }] = useBookSessionMutation();

  const onBook = async () => {
    if (!selectedSlot || !id) return;
    try {
      await bookSession({
        coachId: id,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        sessionType,
        specialRequirements: notes || undefined,
      }).unwrap();
      toast.success('Session booked');
      setSelectedSlot(null);
      setNotes('');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Booking failed');
    }
  };

  if (!id) return null;
  if (isLoading || !coach) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const available = slotsData?.slots ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/coaches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{coach.user.name}</h1>
          {coach.specializations?.length ? (
            <p className="text-muted-foreground">{coach.specializations.join(' · ')}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={coach.user.avatarUrl ?? undefined} alt={coach.user.name} />
                  <AvatarFallback className="bg-fast-primary/20 text-2xl text-fast-primary">
                    {coach.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-2 font-medium">{coach.user.name}</p>
                {coach.avgRating != null && (
                  <div className="mt-1 flex items-center gap-1">
                    <ReactStars count={5} value={coach.avgRating} size={18} edit={false} isHalf />
                    <span className="text-sm text-muted-foreground">({coach.reviewCount})</span>
                  </div>
                )}
                <p className="mt-2 flex items-center gap-1 text-lg font-semibold text-fast-primary">
                  <DollarSign className="h-5 w-5" />
                  {Number(coach.hourlyRate)}/hr
                </p>
              </div>
            </CardContent>
          </Card>
          {coach.bio && (
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Bio
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{coach.bio}</p>
              </CardContent>
            </Card>
          )}
          {(coach.qualifications || coach.experience) && (
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 text-sm">
                {coach.qualifications && (
                  <p><span className="font-medium">Qualifications:</span> {coach.qualifications}</p>
                )}
                {coach.experience && (
                  <p><span className="font-medium">Experience:</span> {coach.experience}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book a session
              </CardTitle>
              <p className="text-sm text-muted-foreground">Select a date, then choose an available slot.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Available slots (30 min)</label>
                <div className="flex flex-wrap gap-2">
                  {available.length ? (
                    available.map((slot) => {
                      const start = new Date(slot.start);
                      const isSelected = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelectedSlot(isSelected ? null : slot)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm transition-colors',
                            isSelected
                              ? 'border-fast-primary bg-fast-primary/15 text-fast-primary'
                              : 'border-input hover:bg-muted/50'
                          )}
                        >
                          {format(start, 'HH:mm')}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No slots available this day.</p>
                  )}
                </div>
              </div>
              {selectedSlot && isAuthenticated && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Session type</label>
                    <div className="flex gap-2">
                      {SESSION_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setSessionType(t.value)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm',
                            sessionType === t.value
                              ? 'border-fast-primary bg-fast-primary/15 text-fast-primary'
                              : 'border-input hover:bg-muted/50'
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special requirements..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      rows={2}
                    />
                  </div>
                  <Button onClick={onBook} disabled={booking} className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Confirm booking
                  </Button>
                </>
              )}
              {selectedSlot && !isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`)
                  }
                >
                  Log in to book session
                </Button>
              )}
            </CardContent>
          </Card>

          {coach.sessions?.filter((s) => s.review).length ? (
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {coach.sessions
                  .filter((s) => s.review)
                  .slice(0, 5)
                  .map((s) => {
                    const r = s.review;
                    if (!r) return null;
                    return (
                      <div key={s.id} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center gap-2">
                          <ReactStars count={5} value={r.rating} size={14} edit={false} />
                          <span className="text-xs text-muted-foreground">{r.user?.name}</span>
                        </div>
                        {r.review && (
                          <p className="mt-1 text-sm text-muted-foreground">{r.review}</p>
                        )}
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
