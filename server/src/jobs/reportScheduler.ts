import { prisma } from '../lib/prisma.js';
import { sendAdminReportEmail } from '../lib/email.js';
import { endOfDay, startOfDay, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns';

function scheduleNextLocal(
  hour: number,
  minute: number,
  cb: () => Promise<void>,
  name: string
) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();
  setTimeout(async () => {
    try {
      await cb();
    } catch (err) {
      console.error(`[reports] ${name} failed:`, err);
    } finally {
      scheduleNextLocal(hour, minute, cb, name);
    }
  }, delay);
}

function scheduleWeeklyLocal(
  weekday: number, // 0 Sun ... 6 Sat
  hour: number,
  minute: number,
  cb: () => Promise<void>,
  name: string
) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  const delta = (weekday - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + delta);
  if (next <= now) next.setDate(next.getDate() + 7);

  const delay = next.getTime() - now.getTime();
  setTimeout(async () => {
    try {
      await cb();
    } catch (err) {
      console.error(`[reports] ${name} failed:`, err);
    } finally {
      scheduleWeeklyLocal(weekday, hour, minute, cb, name);
    }
  }, delay);
}

function scheduleMonthlyLocal(
  dayOfMonth: number, // 1..28 recommended
  hour: number,
  minute: number,
  cb: () => Promise<void>,
  name: string
) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  next.setDate(dayOfMonth);
  if (next <= now) {
    next.setMonth(next.getMonth() + 1);
    next.setDate(dayOfMonth);
  }
  const delay = next.getTime() - now.getTime();
  setTimeout(async () => {
    try {
      await cb();
    } catch (err) {
      console.error(`[reports] ${name} failed:`, err);
    } finally {
      scheduleMonthlyLocal(dayOfMonth, hour, minute, cb, name);
    }
  }, delay);
}

async function buildDailySummaryHtml() {
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);

  const [bookings, revenueAgg, newUsers, equipmentCheckouts, coachSessions, eventsUpcoming] =
    await Promise.all([
      prisma.booking.count({ where: { startTime: { gte: from, lte: to } } }),
      prisma.booking.aggregate({
        where: { status: 'Confirmed', startTime: { gte: from, lte: to } },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.equipmentTransaction.count({ where: { type: 'CheckOut', createdAt: { gte: from, lte: to } } }),
      prisma.coachSession.count({ where: { startTime: { gte: from, lte: to } } }),
      prisma.event.count({ where: { status: 'Published', startTime: { gt: now } } }),
    ]);

  const revenue = Number(revenueAgg._sum.totalAmount ?? 0);

  return `
    <h2>FSCM Daily Summary</h2>
    <p><strong>Date:</strong> ${now.toLocaleDateString()}</p>
    <ul>
      <li><strong>Bookings today:</strong> ${bookings}</li>
      <li><strong>Revenue today:</strong> Rs ${Math.round(revenue)}</li>
      <li><strong>New users today:</strong> ${newUsers}</li>
      <li><strong>Equipment check-outs:</strong> ${equipmentCheckouts}</li>
      <li><strong>Coaching sessions:</strong> ${coachSessions}</li>
      <li><strong>Upcoming events:</strong> ${eventsUpcoming}</li>
    </ul>
  `;
}

async function buildWeeklyPerformanceHtml() {
  const now = new Date();
  const to = now;
  const from = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });

  const [bookingAgg, cancellations, topFacilities] = await Promise.all([
    prisma.booking.aggregate({
      where: { status: 'Confirmed', startTime: { gte: from, lte: to } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.booking.count({ where: { status: 'Cancelled', startTime: { gte: from, lte: to } } }),
    prisma.booking.groupBy({
      by: ['facilityId'],
      where: { startTime: { gte: from, lte: to } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const facilities = await prisma.facility.findMany({
    where: { id: { in: topFacilities.map((t) => t.facilityId) } },
    select: { id: true, name: true },
  });
  const fMap = new Map(facilities.map((f) => [f.id, f.name]));

  const revenue = Number(bookingAgg._sum.totalAmount ?? 0);

  return `
    <h2>FSCM Weekly Performance</h2>
    <p><strong>Period:</strong> ${from.toLocaleDateString()} – ${to.toLocaleDateString()}</p>
    <ul>
      <li><strong>Total bookings:</strong> ${bookingAgg._count.id}</li>
      <li><strong>Confirmed revenue:</strong> Rs ${Math.round(revenue)}</li>
      <li><strong>Cancellations:</strong> ${cancellations}</li>
    </ul>
    <h3>Top facilities</h3>
    <ol>
      ${topFacilities
        .map((t) => `<li>${fMap.get(t.facilityId) ?? t.facilityId}: ${t._count.id}</li>`)
        .join('')}
    </ol>
  `;
}

async function buildMonthlyFinancialHtml() {
  const now = new Date();
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const thisMonthStart = startOfMonth(now);

  const [revenueAgg, refundsAgg, equipmentFees, coachingAgg] = await Promise.all([
    prisma.booking.aggregate({
      where: { status: 'Confirmed', startTime: { gte: prevMonthStart, lt: thisMonthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.aggregate({
      where: { refundStatus: { in: ['Approved', 'Processed'] }, updatedAt: { gte: prevMonthStart, lt: thisMonthStart } },
      _sum: { refundAmount: true },
    }),
    prisma.equipmentTransaction.findMany({
      where: { createdAt: { gte: prevMonthStart, lt: thisMonthStart } },
      select: { lateFee: true, damageFee: true },
    }),
    prisma.coachSession.aggregate({
      where: { startTime: { gte: prevMonthStart, lt: thisMonthStart }, status: { in: ['Scheduled', 'Completed'] } },
      _sum: { amount: true },
    }),
  ]);

  const bookingsRevenue = Number(revenueAgg._sum.totalAmount ?? 0);
  const refunds = Number(refundsAgg._sum.refundAmount ?? 0);
  const equipmentRevenue = equipmentFees.reduce((s, t) => s + Number(t.lateFee ?? 0) + Number(t.damageFee ?? 0), 0);
  const coachingRevenue = Number(coachingAgg._sum.amount ?? 0);
  const total = bookingsRevenue + equipmentRevenue + coachingRevenue;

  return `
    <h2>FSCM Monthly Financial Report</h2>
    <p><strong>Period:</strong> ${prevMonthStart.toLocaleDateString()} – ${new Date(thisMonthStart.getTime() - 1).toLocaleDateString()}</p>
    <ul>
      <li><strong>Total revenue (selected streams):</strong> Rs ${Math.round(total)}</li>
      <li><strong>Bookings revenue:</strong> Rs ${Math.round(bookingsRevenue)}</li>
      <li><strong>Coaching revenue:</strong> Rs ${Math.round(coachingRevenue)}</li>
      <li><strong>Equipment fees:</strong> Rs ${Math.round(equipmentRevenue)}</li>
      <li><strong>Refunds processed:</strong> Rs ${Math.round(refunds)}</li>
    </ul>
  `;
}

export function startReportScheduler(): void {
  // Daily 20:00
  scheduleNextLocal(20, 0, async () => {
    const html = await buildDailySummaryHtml();
    await sendAdminReportEmail('FSCM – Daily Summary', html);
  }, 'daily');

  // Weekly Monday 08:00
  scheduleWeeklyLocal(1, 8, 0, async () => {
    const html = await buildWeeklyPerformanceHtml();
    await sendAdminReportEmail('FSCM – Weekly Performance', html);
  }, 'weekly');

  // Monthly 1st 08:00
  scheduleMonthlyLocal(1, 8, 0, async () => {
    const html = await buildMonthlyFinancialHtml();
    await sendAdminReportEmail('FSCM – Monthly Financial Report', html);
  }, 'monthly');

  console.log('[reports] scheduler started');
}

