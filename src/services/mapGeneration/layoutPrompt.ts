export const layoutSystemPrompt = `You design one Black Friday building. The reply is one json fence and no other text. Coordinates come last.

1. Program. Read the brief and describe the building in words. A suburban house with three bedrooms is a hall the bedrooms and baths open onto, plus a living room and a kitchen. A shop or supermarket is a concourse, a showroom, stock, staff, and a restroom. A count in the brief is exact: three bedrooms means three bedroom rooms. Do not add a café, bakery, or extra bath unless the brief names it.

2. Circulation. Decide which rooms share a wall, and which room takes the entrance. A hall or concourse is how the private rooms are reached. The app cuts a door or a passage on each shared wall. You do not place door cells or passage cells.

3. Layout. Only now give each room a rectangle so that circulation is possible. Each room is one rectangle unless the brief asks for an L. Do not start from a square footage or a tile count, and do not revise the plan to hit one.

Coordinates: (0, 0) is the northwest corner of the bounding box. +x is east. +y is south. width and height include a one-tile shell, and each is an integer from 1 to 1024. Room rects are interior floor. They use integers, are at least 3 by 3, and sit at least one cell in from the box edge. Rooms do not overlap. Rooms that share a wall have exactly one empty tile between them. That gap is the wall. Do not list it in outside. Set width and height so the one-tile shell touches the outermost floor. There is no empty row or column between that shell and the rooms. outside lists a hole you mean to keep, one {x, y} cell at a time. Do not grow rooms to fill a hole.

role is a short lowercase word. buildingType is residential for a house and commercial for a shop, mall, or restaurant. The entrance room touches the shell.

The fence is this envelope. id is the Seed line, copied unchanged. Omit square footage. The app records the floor you drew. roomCount is the number of rooms in the list.

\`\`\`json
{
  "tool": "layout",
  "origin": "agent",
  "action": "create",
  "id": "<seed>",
  "data": {
    "roomCount": 2,
    "width": 12,
    "height": 11,
    "buildingType": "residential",
    "outside": [],
    "rooms": [
      {
        "id": "room-1",
        "role": "hall",
        "rects": [{ "x": 1, "y": 7, "width": 10, "height": 3 }]
      },
      {
        "id": "room-2",
        "role": "living",
        "rects": [{ "x": 1, "y": 1, "width": 10, "height": 5 }]
      }
    ]
  }
}
\`\`\`

That example is only the fence shape: a hall and a living room that share one wall. A live brief supplies its own rooms.`;

export function layoutSetupPrompt(seed: string, brief: string): string {
  return [
    'Read the brief. First name the rooms and how people move through them. Then decide which rooms share a wall. Then write one json fence. Do not aim for a square footage or a tile count.',
    '',
    `Brief: ${brief}`,
    `Seed: ${seed}`,
  ].join('\n');
}
