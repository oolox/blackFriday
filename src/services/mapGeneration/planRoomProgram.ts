import type { BuildingType, MapParameters } from '../../types/map';
import { areaTolerance, interiorTileTarget } from './generateBspLayout';

const MIN_ROOM_AREA = 9;
const HALL_MIN_AREA = 12;
const STOCK_MIN_AREA = 12;
const LONE_BEDROOM_AREA = 18;
const SECONDARY_BEDROOM_AREA = 12;

export type ProgramRole =
  'living' | 'hall' | 'bath' | 'bedroom' | 'kitchen' | 'sales' | 'restroom' | 'stock' | 'staff';

export interface ProgramRoom {
  id: string;
  role: ProgramRole;
  /** The larger bedroom when the house has more than one. */
  rank?: 'primary';
  targetArea: number;
  /** Longer side divided by the shorter side. */
  minAspect: number;
  maxAspect: number;
  touchesShell: boolean;
  /** The packer may keep this room off the outer wall. */
  interiorAllowed: boolean;
  takesEntrance: boolean;
  /** Other room ids that must share a wall with this room. */
  touches: string[];
}

export interface RoomProgram {
  parameters: MapParameters;
  seed: string;
  targetTiles: number;
  tolerance: number;
  rooms: ProgramRoom[];
}

export interface RoomProgramSuccess {
  ok: true;
  program: RoomProgram;
}

export interface RoomProgramFailure {
  ok: false;
  errors: string[];
}

export type RoomProgramResult = RoomProgramSuccess | RoomProgramFailure;

interface Slot {
  role: ProgramRole;
  area: number;
  min: number;
  rank?: 'primary';
}

/**
 * Names the rooms, their target areas, and who must share a wall.
 * No rectangles. The same parameters always return the same program.
 */
export function planRoomProgram(parameters: MapParameters, seed: string): RoomProgramResult {
  const errors = parameterErrors(parameters);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const targetTiles = interiorTileTarget(parameters.areaSquareFeet);
  const tolerance = areaTolerance(parameters.roomCount, targetTiles);
  const slots = slotsFor(parameters.buildingType, parameters.roomCount);
  const areaError = assignAreas(parameters.buildingType, targetTiles, tolerance, slots);
  if (areaError) {
    return { ok: false, errors: [areaError] };
  }

  return {
    ok: true,
    program: {
      parameters,
      seed,
      targetTiles,
      tolerance,
      rooms: toRooms(parameters.buildingType, slots),
    },
  };
}

function parameterErrors(parameters: MapParameters): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(parameters.roomCount) || parameters.roomCount < 1) {
    errors.push('roomCount must be a positive integer');
  }
  if (!Number.isFinite(parameters.areaSquareFeet) || parameters.areaSquareFeet <= 0) {
    errors.push('areaSquareFeet must be a positive number');
  }
  return errors;
}

function slotsFor(buildingType: BuildingType, roomCount: number): Slot[] {
  const roles =
    buildingType === 'residential' ? residentialRoles(roomCount) : commercialRoles(roomCount);
  const bedrooms = roles.filter((role) => role === 'bedroom').length;
  let seenBedroom = false;
  return roles.map((role) => {
    const min = minimumArea(role);
    const slot: Slot = { role, area: min, min };
    if (role === 'bedroom' && bedrooms > 1 && !seenBedroom) {
      slot.rank = 'primary';
      seenBedroom = true;
    }
    return slot;
  });
}

/** Living, then hall, bath, one bedroom, a kitchen, more bedrooms, and a second bath after four bedrooms. */
function residentialRoles(roomCount: number): ProgramRole[] {
  const roles: ProgramRole[] = ['living'];
  if (roomCount === 1) {
    return roles;
  }
  roles.push('hall');
  if (roomCount === 2) {
    return roles;
  }
  roles.push('bath');
  let extra = roomCount - 3;
  let bedrooms = 0;
  let secondBath = false;
  const addBedroom = () => {
    roles.push('bedroom');
    bedrooms += 1;
    extra -= 1;
  };
  if (extra > 0) {
    addBedroom();
  }
  if (extra > 0) {
    roles.push('kitchen');
    extra -= 1;
  }
  while (extra > 0) {
    if (bedrooms >= 4 && !secondBath) {
      roles.push('bath');
      secondBath = true;
      extra -= 1;
      continue;
    }
    addBedroom();
  }
  return roles;
}

/** Sales, then a restroom, stock before staff, and a second restroom after three support rooms. */
function commercialRoles(roomCount: number): ProgramRole[] {
  const roles: ProgramRole[] = ['sales'];
  if (roomCount === 1) {
    return roles;
  }
  roles.push('restroom');
  let extra = roomCount - 2;
  let support = 0;
  let stockCount = 0;
  let secondRestroom = false;
  while (extra > 0) {
    if (support >= 3 && !secondRestroom) {
      roles.push('restroom');
      secondRestroom = true;
      extra -= 1;
      continue;
    }
    const staffCount = support - stockCount;
    if (stockCount <= staffCount) {
      roles.push('stock');
      stockCount += 1;
    } else {
      roles.push('staff');
    }
    support += 1;
    extra -= 1;
  }
  return roles;
}

function minimumArea(role: ProgramRole): number {
  if (role === 'hall') {
    return HALL_MIN_AREA;
  }
  if (role === 'stock') {
    return STOCK_MIN_AREA;
  }
  return MIN_ROOM_AREA;
}

function assignAreas(
  buildingType: BuildingType,
  target: number,
  tolerance: number,
  slots: Slot[],
): string | null {
  const sales = slots.find((slot) => slot.role === 'sales');
  if (sales) {
    sales.min = Math.max(sales.min, Math.ceil(target / 2));
    sales.area = sales.min;
  }
  const bedrooms = slots.filter((slot) => slot.role === 'bedroom');
  if (bedrooms.length > 1) {
    const primary = bedrooms[0];
    if (primary) {
      primary.min = Math.round(MIN_ROOM_AREA * 1.5);
      primary.area = primary.min;
    }
  }

  const sum = () => slots.reduce((total, slot) => total + slot.area, 0);
  if (sum() > target + tolerance) {
    return `area is too small for ${slots.length} ${buildingType} rooms`;
  }

  let budget = target - sum();
  const grow = (slot: Slot | undefined, desired: number) => {
    if (!slot || budget <= 0) {
      return;
    }
    const add = Math.min(budget, Math.max(0, desired - slot.area));
    slot.area += add;
    budget -= add;
  };

  grow(
    slots.find((slot) => slot.role === 'hall'),
    Math.max(HALL_MIN_AREA, Math.round(target * 0.12)),
  );
  grow(
    slots.find((slot) => slot.role === 'kitchen'),
    Math.max(MIN_ROOM_AREA, Math.round(target * 0.12)),
  );
  if (bedrooms.length === 1) {
    grow(bedrooms[0], LONE_BEDROOM_AREA);
  } else if (bedrooms.length > 1) {
    const primary = bedrooms[0];
    const secondaries = bedrooms.slice(1);
    const primaryArea = Math.round(SECONDARY_BEDROOM_AREA * 1.5);
    const cost =
      (primary ? Math.max(0, primaryArea - primary.area) : 0) +
      secondaries.reduce(
        (total, slot) => total + Math.max(0, SECONDARY_BEDROOM_AREA - slot.area),
        0,
      );
    if (primary && budget >= cost) {
      budget -= primaryArea - primary.area;
      primary.area = primaryArea;
      for (const slot of secondaries) {
        budget -= SECONDARY_BEDROOM_AREA - slot.area;
        slot.area = SECONDARY_BEDROOM_AREA;
      }
    }
  }

  if (budget > 0) {
    if (buildingType === 'commercial' && sales) {
      budget = pourSupport(slots, budget);
    }
    const living = slots.find((slot) => slot.role === 'living');
    if (living) {
      living.area += budget;
      budget = 0;
    } else if (sales) {
      sales.area += budget;
    }
  }

  const anchor = slots.find((slot) => slot.role === 'living' || slot.role === 'sales');
  if (anchor && !makeLargest(anchor, slots)) {
    return `area is too small for ${slots.length} ${buildingType} rooms`;
  }
  return null;
}

/** Stock takes twice the leftover of staff. Returns the tiles still unspent. */
function pourSupport(slots: Slot[], budget: number): number {
  const stocks = slots.filter((slot) => slot.role === 'stock');
  const staff = slots.filter((slot) => slot.role === 'staff');
  const weight = stocks.length * 2 + staff.length;
  if (weight === 0) {
    return budget;
  }
  const unit = Math.floor(budget / weight);
  let spent = 0;
  for (const slot of stocks) {
    slot.area += unit * 2;
    spent += unit * 2;
  }
  for (const slot of staff) {
    slot.area += unit;
    spent += unit;
  }
  return budget - spent;
}

function makeLargest(anchor: Slot, slots: Slot[]): boolean {
  for (let guard = 0; guard < 100000; guard += 1) {
    let rival: Slot | undefined;
    for (const slot of slots) {
      if (slot !== anchor && (!rival || slot.area > rival.area)) {
        rival = slot;
      }
    }
    if (!rival || anchor.area > rival.area) {
      return true;
    }
    if (rival.area <= rival.min) {
      return false;
    }
    rival.area -= 1;
    anchor.area += 1;
  }
  return false;
}

function toRooms(buildingType: BuildingType, slots: Slot[]): ProgramRoom[] {
  const entranceRole: ProgramRole =
    buildingType === 'commercial'
      ? 'sales'
      : slots.some((slot) => slot.role === 'hall')
        ? 'hall'
        : 'living';
  const entrance = slots.find((slot) => slot.role === entranceRole) ?? slots[0];
  const ordered = [entrance, ...slots.filter((slot) => slot !== entrance)].filter(
    (slot): slot is Slot => slot != null,
  );
  const rooms: ProgramRoom[] = ordered.map((slot, index) => {
    const aspects = aspectBand(slot.role);
    const onShell = slot.role === 'living' || slot.role === 'hall' || slot.role === 'sales';
    return {
      id: `room-${index + 1}`,
      role: slot.role,
      targetArea: slot.area,
      minAspect: aspects.min,
      maxAspect: aspects.max,
      touchesShell: onShell,
      interiorAllowed: !onShell,
      takesEntrance: slot === entrance,
      touches: [],
      ...(slot.rank ? { rank: slot.rank } : {}),
    };
  });

  const hub = rooms.find((room) => room.takesEntrance);
  if (hub && (hub.role === 'hall' || hub.role === 'sales') && rooms.length > 1) {
    for (const room of rooms) {
      if (room !== hub) {
        room.touches = [hub.id];
      }
    }
  }
  return rooms;
}

function aspectBand(role: ProgramRole): { min: number; max: number } {
  switch (role) {
    case 'hall':
      return { min: 1.25, max: 4 };
    case 'living':
    case 'sales':
      return { min: 1.2, max: 3 };
    case 'bath':
    case 'restroom':
      return { min: 1, max: 1.5 };
    case 'bedroom':
    case 'staff':
      return { min: 1, max: 2 };
    case 'kitchen':
    case 'stock':
      return { min: 1, max: 2.5 };
  }
}
