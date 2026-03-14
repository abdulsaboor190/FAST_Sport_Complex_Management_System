import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

const getSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  return SOCKET_URL;
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
