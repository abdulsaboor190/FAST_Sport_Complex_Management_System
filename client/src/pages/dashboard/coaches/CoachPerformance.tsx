import { Link } from 'react-router-dom';
import { useGetCoachPerformanceQuery } from '@/store/api/coachApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store/hooks';
import { ArrowLeft, TrendingUp, DollarSign, Star } from 'lucide-react';

export function CoachPerformance() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'Admin';
  const { data: stats, isLoading } = useGetCoachPerformanceQuery(undefined, { skip: !isAdmin });

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Admin access required.</p>
        <Link to="/dashboard/coaches"><Button variant="outline">Back to coaches</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/coaches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coach performance</h1>
          <p className="text-muted-foreground">Sessions, ratings, and revenue by coach</p>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
      ) : stats?.length ? (
        <div className="space-y-4">
          {stats.map((s) => (
            <Card key={s.coachId} className="border-border/50 bg-card shadow-sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{s.coachName}</p>
                  <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {s.totalSessions} sessions
                    </span>
                    {s.avgRating != null && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-500" />
                        {s.avgRating.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Rs {s.revenue.toFixed(0)} revenue
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No coach data yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
