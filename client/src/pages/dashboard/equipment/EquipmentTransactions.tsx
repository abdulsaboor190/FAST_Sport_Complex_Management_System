import { Link } from 'react-router-dom';
import { useGetMyTransactionsQuery } from '@/store/api/equipmentApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Package, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function EquipmentTransactions() {
  const { data: transactions, isLoading } = useGetMyTransactionsQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/equipment">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My equipment</h1>
          <p className="text-muted-foreground">Check-outs and return history</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="border-border/50 bg-card shadow-sm">
          <CardContent className="pt-6">
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : !transactions?.length ? (
        <Card className="border-border/50 bg-card shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No check-outs yet.</p>
            <Link to="/dashboard/equipment" className="mt-4 inline-block">
              <Button>Browse equipment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id} className="border-border/50 bg-card shadow-sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fast-primary/10">
                    <Package className="h-5 w-5 text-fast-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{tx.equipment?.name ?? 'Equipment'}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.type} · {tx.equipment?.category?.name ?? ''}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(tx.createdAt), 'PPp')}
                      {tx.plannedReturnAt && tx.type === 'CheckOut' && !tx.returnedAt && (
                        <> · Return by {format(new Date(tx.plannedReturnAt), 'PP')}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={tx.type === 'CheckOut' && !tx.returnedAt ? 'default' : 'secondary'}
                    className={tx.type === 'CheckOut' && !tx.returnedAt ? 'bg-amber-500/90' : ''}
                  >
                    {tx.type === 'CheckOut' && !tx.returnedAt ? 'Out' : tx.type}
                  </Badge>
                  {tx.equipment?.id && (
                    <Link to={`/dashboard/equipment/${tx.equipment.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
