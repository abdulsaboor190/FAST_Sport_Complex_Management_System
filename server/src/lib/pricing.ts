import { differenceInMinutes } from 'date-fns';
import type { Facility } from '@prisma/client';

function parseTime(t: string | null): { h: number; m: number } {
  if (!t) return { h: 0, m: 0 };
  const [h, m] = t.split(':').map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

function isPeak(
  startTime: Date,
  endTime: Date,
  peakStart: string | null,
  peakEnd: string | null
): boolean {
  if (!peakStart || !peakEnd) return false;
  const start = parseTime(peakStart);
  const end = parseTime(peakEnd);
  const startMins = start.h * 60 + start.m;
  const endMins = end.h * 60 + end.m;
  const slotStartMins = startTime.getHours() * 60 + startTime.getMinutes();
  const slotEndMins = endTime.getHours() * 60 + endTime.getMinutes();
  const peakStartMins = Math.max(startMins, slotStartMins);
  const peakEndMins = Math.min(endMins, slotEndMins);
  return peakEndMins > peakStartMins;
}

export function calculateBookingAmount(
  facility: Pick<
    Facility,
    'slotDurationMinutes' | 'pricePerSlotOffPeak' | 'pricePerSlotPeak' | 'peakStartTime' | 'peakEndTime'
  >,
  startTime: Date,
  endTime: Date
): number {
  const durationMins = differenceInMinutes(endTime, startTime);
  const slotCount = durationMins / facility.slotDurationMinutes;
  const peak = isPeak(
    startTime,
    endTime,
    facility.peakStartTime,
    facility.peakEndTime
  );
  const pricePerSlot = peak
    ? Number(facility.pricePerSlotPeak)
    : Number(facility.pricePerSlotOffPeak);
  return Math.round(pricePerSlot * slotCount * 100) / 100;
}
