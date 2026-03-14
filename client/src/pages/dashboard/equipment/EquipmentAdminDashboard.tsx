import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useGetEquipmentStatsQuery } from '@/store/api/equipmentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, Package, Wrench, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useAppSelector } from '@/store/hooks';

const STATUS_COLORS = ['#10b981', '#f59e0b', '#64748b'];

export function EquipmentAdminDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'Admin';
  const { data: stats, isLoading } = useGetEquipmentStatsQuery(undefined, { skip: !isAdmin });

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Admin access required.</p>
        <Link to="/dashboard/equipment">
          <Button variant="outline">Back to equipment</Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const byCategoryData = stats.byCategory.map((c) => ({ name: c.categoryName || c.categoryId, count: c.count }));
  const byStatusData = stats.byStatus.map((s, i) => ({
    name: s.status.replace(/([A-Z])/g, ' $1').trim(),
    count: s.count,
    fill: STATUS_COLORS[i % STATUS_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/equipment">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipment admin</h1>
            <p className="text-muted-foreground">Inventory stats, maintenance due, low stock</p>
          </div>
        </div>
        <Link to="/dashboard/equipment/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add equipment
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total equipment</CardTitle>
            <Package className="h-5 w-5 text-fast-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalEquipment}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance due</CardTitle>
            <Wrench className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.maintenanceDue?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low stock items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.lowStock?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent check-outs</CardTitle>
            <TrendingUp className="h-5 w-5 text-fast-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.recentCheckouts?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">By category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategoryData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCategoryData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--fast-primary)" name="Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">By status</CardTitle>
          </CardHeader>
          <CardContent>
            {byStatusData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={byStatusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {byStatusData.map((_, i) => (
                      <Cell key={i} fill={byStatusData[i].fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Maintenance due</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.maintenanceDue?.length ? (
              <ul className="space-y-2">
                {stats.maintenanceDue.slice(0, 10).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span>{t.equipment?.name}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(t.scheduledFor), 'PP')}
                    </span>
                    <Link to={`/dashboard/equipment/maintenance`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No maintenance due.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Low stock</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStock?.length ? (
              <ul className="space-y-2">
                {stats.lowStock.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm dark:border-amber-900/50 dark:bg-amber-950/20"
                  >
                    <span>{item.name}</span>
                    <Badge variant="secondary">{item.quantity} left</Badge>
                    <Link to={`/dashboard/equipment/${item.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">All stock levels OK.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
