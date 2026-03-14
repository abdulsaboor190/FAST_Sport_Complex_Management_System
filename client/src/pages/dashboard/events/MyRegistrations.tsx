import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useGetMyRegistrationsQuery } from '@/store/api/eventsApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CalendarDays, ArrowLeft } from 'lucide-react';

export function MyRegistrations() {
  const { data: registrations, isLoading } = useGetMyRegistrationsQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My event registrations</h1>
          <p className="text-muted-foreground">Events you have registered for</p>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
      ) : registrations?.length ? (
        <div className="space-y-3">
          {registrations.map((r) => {
            const start = new Date(r.event!.startTime);
            return (
              <Card key={r.id} className="border-border/50 bg-card shadow-sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{r.event?.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      {format(start, 'PPp')}
                    </p>
                  </div>
                  <Link to={`/dashboard/events/${r.eventId}`}>
                    <Button variant="outline" size="sm">View event</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No registrations yet.</p>
            <Link to="/dashboard/events" className="mt-4">
              <Button>Browse events</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
