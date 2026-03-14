import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Trophy } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useGetTournamentQuery } from '@/store/api/tournamentApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function TournamentDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
    const { data: tournament, isLoading } = useGetTournamentQuery(id!, { skip: !id });

    if (!id) return null;

    if (isLoading || !tournament) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const handleRegister = () => {
        const target = `/dashboard/tournaments/${id}/register`;
        if (!isAuthenticated) {
            navigate(`/login?returnUrl=${encodeURIComponent(target)}`);
        } else {
            navigate(target);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/tournaments')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-fast-primary" />
                            {tournament.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">{tournament.sport}</p>
                    </div>
                </div>
                <Button onClick={handleRegister}>Register team</Button>
            </div>
            <div className="rounded-lg border border-border/50 bg-card p-6 text-sm text-muted-foreground shadow-sm">
                Brackets, teams, and match schedule will appear here. Registration and participation actions require
                login.
            </div>
        </div>
    );
}
