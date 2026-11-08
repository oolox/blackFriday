import { roomRects, type Room } from '../../types/map';

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
  return roomRects(room).some(
    (part) => part.x < x1 && part.x + part.width > x0 && part.y < y1 && part.y + part.height > y0,
  );
}

/** Center of the largest floor rectangle, so a ring's label stays on the floor. */
export function roomLabelAnchor(room: Room): { x: number; y: number } {
  const part = roomRects(room).reduce((largest, candidate) =>
    candidate.width * candidate.height > largest.width * largest.height ? candidate : largest,
  );
  return { x: part.x + part.width / 2, y: part.y + part.height / 2 };
}
