import { useMemo, useState } from 'react';
import { DateRange, type RangeKeyDict } from 'react-date-range';
import { addDays, endOfDay, format, startOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  useGetFacilityUtilizationQuery,
  useGetRevenueAnalyticsQuery,
  useGetUserEngagementQuery,
  useGetEquipmentAnalyticsQuery,
  useGetBookingTrendsQuery,
} from '@/store/api/analyticsApi';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

type ReportType = 'Usage' | 'Revenue' | 'User' | 'Equipment' | 'Bookings';

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  const headers = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>())
  );
  const esc = (v: unknown) => {
    const str = v == null ? '' : String(v);
    const needs = /[",\n]/.test(str);
    const safe = str.replace(/"/g, '""');
    return needs ? `"${safe}"` : safe;
  };
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(',')),
  ];
  return lines.join('\n');
}

export function AnalyticsReports() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'Admin';

  const [type, setType] = useState<ReportType>('Usage');
  const [range, setRange] = useState(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(addDays(end, -29));
    return [{ startDate: start, endDate: end, key: 'selection' as const }];
  });
  const from = range[0].startDate!.toISOString();
  const to = range[0].endDate!.toISOString();

  const usage = useGetFacilityUtilizationQuery({ from, to }, { skip: !isAdmin || type !== 'Usage' });
  const revenue = useGetRevenueAnalyticsQuery({ from, to }, { skip: !isAdmin || type !== 'Revenue' });
  const engagement = useGetUserEngagementQuery({ from, to }, { skip: !isAdmin || type !== 'User' });
  const equipment = useGetEquipmentAnalyticsQuery({ from, to }, { skip: !isAdmin || type !== 'Equipment' });
  const bookings = useGetBookingTrendsQuery({ from, to, granularity: 'day' }, { skip: !isAdmin || type !== 'Bookings' });

  const rows: Array<Record<string, unknown>> = useMemo(() => {
    if (type === 'Usage') {
      return (usage.data?.facilities ?? []).map((r) => ({
        facilityName: r.facilityName,
        category: r.category,
        bookedMinutes: r.bookedMinutes,
        utilizationRatePercent: r.utilizationRate,
        underUtilized: r.underUtilized,
      }));
    }
    if (type === 'Revenue') {
      const t = revenue.data?.totals;
      if (!t) return [];
      return [
        { metric: 'Total revenue', value: t.totalRevenue },
        { metric: 'Bookings revenue', value: t.bookingRevenue },
        { metric: 'Tournament revenue', value: t.tournamentRevenue },
        { metric: 'Coaching revenue', value: t.coachingRevenue },
        { metric: 'Equipment revenue', value: t.equipmentRevenue },
        { metric: 'Events revenue', value: t.eventRevenue },
        { metric: 'Refunds', value: t.refunds },
        { metric: 'Forecast next 7 days', value: t.forecastNext7Days },
      ];
    }
    if (type === 'User') {
      const e = engagement.data;
      if (!e) return [];
      return [
        { metric: 'New users', value: e.newUsers },
        { metric: 'Returning users', value: e.returningUsers },
        ...e.mostActiveUsers.map((u) => ({
          user: `${u.name} (${u.fastId})`,
          role: u.role,
          bookings: u.bookings,
        })),
      ];
    }
    if (type === 'Equipment') {
      const e = equipment.data;
      if (!e) return [];
      return [
        { metric: 'Maintenance tasks (created)', value: e.maintenanceCount },
        ...e.mostCheckedOut.map((i) => ({
          item: i.name,
          category: i.category,
          checkouts: i.checkouts,
          avgDurationMinutes: i.avgDurationMinutes,
          damageRatePercent: i.damageRate,
        })),
      ];
    }
    // Bookings
    return (bookings.data?.series ?? []).map((s) => ({
      period: s.period,
      totalBookings: s.total,
      cancelled: s.cancelled,
      cancellationRatePercent: s.cancellationRate,
    }));
  }, [type, usage.data, revenue.data, engagement.data, equipment.data, bookings.data]);

  const isLoading =
    (type === 'Usage' && usage.isLoading) ||
    (type === 'Revenue' && revenue.isLoading) ||
    (type === 'User' && engagement.isLoading) ||
    (type === 'Equipment' && equipment.isLoading) ||
    (type === 'Bookings' && bookings.isLoading);

  if (!isAdmin) {
    return (
      <Card className="border-border/50 bg-card shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">Admin access required.</CardContent>
      </Card>
    );
  }

  const labelRange = `${format(range[0].startDate!, 'yyyy-MM-dd')}_to_${format(range[0].endDate!, 'yyyy-MM-dd')}`;
  const baseName = `FSCM_${type}_Report_${labelRange}`;

  const exportCsv = () => {
    const csv = toCsv(rows);
    downloadBlob(csv, `${baseName}.csv`, 'text/csv;charset=utf-8');
  };
  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  };
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`${type} Report`, 14, 14);
    doc.setFontSize(10);
    doc.text(`${format(range[0].startDate!, 'PP')} – ${format(range[0].endDate!, 'PP')}`, 14, 20);
    const headers = rows.length ? Object.keys(rows[0]) : [];
    autoTable(doc, {
      head: [headers],
      body: rows.map((r) => headers.map((h) => String(r[h] ?? ''))),
      startY: 24,
      styles: { fontSize: 8 },
    });
    doc.save(`${baseName}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and export analytics reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length || isLoading}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportXlsx} disabled={!rows.length || isLoading}>
            Export Excel
          </Button>
          <Button onClick={exportPdf} disabled={!rows.length || isLoading}>
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Report type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="Usage">Facility usage</option>
              <option value="Revenue">Revenue</option>
              <option value="Bookings">Booking trends</option>
              <option value="User">User engagement</option>
              <option value="Equipment">Equipment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date range</label>
            <DateRange
              ranges={range}
              onChange={(item: RangeKeyDict) => setRange([item.selection as any])}
              moveRangeOnFirstSelection={false}
              months={1}
              direction="horizontal"
              rangeColors={['#2563eb']}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : rows.length ? (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(rows[0]).map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      {Object.keys(rows[0]).map((h) => (
                        <td key={h} className="px-2 py-2 text-muted-foreground">
                          {String(r[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <p className="mt-2 text-xs text-muted-foreground">Showing first 50 rows…</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data for this range.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

