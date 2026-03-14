import { useEffect, useMemo, useState } from 'react';
import { GridLayout, type Layout } from 'react-grid-layout';
import ReactECharts from 'echarts-for-react';
import { DateRange, type RangeKeyDict } from 'react-date-range';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';
import { useAppSelector } from '@/store/hooks';
import {
  useGetOverviewQuery,
  useGetFacilityUtilizationQuery,
  useGetBookingTrendsQuery,
  useGetPopularSportsQuery,
  useGetPeakHeatmapQuery,
  useGetRevenueAnalyticsQuery,
  useGetEquipmentAnalyticsQuery,
} from '@/store/api/analyticsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const LS_KEY = 'fscm.analytics.layout.v1';

function defaultLayout(): Layout {
  return [
    { i: 'overview', x: 0, y: 0, w: 12, h: 2 },
    { i: 'bookingTrends', x: 0, y: 2, w: 8, h: 5 },
    { i: 'popularSports', x: 8, y: 2, w: 4, h: 5 },
    { i: 'utilization', x: 0, y: 7, w: 6, h: 5 },
    { i: 'revenue', x: 6, y: 7, w: 6, h: 5 },
    { i: 'heatmap', x: 0, y: 12, w: 8, h: 6 },
    { i: 'equipment', x: 8, y: 12, w: 4, h: 6 },
  ];
}

function loadLayout(): Layout {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultLayout();
    const parsed = JSON.parse(raw) as Layout;
    return Array.isArray(parsed) ? parsed : defaultLayout();
  } catch {
    return defaultLayout();
  }
}

export function AnalyticsDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'Admin';

  const [range, setRange] = useState(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(addDays(end, -29));
    return [{ startDate: start, endDate: end, key: 'selection' as const }];
  });
  const from = range[0].startDate!.toISOString();
  const to = range[0].endDate!.toISOString();

  const [layout, setLayout] = useState<Layout>(() => (typeof window !== 'undefined' ? loadLayout() : defaultLayout()));
  const [gridWidth, setGridWidth] = useState(() => (typeof window !== 'undefined' ? Math.max(320, window.innerWidth - 340) : 1200));

  useEffect(() => {
    const onResize = () => setGridWidth(Math.max(320, window.innerWidth - 340));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { data: overview, isLoading: overviewLoading } = useGetOverviewQuery(undefined, { skip: !isAdmin });
  const { data: trends, isLoading: trendsLoading } = useGetBookingTrendsQuery({ from, to, granularity: 'day' }, { skip: !isAdmin });
  const { data: sports, isLoading: sportsLoading } = useGetPopularSportsQuery({ from, to }, { skip: !isAdmin });
  const { data: util, isLoading: utilLoading } = useGetFacilityUtilizationQuery({ from, to }, { skip: !isAdmin });
  const { data: heatmap, isLoading: heatmapLoading } = useGetPeakHeatmapQuery({ from, to }, { skip: !isAdmin });
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueAnalyticsQuery({ from, to }, { skip: !isAdmin });
  const { data: equipment, isLoading: equipmentLoading } = useGetEquipmentAnalyticsQuery({ from, to }, { skip: !isAdmin });

  const bookingTrendOption = useMemo(() => {
    const series = trends?.series ?? [];
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: series.map((s) => s.period) },
      yAxis: { type: 'value' },
      series: [
        { name: 'Bookings', type: 'line', smooth: true, data: series.map((s) => s.total) },
        { name: 'Cancelled', type: 'line', smooth: true, data: series.map((s) => s.cancelled) },
      ],
    };
  }, [trends]);

  const popularSportsOption = useMemo(() => {
    const data = sports?.data ?? [];
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          labelLine: { show: false },
          data: data.map((d) => ({ name: d.sport, value: d.count })),
        },
      ],
    };
  }, [sports]);

  const utilizationOption = useMemo(() => {
    const rows = util?.facilities ?? [];
    const sorted = [...rows].sort((a, b) => b.utilizationRate - a.utilizationRate).slice(0, 10);
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 140, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
      yAxis: { type: 'category', data: sorted.map((r) => r.facilityName).reverse() },
      series: [
        {
          type: 'bar',
          data: sorted.map((r) => r.utilizationRate).reverse(),
        },
      ],
    };
  }, [util]);

  const revenueOption = useMemo(() => {
    const t = revenue?.totals;
    if (!t) return {};
    const items = [
      { name: 'Bookings', value: t.bookingRevenue },
      { name: 'Tournaments', value: t.tournamentRevenue },
      { name: 'Coaching', value: t.coachingRevenue },
      { name: 'Equipment', value: t.equipmentRevenue },
      { name: 'Events', value: t.eventRevenue },
    ];
    return {
      tooltip: { trigger: 'item' },
      xAxis: { type: 'category', data: items.map((i) => i.name) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: items.map((i) => i.value) }],
    };
  }, [revenue]);

  const heatmapOption = useMemo(() => {
    const matrix = heatmap?.matrix ?? Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data: Array<[number, number, number]> = [];
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) data.push([h, d, matrix[d][h]]);
    return {
      tooltip: { position: 'top' },
      grid: { height: '70%', top: '10%' },
      xAxis: { type: 'category', data: hours, splitArea: { show: true } },
      yAxis: { type: 'category', data: days, splitArea: { show: true } },
      visualMap: {
        min: 0,
        max: Math.max(...data.map((d) => d[2]), 1),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
      },
      series: [
        {
          name: 'Bookings',
          type: 'heatmap',
          data,
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
        },
      ],
    };
  }, [heatmap]);

  if (!isAdmin) {
    return (
      <Card className="border-border/50 bg-card shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">Admin access required.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Facility usage, revenue, engagement, and equipment insights</p>
        </div>
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Date range</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DateRange
              ranges={range}
              onChange={(item: RangeKeyDict) => setRange([item.selection as any])}
              showSelectionPreview
              moveRangeOnFirstSelection={false}
              months={1}
              direction="horizontal"
              rangeColors={['#2563eb']}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {format(range[0].startDate!, 'PP')} – {format(range[0].endDate!, 'PP')}
            </p>
          </CardContent>
        </Card>
      </div>

      <GridLayout
        className="layout"
        layout={layout}
        width={gridWidth}
        gridConfig={{ cols: 12, rowHeight: 70, margin: [12, 12], containerPadding: null, maxRows: Infinity }}
        dragConfig={{ enabled: true, handle: '.widget-drag', threshold: 3 }}
        resizeConfig={{ enabled: true, handles: ['se'] }}
        onLayoutChange={(l) => {
          setLayout(l);
          localStorage.setItem(LS_KEY, JSON.stringify(l));
        }}
      >
        <div key="overview">
          <Widget title="Overview">
            {overviewLoading || !overview ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Bookings today" value={overview.bookings.today} />
                <Stat label="Bookings (week)" value={overview.bookings.week} />
                <Stat label="Active users (month)" value={overview.activeUsers} />
                <Stat label="Revenue today" value={`Rs ${overview.revenueToday}`} />
              </div>
            )}
          </Widget>
        </div>

        <div key="bookingTrends">
          <Widget title="Booking trends">
            {trendsLoading ? <Skeleton className="h-[300px] w-full" /> : <ReactECharts option={bookingTrendOption} style={{ height: 320 }} />}
          </Widget>
        </div>

        <div key="popularSports">
          <Widget title="Popular sports">
            {sportsLoading ? <Skeleton className="h-[300px] w-full" /> : <ReactECharts option={popularSportsOption} style={{ height: 320 }} />}
          </Widget>
        </div>

        <div key="utilization">
          <Widget title="Facility utilization (top 10)">
            {utilLoading ? <Skeleton className="h-[300px] w-full" /> : <ReactECharts option={utilizationOption} style={{ height: 320 }} />}
          </Widget>
        </div>

        <div key="revenue">
          <Widget title="Revenue breakdown">
            {revenueLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="Total revenue" value={`Rs ${revenue?.totals.totalRevenue ?? 0}`} />
                  <Stat label="Forecast (next 7d)" value={`Rs ${revenue?.totals.forecastNext7Days ?? 0}`} />
                </div>
                <ReactECharts option={revenueOption} style={{ height: 230 }} />
              </div>
            )}
          </Widget>
        </div>

        <div key="heatmap">
          <Widget title="Peak hours heatmap (bookings)">
            {heatmapLoading ? <Skeleton className="h-[360px] w-full" /> : <ReactECharts option={heatmapOption} style={{ height: 380 }} />}
          </Widget>
        </div>

        <div key="equipment">
          <Widget title="Equipment highlights">
            {equipmentLoading ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <div className="space-y-3">
                <Stat label="Maintenance tasks" value={equipment?.maintenanceCount ?? 0} />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Most checked-out</p>
                  <ul className="space-y-2">
                    {(equipment?.mostCheckedOut ?? []).slice(0, 6).map((i) => (
                      <li key={i.equipmentId} className="flex items-center justify-between rounded border border-border/60 px-3 py-2 text-sm">
                        <span className="truncate">{i.name}</span>
                        <span className="text-muted-foreground">{i.checkouts}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Widget>
        </div>
      </GridLayout>
    </div>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="h-full border-border/50 bg-card shadow-sm">
      <CardHeader className="py-3">
        <CardTitle className="widget-drag cursor-move text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={cn('rounded-lg border border-border/50 bg-card px-3 py-2 shadow-sm')}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

