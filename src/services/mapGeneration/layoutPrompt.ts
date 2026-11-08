/** Tile-budget slack checked against the square footage the model reports. */
export function layoutTolerance(interiorTiles: number): number {
  return Math.round(interiorTiles * 0.1);
}

export const layoutSystemPrompt = `You lay out one Black Friday building as json. The reply is one json code fence and no other text.

The fence is exactly this envelope. \`id\` is the Seed line from the setup, copied unchanged.

\`\`\`json
{
  "tool": "layout",
  "origin": "agent",
  "action": "create",
  "id": "<seed>",
  "data": {
    "areaSquareFeet": 861,
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

That example is a 12 by 11 box. Its 80 floor tiles are round(861 × 0.092903), and roomCount is 2. Use it for the shape. The brief decides which rooms exist and how large the building is.

Coordinates: (0, 0) is the northwest corner of the bounding box. +x is east. +y is south. \`width\` and \`height\` count every cell of that box, including the one-tile shell, and each is from 1 to 1024.

Room \`rects\` are interior floor. They do not include walls. Every rect uses integers and is at least 3 by 3. Rects in one room share a full side (edge-connected) and do not overlap. An L, a T, a U, or a ring is two or more rects with the same room id and no wall between them.

Leave a one-tile gap between rooms that share a wall. That gap is the wall. Do not put it in \`outside\` and do not put a floor rect on it. Rooms never overlap and never sit flush. The one-tile shell around the whole plan is the same kind of gap: every floor cell is at least one cell in from the box edge. Do not list shell cells.

\`outside\` lists cells that stay empty inside the box: an atrium, or the missing corner of an L. Those cells are not floor and not the one-tile wall you left between rooms. Every other cell is either floor or one of those one-tile walls.

Read the brief and decide the rooms before you place a rectangle. A number in the brief is exact: "8 bedrooms" is eight rooms with role \`bedroom\`, "2 baths" is two rooms with role \`bath\`, and "a study" is one room with role \`study\`. Also add the rooms that kind of building needs and the brief left unnamed. A house or mansion gets a \`hall\` that takes the entrance, a \`living\` room, and a \`kitchen\`. A shop, mall, or restaurant gets one \`concourse\` that takes the entrance, a \`showroom\` for each store, a \`dining\` room for each restaurant, staff rooms, and restrooms. When the brief gives a count and no names, a house spends it as living, hall, baths, bedrooms, and a kitchen, and a shop spends it as a showroom, a restroom, stock, and staff. Every counted room appears in the fence. A room the brief ruled out stays out.

\`role\` is a short lowercase word. \`buildingType\` is \`residential\` for a house or mansion and \`commercial\` for a shop, mall, or restaurant. The app cuts doors for residential and passages for commercial. You do not place the door.

The entrance room touches the shell. Public rooms (\`living\`, \`concourse\`, \`showroom\`, \`dining\`) prefer the shell. Private and service rooms (\`bedroom\`, \`bath\`, \`study\`, \`kitchen\`, \`staff\`, \`stock\`) may sit off the shell. Give the largest share of the floor to the heart of the brief: the living room of a mansion, the showrooms and dining rooms of a mall. Neighbors that the brief puts together share a one-tile wall with an overlap of at least 3 tiles.

You choose the size. \`areaSquareFeet\` is the interior floor you are drawing, as a positive number. \`roomCount\` is how many rooms you placed, and it must equal the number of objects in \`rooms\`. The player does not send a square footage or a room count.

One floor tile is one square meter. interiorTiles = round(areaSquareFeet × 0.092903). The sum of every floor cell must be within round(interiorTiles × 0.1) of interiorTiles. \`width\` and \`height\` include the one-tile shell, and each is an integer from 1 to 1024. Every rect is at least 3 by 3. For one rect, aspect is the longer side divided by the shorter side. A hall or concourse is longer than it is wide. A bath or restroom stays close to square.

Think through the room list, the size you chose, the one-tile gaps, the shell inset, the floor sum, and the 1024 cap. The reply itself is the fence only.`;

export function layoutSetupPrompt(seed: string, brief: string): string {
  return [
    'Lay out the building in this brief. You choose the square footage and the rooms. Reply with one json fence and no other text.',
    '',
    `Brief: ${brief}`,
    `Seed: ${seed}`,
  ].join('\n');
}
