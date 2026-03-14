import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
};

let socket: ReturnType<typeof io> | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(getSocketUrl(), {
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
}

export function subscribeFacilitySlots(
  facilityId: string,
  date: string,
  onUpdate: () => void
) {
  const s = getSocket();
  s.emit('subscribe:facility', { facilityId, date });
  const handler = () => onUpdate();
  s.on('slots-updated', handler);
  return () => {
    s.off('slots-updated', handler);
    s.emit('unsubscribe:facility', { facilityId, date });
  };
}
