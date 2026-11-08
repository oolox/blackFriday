import { describe, expect, it } from 'vitest';
import { areaTolerance, interiorTileTarget } from './generateBspLayout';
import { planRoomProgram, type ProgramRoom } from './planRoomProgram';

const house = {
  areaSquareFeet: 2000,
  roomCount: 4,
  buildingType: 'residential' as const,
};

const shop = {
  areaSquareFeet: 2000,
  roomCount: 4,
  buildingType: 'commercial' as const,
};

function role(rooms: ProgramRoom[], name: string): ProgramRoom {
  const found = rooms.find((room) => room.role === name);
  if (!found) {
    throw new Error(`missing ${name}`);
  }
  return found;
}

describe('planRoomProgram', () => {
  it('rejects a bad room count and a floor that cannot pay for the rooms', () => {
    expect(planRoomProgram({ ...house, roomCount: 0 }, 'seed')).toEqual({
      ok: false,
      errors: ['roomCount must be a positive integer'],
    });
    expect(planRoomProgram({ ...house, areaSquareFeet: 0 }, 'seed')).toEqual({
      ok: false,
      errors: ['areaSquareFeet must be a positive number'],
    });

    const tooSmall = planRoomProgram({ ...house, areaSquareFeet: 100 }, 'seed');
    expect(tooSmall.ok).toBe(false);
    if (!tooSmall.ok) {
      expect(tooSmall.errors[0]).toContain('too small');
    }
  });

  it('spends a 4-room house on a hall, a living room, one bedroom, and a bath', () => {
    const result = planRoomProgram(house, 'house');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const { program } = result;
    const target = interiorTileTarget(2000);
    expect(program.targetTiles).toBe(target);
    expect(program.rooms.map((room) => room.role).sort()).toEqual([
      'bath',
      'bedroom',
      'hall',
      'living',
    ]);
    expect(program.rooms.reduce((sum, room) => sum + room.targetArea, 0)).toBe(target);
    expect(
      Math.abs(program.rooms.reduce((sum, room) => sum + room.targetArea, 0) - target),
    ).toBeLessThanOrEqual(areaTolerance(4, target));

    const hall = role(program.rooms, 'hall');
    const living = role(program.rooms, 'living');
    const bath = role(program.rooms, 'bath');
    const bedroom = role(program.rooms, 'bedroom');
    expect(hall.id).toBe('room-1');
    expect(hall.takesEntrance).toBe(true);
    expect(hall.touchesShell).toBe(true);
    expect(hall.targetArea).toBe(Math.round(target * 0.12));
    expect(bath.targetArea).toBe(9);
    expect(bath.interiorAllowed).toBe(true);
    expect(bath.takesEntrance).toBe(false);
    expect(bedroom.targetArea).toBeGreaterThan(bath.targetArea);
    expect(living.targetArea).toBeGreaterThan(hall.targetArea);
    expect(living.targetArea).toBeGreaterThan(bedroom.targetArea);
    expect(living.touches).toEqual([hall.id]);
    expect(bath.touches).toEqual([hall.id]);
    expect(bedroom.touches).toEqual([hall.id]);
    expect(program.rooms.some((room) => room.role === 'kitchen')).toBe(false);
  });

  it('adds a kitchen once the house has a bedroom and a room left over', () => {
    const result = planRoomProgram({ ...house, roomCount: 5 }, 'house');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.program.rooms.map((room) => room.role).sort()).toEqual([
      'bath',
      'bedroom',
      'hall',
      'kitchen',
      'living',
    ]);
    const kitchen = role(result.program.rooms, 'kitchen');
    const hall = role(result.program.rooms, 'hall');
    expect(kitchen.touches).toEqual([hall.id]);
    expect(kitchen.interiorAllowed).toBe(true);
  });

  it('spends a 4-room shop on a showroom, a restroom, stock, and staff', () => {
    const result = planRoomProgram(shop, 'shop');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const { program } = result;
    const target = interiorTileTarget(2000);
    expect(program.rooms.map((room) => room.role).sort()).toEqual([
      'restroom',
      'sales',
      'staff',
      'stock',
    ]);
    expect(program.rooms.reduce((sum, room) => sum + room.targetArea, 0)).toBe(target);

    const sales = role(program.rooms, 'sales');
    const restroom = role(program.rooms, 'restroom');
    const stock = role(program.rooms, 'stock');
    const staff = role(program.rooms, 'staff');
    expect(sales.id).toBe('room-1');
    expect(sales.takesEntrance).toBe(true);
    expect(sales.targetArea).toBeGreaterThanOrEqual(Math.ceil(target / 2));
    expect(sales.targetArea).toBeGreaterThan(stock.targetArea);
    expect(stock.targetArea).toBeGreaterThan(staff.targetArea);
    expect(restroom.targetArea).toBe(9);
    expect(restroom.interiorAllowed).toBe(true);
    expect(restroom.touches).toEqual([sales.id]);
    expect(stock.touches).toEqual([sales.id]);
    expect(staff.touches).toEqual([sales.id]);
  });

  it('keeps a one-room request as a single shell room of the whole floor', () => {
    const result = planRoomProgram({ ...house, roomCount: 1 }, 'one');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.program.rooms).toHaveLength(1);
    const only = result.program.rooms[0];
    expect(only?.role).toBe('living');
    expect(only?.takesEntrance).toBe(true);
    expect(only?.targetArea).toBe(interiorTileTarget(2000));
  });

  it('returns the same rooms for the same parameters', () => {
    const first = planRoomProgram(house, 'a');
    const second = planRoomProgram(house, 'b');
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.program.rooms).toEqual(second.program.rooms);
  });
});
