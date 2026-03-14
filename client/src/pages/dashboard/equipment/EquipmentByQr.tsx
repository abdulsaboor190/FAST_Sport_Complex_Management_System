import { useParams, Link } from 'react-router-dom';
import { useGetEquipmentByQrQuery } from '@/store/api/equipmentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Package, ArrowRight } from 'lucide-react';

export function EquipmentByQr() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const decodedQr = qrCode ? decodeURIComponent(qrCode) : '';
  const { data: item, isLoading, error } = useGetEquipmentByQrQuery(decodedQr, { skip: !decodedQr });

  if (!decodedQr) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No QR code provided.</p>
        <Link to="/dashboard/equipment/scan">
          <Button>Scan again</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card shadow-sm">
        <CardContent className="pt-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Equipment not found for this QR code.</p>
        <Link to="/dashboard/equipment/scan">
          <Button>Scan again</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Scanned equipment</h1>
      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            {item.name}
          </CardTitle>
          <Badge
            className={
              item.status === 'Available'
                ? 'bg-emerald-500/90'
                : item.status === 'CheckedOut'
                  ? 'bg-amber-500/90'
                  : 'bg-slate-500/90'
            }
          >
            {item.status.replace(/([A-Z])/g, ' $1').trim()}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{item.category?.name}</p>
          <Link to={`/dashboard/equipment/${item.id}`}>
            <Button className="w-full gap-2">
              View details & {item.status === 'Available' ? 'check out' : 'check in'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
