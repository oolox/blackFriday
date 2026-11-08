import type { Room } from '../../types/map';

/** Type on the first line, id on the second, until rooms have display names. */
export function roomOverlayText(room: Room): string {
  const type = room.role ? `${room.role.charAt(0).toUpperCase()}${room.role.slice(1)}` : 'Room';
  return `${type}\n${room.id}`;
}

export function roomIntersects(
  room: Room,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): boolean {
  return room.x < x1 && room.x + room.width > x0 && room.y < y1 && room.y + room.height > y0;
}
