import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ReactStars from 'react-rating-stars-component';
import {
  useGetMySessionsQuery,
  useCancelSessionMutation,
  useUpdateSessionStatusMutation,
  useSubmitReviewMutation,
} from '@/store/api/coachApi';
import type { CoachSession } from '@/store/api/coachApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store/hooks';
import { ArrowLeft, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function MySessions() {
  const user = useAppSelector((state) => state.auth.user);
  const isCoach = user?.role === 'Coach';
  const isAdmin = user?.role === 'Admin';
  const { data: sessions, isLoading } = useGetMySessionsQuery();
  const [cancelSession] = useCancelSessionMutation();
  const [updateStatus] = useUpdateSessionStatusMutation();
  const [submitReview] = useSubmitReviewMutation();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleCancel = async (id: string) => {
    try {
      await cancelSession(id).unwrap();
      toast.success('Session cancelled');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed to cancel');
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await updateStatus({ id, status: 'Completed' }).unwrap();
      toast.success('Marked complete');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleSubmitReview = async (sessionId: string) => {
    try {
      await submitReview({ sessionId, rating: reviewRating, review: reviewText || undefined }).unwrap();
      toast.success('Review submitted');
      setReviewingId(null);
      setReviewText('');
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const upcoming = sessions?.filter((s) => s.status === 'Scheduled' && new Date(s.startTime) >= new Date()) ?? [];
  const past = sessions?.filter((s) => s.status !== 'Scheduled' || new Date(s.startTime) < new Date()) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/coaches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My sessions</h1>
          <p className="text-muted-foreground">Upcoming and past coach sessions</p>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Upcoming</h2>
              {upcoming.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onCancel={() => handleCancel(s.id)}
                  onMarkComplete={isCoach || isAdmin ? () => handleMarkComplete(s.id) : undefined}
                />
              ))}
            </div>
          )}
          <div className="space-y-3">
            <h2 className="font-semibold">Past</h2>
            {past.length ? (
              past.map((s) => (
                <div key={s.id}>
                  <SessionCard session={s} />
                  {s.status === 'Completed' && !s.review && s.student && user?.id && (
                    <Card className="mt-2 border-border/60">
                      <CardContent className="pt-4">
                        {reviewingId !== s.id ? (
                          <Button variant="outline" size="sm" onClick={() => setReviewingId(s.id)}>
                            Write a review
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-1">
                              <ReactStars count={5} value={reviewRating} onChange={(v: number) => setReviewRating(v)} size={24} />
                            </div>
                            <textarea
                              placeholder="Your review (optional)"
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              className="w-full rounded border border-input px-3 py-2 text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSubmitReview(s.id)}>Submit</Button>
                              <Button size="sm" variant="ghost" onClick={() => setReviewingId(null)}>Cancel</Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SessionCard({
  session,
  onCancel,
  onMarkComplete,
}: {
  session: CoachSession;
  onCancel?: () => void;
  onMarkComplete?: () => void;
}) {
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);
  const isPast = end < new Date();

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={session.coach?.user?.avatarUrl ?? undefined} />
            <AvatarFallback>{session.coach?.user?.name?.slice(0, 2).toUpperCase() ?? 'C'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{session.coach?.user?.name ?? 'Coach'}</p>
            <p className="text-sm text-muted-foreground">
              {session.sessionType} · {format(start, 'PPp')} – {format(end, 'HH:mm')}
            </p>
            <p className="text-xs text-muted-foreground">₹{Number(session.amount).toFixed(0)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{session.status}</span>
          {session.status === 'Scheduled' && !isPast && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}
          {session.status === 'Scheduled' && !isPast && onMarkComplete && (
            <Button variant="default" size="sm" onClick={onMarkComplete}>
              <CheckCircle className="h-4 w-4 mr-1" /> Mark complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
