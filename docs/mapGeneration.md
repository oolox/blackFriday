# Map generation

Black Friday is a top-down game with generative maps. A map is a collection of tiles. Each map is produced from parameters, not drawn by hand. This document specifies that pipeline. The shapes live in `src/types/map.ts`. Generation lives in `src/services/mapGeneration/`.

The playable result is a tile grid. The generator does not start from tiles. It builds a building, splits that building into rooms, cuts openings between rooms, then stamps `type: 'struct'` tiles into the grid. Products, triggers, and the player come later.

Sandbox play does not draw a map until the player accepts one. The first load, **New**, and a change into Sandbox open a fullscreen dialog: square footage, room count, and residential or commercial. **Generate** calls `generateMap` and closes the dialog. **Cancel** is shown only after a map exists, and it returns to that map. The game pane then draws the result. The header's Game mode is present and disabled.

## Units and limits

Each tile is a 1 meter square. One floor tile is 1 m² of interior.

The area parameter is square feet, because that is how building size is requested. The grid is meters. Convert before placing rooms:

`interiorFloorTiles = round(areaSquareFeet × 0.092903)`

1 ft² is 0.092903 m². A 2,000 ft² building is about 186 floor tiles. Walls sit outside that count. They add a one-tile shell around the rooms, so the bounding box is larger than the interior.

The hard cap is **1024 × 1024 tiles** on the bounding box, including exterior walls. Reject a request whose shell would pass that cap. Do not allocate a dense 1024² grid for a small building. Store the bounding box of the building that was actually generated. 1024² is about 1.05 million cells. That is a legal upper bound, not a typical map. A typed-array grid of that size is a few megabytes and is fine to generate. It is not fine to draw as DOM nodes.

## What a map contains

Two representations, produced in order:

1. **Layout.** Rooms, shared walls, and openings. This is what later algorithms replace.
2. **Tile grid.** One cell per meter inside the bounding box. Each cell is a palette index in a `Uint16Array`. `0` is outside the building. Any other value `n` selects `palette[n]`, a catalog tile id. `palette[0]` is unused. The grid is the size of the building that was generated, not a preallocated 1024².

A room is an axis-aligned rectangle of interior floor. Rooms do not overlap. Neighboring rooms share a one-tile wall. That wall is not part of either interior. An opening is a span on a wall:

- **Door.** One wall cell becomes a door tile. The rooms connect. The cell stays slower than open floor (`actAs.speed` 0.5 on the current doors).
- **Passage.** One or more consecutive wall cells become floor. There is no door tile. The opening reads as a gap between rooms.

Every room is reachable from every other room through openings. The building has one exterior entrance, which is an opening on the outer wall. The entrance does not count toward room-to-room connectivity.

## Parameters

| Parameter        | Meaning                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `areaSquareFeet` | Requested interior floor area. Converted to a tile count.                                                     |
| `roomCount`      | How many rooms to cut. At least 1. Each room must be able to hold its minimum interior.                       |
| `buildingType`   | `residential` or `commercial`. Chooses neighbors, proportions, and how openings are cut. More types can be added as data. |
| `seed`           | Replays the same map. All random choices come from this seed.                                                 |

`residential` prefers a footprint near square and doors. `commercial` prefers a wider footprint, passages, and an entrance on a long side. `adjacency-v1` also changes neighbors: private rooms open off a hall, and support rooms open off a sales floor. `bsp-v1` changes only the aspect ratio and the door-versus-passage mix. The parameters stay the same for both.

Suggested minimum interior is 3 × 3 tiles, so a door has a wall to sit in and a person has a cell to stand on. If `roomCount` cannot fit in the converted area at that minimum, generation fails with an error instead of shrinking rooms to nothing.

## Struct tiles

The first rasterizer places only `type: 'struct'` tiles whose `actAs.action` is `floor`, `wall`, or `door`. It reads the live catalog. It does not hard-code sprite paths. Current struct tiles:

| Catalog name           | `actAs.action` | `speed` | Placed as                                                                                                            |
| ---------------------- | -------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| Floor 1, Floor 2       | `floor`        | 1       | Interior floor, passages, and the walkable side of an entrance                                                       |
| Floor 3                | `floor`        | 0.7     | Same role. A generator may prefer it for a room type later. The first pass may ignore it and use a full-speed floor. |
| Wall 1, Wall 2         | `wall`         | 0       | Exterior shell and shared walls. Impassable.                                                                         |
| Door 1, Door 2, Door 3 | `door`         | 0.5     | A door opening, including the exterior entrance when that entrance is a door.                                        |
| Shelf 1, Shelf 2       | `surface`      | 0       | Not placed yet. Surfaces are furniture, not structure.                                                               |

Selection rules:

- A floor cell gets one tile with `action: 'floor'`.
- A solid wall cell gets one tile with `action: 'wall'`.
- A door cell gets one tile with `action: 'door'`.
- A passage cell gets a floor tile, not a door and not an empty cell. Empty is only outside the building.
- When several catalog tiles share an action, the request names the tile id to use. If it does not, the service picks the first matching tile in catalog order and records that id on the map so the choice is visible.
- `surface` stays out of this pass. A later furnishing pass can place shelves on floor cells. That pass must not punch holes in walls.

Speed stays on the tile. The generator does not invent a second collision grid. Movement later treats `speed === 0` as blocked, which matches walls and surfaces. Doors and floors are walkable.

## Algorithms

Published work splits into two jobs. **Topology** decides which rooms exist and which touch. **Dimensioning** assigns rectangles that meet the area and aspect rules. Painting wall and floor tiles is a third job and should stay dumb.

Constructive dungeon algorithms are the wrong long-term model, and the right first implementation.

| Approach                                                                                                                                                            | What it guarantees                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Fit for Black Friday                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Binary space partition                                                                                                                                              | A rectangle split until each leaf is one room. Shared edges become walls. Sibling cuts become door sites.                                                                                                                                                                                                                                                                                                                                                                                                  | Best first algorithm. Hits room count and a rectangular building. Weak control of which rooms touch.                                                       |
| Scatter rooms, then corridors ([rot.js](https://ondras.github.io/rot.js/) `Uniform`)                                                                                | Non-overlapping rooms joined by halls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Halls spend area the square-footage budget did not ask for. Easy to miss an exact room count.                                                              |
| Digger / agent ([rot.js](https://ondras.github.io/rot.js/) `Digger`, the Tyrant method on [RogueBasin](http://roguebasin.com/index.php/Dungeon_Building_Algorithm)) | A wandering carve.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Poor area and room-count guarantees. Organic, not a building.                                                                                              |
| Cellular automata                                                                                                                                                   | Cave-like solids and voids.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | No rooms, walls, or doors. Do not use.                                                                                                                     |
| Wave Function Collapse                                                                                                                                              | Local tile-to-tile constraints.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Useful later for picking wall variants. Cannot reliably hit "12 rooms and 2,000 ft²".                                                                      |
| Adjacency graph, then a rectangular floor plan                                                                                                                      | A planar room graph realized as rectangles, then sized. [Rectangular drawings](https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/rectangular.pdf) are the classical tool. [G2PLAN](https://onlinelibrary.wiley.com/doi/10.1111/cgf.14451) (Bisht et al., Computer Graphics Forum, 2022) enumerates dimensioned plans from an adjacency graph. [arXiv:1910.00081](https://arxiv.org/abs/1910.00081) sizes a rectangular arrangement with a linear program (minimum width and aspect ratio per room). | Target algorithm. Building type becomes a small planar graph. Area and aspect become numbers on the nodes.                                                 |
| Shape grammars, evolutionary packing, learned layout                                                                                                                | Style or search. Merrell, Schkufza, and Koltun, _Computer-Generated Residential Building Layouts_ (SIGGRAPH 2010), is the reference learned residential pipeline. A 2014 comparison of evolutionary methods found subdivision more reliable than dense packing when rooms must fill a footprint.                                                                                                                                                                                                           | Too heavy for the first service. Subdivision beating dense packing is why the first generator fills one footprint instead of scattering rooms into a void. |

Practice that is worth keeping no matter which algorithm runs:

- Seed every random choice. The same parameters and seed return the same layout.
- Validate after generation: room count, interior area within a small tolerance of the request, every room reachable, every opening on a real shared or exterior edge, bounding box inside 1024 × 1024.
- Keep the tile stamp separate from the layout. Swapping BSP for a rectangular-dual planner must not change the grid type.
- Fail when the constraints cannot be met. Do not return a map that quietly dropped a room.
- Prefer one shared wall between neighbors. Doubling the wall wastes meters and makes doors ambiguous.

`bsp-v1` fits a footprint to the interior area plus a one-tile shell, using the building type's aspect ratio, and clamps it to 1024 on each side. It splits the interior with alternating cuts until there are `roomCount` leaves. Each cut stays wide enough that both sides can still hold their rooms at the minimum size. Each leaf is a room. Each cut is a shared wall.

`adjacency-v1` is the default. One room is still a single rectangle plus a shell. Two or more rooms are a star inside one rectangle. The south span is one room across the full interior width: a `hall` in a house, a `sales` floor in a shop. The other rooms sit in a row on its north side, each at least 3×3, with a one-tile vertical wall between neighbors. Each north room has its own horizontal wall into the south room, only as wide as that room, so every required pair gets an opening. The sales floor takes at least half the floor tiles when a plan inside the area tolerance can do that, and it is at least as large as each support room. The entrance opens into the hall or the sales floor. A house that cannot afford the hall fails instead of dropping a room.

Both planners then call `planOpenings`. That cuts one opening per shared wall, then one exterior entrance, and checks that every room is reachable. A residential opening is a door one cell wide. A commercial opening is a passage of two cells on a run of at least three, or three cells on a run of at least five. The commercial entrance sits on a long side of the footprint. When the planner names an entrance room, the entrance has to land on that room.

## Engines and packages

Generation must not import a renderer. The service returns data. The game pane draws it. The app is React 18, Vite, and TypeScript, and the pane uses PixiJS.

| Option                                                                                  | Role                                                                                                                                                                  | Decision                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A small TypeScript service in this repo                                                 | Layout, openings, struct stamp, seeded RNG.                                                                                                                           | Use this. It is testable in Vitest and can change algorithms behind one method.                                                                                                                                               |
| [rot.js](https://ondras.github.io/rot.js/)                                              | Roguelike maps (`Digger`, `Uniform`, cellular, mazes) and a seeded RNG.                                                                                               | Do not adopt it as the map model. Its output is a wall/floor mask plus corridor rooms, which drops area, openings, and building type. Reading its dungeon code is useful. Depending on it is optional and not needed for BSP. |
| [PixiJS](https://pixijs.com/) with [`@pixi/tilemap`](https://github.com/pixijs/tilemap) | 2D WebGL. `CompositeTilemap` draws a rectangular tilemap from a texture list and stays fast past what DOM or a plain canvas loop can do. Pixi 8 pairs with tilemap 5. | Pixi is the game pane renderer. One canvas, React on the chrome. The visible window is sprites: `CompositeTilemap` painted a blank canvas on Pixi 8.22. Revisit tilemap when a map outgrows a few hundred visible cells. |
| [Phaser 3](https://phaser.io/)                                                          | Full framework: tilemaps, cameras, arcade physics, and a scene graph.                                                                                                 | A second application inside the play view. Adopt it only if the play view is handed off entirely. It should not own generation.                                                                                               |
| Excalibur                                                                               | A lighter TypeScript game framework with a camera and tile support.                                                                                                   | Same objection as Phaser, with less tilemap tooling.                                                                                                                                                                          |
| [three.js](https://threejs.org/)                                                        | 3D. An orthographic camera and `InstancedMesh` can draw a flat grid of quads, including a million cells.                                                              | Not the first renderer. It pays for lighting, a scene graph, and 3D math this map does not use. Revisit if the game leaves a flat top-down grid. Do not generate maps inside three.js.                                        |

Drawing rules:

- The canvas fills the game pane. World `(0, 0)` is the northwest corner of the building box. `+x` is east and `+y` is south. The camera is the world point under the center of the pane.
- The first frame centers the building. Drag pans when the building is larger than the pane. The camera clamps so the view stays inside the bounding box. An axis that fits stays centered.
- Draw only the viewport plus a one-tile margin, as Pixi sprites. Room type and id are a second layer on the same transform, toggled from the game header. They are not stamped into the grid.
- A player will later own the camera: a dead zone in the middle of the pane, then scrolling as they reach the edge, still clamped to the box. Chunk size of 32 or 64 stays a renderer concern.

## Phased plan

Each phase keeps the public `generate` method stable. Later phases replace a stage, not the map.

1. **Types.** Shapes are in `src/types/map.ts`. No generation yet. `layoutIssues` checks bounds, disjoint rooms, and that openings sit on wall cells. `gridIssues` checks the palette and the `Uint16Array` length.
2. **Footprint and rooms.** `generateBspLayout` in `src/services/mapGeneration/` is a seeded BSP. It returns rooms and one shared wall per cut. No tile ids. Floor area stays within `max(roomCount, 10%)` of the converted square footage. Each room is at least 3×3. The bounding box stays inside 1024×1024.
3. **Openings.** `planOpenings` cuts one opening per shared wall and adds one exterior entrance. Residential openings are doors. Commercial openings are passages, and the commercial entrance is on a long side. `roomsConnected` checks that every room is reachable. No tile ids yet.
4. **Struct rasterizer.** `generateMap` stamps the layout into a palette and a `Uint16Array`. Rooms and passages use the first `floor` struct, or `stamp.floor` when the request names one. Solid walls use `wall`. Door openings use `door`. Surfaces are not placed. `gridIssues` checks the palette. This is the first phase that returns a playable tile grid.
5. **Building-type graphs.** `generateAdjacencyLayout` (`adjacency-v1`) is the default planner. For two or more rooms it builds the star above: residential rooms open off a hall, and commercial support rooms open off a sales floor. `planOpenings` prefers that south room for the entrance. `bsp-v1` stays available when the request sets `generatorId`. `generateMap` request and result are unchanged.
6. **View.** The game pane mounts a Pixi canvas after Generate. The camera starts centered on that building. Drag pans a building larger than the pane and clamps to the box. The Rooms checkbox draws each room's type and id. The dialog defaults to 2,000 ft², 4 rooms, and residential. Player movement that reads `actAs.speed`, and the dead-zone follow that replaces drag, are still ahead. The generation service does not know about the camera.
7. **Dressing.** Surfaces, products, and triggers on floor cells. Out of scope until the struct grid is trustworthy.

## Generation service

Planned home: `src/services/mapGeneration/`. Planned types: `src/types/map.ts`. The service is a pure function plus a thin object so a later UI can call one thing.

```ts
generateMap(request: GenerateMapRequest): GenerateMapResult
```

`GenerateMapRequest` carries `MapParameters`, the `seed`, the struct catalog (or the three chosen tile ids), and an optional `generatorId`. The default id is `adjacency-v1`. `bsp-v1` is still registered. An unknown id is an error. Adding a generator means registering a new id. Callers that omit the id keep working.

`GenerateMapResult` is either `{ ok: true, map: GeneratedMap }` or `{ ok: false, errors: string[] }`. Constraint failures and a catalog with no floor, wall, or required door are both results. An unknown `generatorId` is an error. Omitting it uses `adjacency-v1`.

Stages, each replaceable:

1. `MapGenerator` turns parameters and a `RandomSource` into a `MapLayout` (footprint, rooms, shared walls). `adjacency-v1` is the default. `bsp-v1` is the earlier splitter.
2. `OpeningPlanner` writes `Opening[]` onto that layout.
3. `StructRasterizer` writes cells from the layout and the chosen struct ids.

`GeneratedMap` stores the parameters, the seed, the generator id, the layout, the width and height, and the cells. Keeping the layout next to the cells lets a later tool explain why a door is where it is, and lets phase 5 change the planner without a new save format.

`RandomSource` is the only source of randomness: `next()`, `int(min, max)`, and `pick(items)`, all driven by the seed. Stages receive it. They do not call `Math.random`.

Cells are dense inside the bounding box and addressed as `y * width + x`. Storage is a `Uint16Array` of palette indexes, 2 bytes per cell. A 1024 × 1024 grid is about 2 MB. A JavaScript array of tile-id strings is the representation to avoid: a million strings is hundreds of megabytes, and catalog order would leak into saved maps. The palette on the map is the list of tile ids that grid uses, so a save does not depend on catalog order. `0` is outside the building. `cellAt` reads one index. If a future map is mostly exterior void, switch the storage to chunks behind that accessor.

Invariants the service checks before returning `ok: true`:

- `1 <= width <= 1024` and `1 <= height <= 1024`.
- Interior floor cells, excluding walls, are within a small tolerance of `round(areaSquareFeet × 0.092903)`. BSP cannot always hit the count exactly after integer splits. Record the achieved area on the map.
- `rooms.length === roomCount`, interiors are disjoint, and each interior meets the minimum.
- Shared walls are one tile thick.
- Openings lie on a wall span they fully cover. Door openings are one tile. Passage openings are at least one tile.
- The room graph is connected.
- There is one exterior entrance.
- Every non-zero cell index is in range of `palette`. `palette[1]` is floor, `palette[2]` is wall, and `palette[3]` is door when the map has a door. A door cell uses the door index. A passage cell uses the floor index. Every other building cell is a wall. Index 0 is unused because the footprint fills its bounding box.

## Planned shapes

```ts
type BuildingType = 'residential' | 'commercial';

interface MapParameters {
  areaSquareFeet: number;
  roomCount: number;
  buildingType: BuildingType;
}

interface TileCoord {
  x: number;
  y: number;
}

interface SharedWall {
  id: string;
  orientation: 'vertical' | 'horizontal';
  /** Rooms on the left of a vertical wall, or above a horizontal wall. */
  a: string[];
  /** Rooms on the right of a vertical wall, or below a horizontal wall. */
  b: string[];
  cells: TileCoord[];
}

interface Room {
  id: string;
  /** Interior rectangle in tile coordinates. Excludes the surrounding wall. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Adjacency role, such as `hall`, `private`, `sales`, or `support`. BSP leaves this unset. */
  role?: string;
}

type OpeningKind = 'door' | 'passage';

interface Opening {
  id: string;
  kind: OpeningKind;
  /** Rooms on each side. One is null for the exterior entrance. */
  a: string | null;
  b: string | null;
  /** Wall cells this opening replaces, in order. */
  cells: TileCoord[];
}

interface MapLayout {
  width: number;
  height: number;
  rooms: Room[];
  walls: SharedWall[];
  openings: Opening[];
}

interface GeneratedMap {
  parameters: MapParameters;
  seed: string;
  generatorId: string;
  /** Interior floor tiles actually placed. */
  interiorTiles: number;
  layout: MapLayout;
  /**
   * Catalog tile ids. Index 0 is unused.
   * `cells[i] === n` and `n > 0` means `palette[n]`.
   */
  palette: readonly string[];
  /** Length width * height. 0 is outside the building. */
  cells: Uint16Array;
}
```

`BuildingTypeProfile` is data, not a branch buried in the splitter: target aspect, minimum interior, and which side prefers the entrance. Residential and commercial are the first two profiles. A new building type is a new profile plus an adjacency template.

## Later, not in the service

The game pane reads the finished grid and does not call back into generation. The Sandbox dialog is the only caller that asks for a new grid. Drag moves the camera until a player exists. The player will then own the camera: movement reads `actAs.speed`, a dead zone in the middle of the pane delays scrolling, and the view still stops at the map edge.

Products (`purchase`), sale and hazard triggers, and `surface` shelves are a dressing pass on floor cells. They are catalog tiles the struct rasterizer must leave room for, and must not place.
