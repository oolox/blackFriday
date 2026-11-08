# Map generation

Black Friday is a top-down game with generative maps. A map is a collection of tiles. Each map is produced from parameters, not drawn by hand. This document specifies that pipeline. The shapes live in `src/types/map.ts`. Generation lives in `src/services/mapGeneration/`.

The playable result is a tile grid. The generator does not start from tiles. It builds a building, splits that building into rooms, cuts openings between rooms, then stamps `type: 'struct'` tiles into the grid. Products, triggers, and the player come later.

Sandbox play does not draw a map until the player accepts one. The first load, **New**, and a change into Sandbox open a fullscreen dialog. **ALGO** asks for square footage, room count, and residential or commercial. **LLM** asks for a brief. **Generate** calls `generateMap` on **ALGO** and `generateLlmMap` on **LLM**. **ALGO** closes the dialog when the plan is accepted. **LLM** leaves it open so the log can be copied. **Close** is shown only after a map exists, and it returns to that map. Clicking the dimmed area and pressing Escape leave the dialog open. The game pane then draws the result. The header's Game mode is present and disabled. Beside that toggle, **LLM** is selected and calls fal. **ALGO** stays available. The model chooses the square footage and the rooms from that brief.

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

A room in `bsp-v1` and `adjacency-v1` is one axis-aligned rectangle of interior floor. `program-v1` keeps that rectangle and can add `parts` when a room wraps an atrium. Rooms do not overlap. Neighboring rooms share a one-tile wall. That wall is not part of either interior. An opening is a span on a wall:

- **Door.** One wall cell becomes a door tile. The rooms connect. The cell stays slower than open floor (`actAs.speed` 0.5 on the current doors).
- **Passage.** One or more consecutive wall cells become floor. There is no door tile. The opening reads as a gap between rooms.

Every room is reachable from every other room through openings. The building has one exterior entrance, which is an opening on the outer wall. The entrance does not count toward room-to-room connectivity.

## Parameters

| Parameter        | Meaning                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `areaSquareFeet` | Requested interior floor area. Converted to a tile count.                                                                 |
| `roomCount`      | How many rooms to cut. At least 1. Each room must be able to hold its minimum interior.                                   |
| `buildingType`   | `residential` or `commercial`. Chooses neighbors, proportions, and how openings are cut. More types can be added as data. |
| `seed`           | Replays the same map. All random choices come from this seed.                                                             |

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

| Approach                                                                                                                                                            | What it guarantees                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Fit for Black Friday                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Binary space partition                                                                                                                                              | A rectangle split until each leaf is one room. Shared edges become walls. Sibling cuts become door sites.                                                                                                                                                                                                                                                                                                                                                                                                  | Best first algorithm. Hits room count and a rectangular building. Weak control of which rooms touch.                                                                             |
| Scatter rooms, then corridors ([rot.js](https://ondras.github.io/rot.js/) `Uniform`)                                                                                | Non-overlapping rooms joined by halls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Halls spend area the square-footage budget did not ask for. Easy to miss an exact room count.                                                                                    |
| Digger / agent ([rot.js](https://ondras.github.io/rot.js/) `Digger`, the Tyrant method on [RogueBasin](http://roguebasin.com/index.php/Dungeon_Building_Algorithm)) | A wandering carve.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Poor area and room-count guarantees. Organic, not a building.                                                                                                                    |
| Cellular automata                                                                                                                                                   | Cave-like solids and voids.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | No rooms, walls, or doors. Do not use.                                                                                                                                           |
| Wave Function Collapse                                                                                                                                              | Local tile-to-tile constraints.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Useful later for picking wall variants. Cannot reliably hit "12 rooms and 2,000 ft²".                                                                                            |
| Adjacency graph, then a rectangular floor plan                                                                                                                      | A planar room graph realized as rectangles, then sized. [Rectangular drawings](https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/rectangular.pdf) are the classical tool. [G2PLAN](https://onlinelibrary.wiley.com/doi/10.1111/cgf.14451) (Bisht et al., Computer Graphics Forum, 2022) enumerates dimensioned plans from an adjacency graph. [arXiv:1910.00081](https://arxiv.org/abs/1910.00081) sizes a rectangular arrangement with a linear program (minimum width and aspect ratio per room). | Placement step only. It cannot emit an L-room, a room off the shell, or an atrium. The next generator uses it to pack the program, then merges rectangles into orthogonal rooms. |
| Shape grammars, evolutionary packing, learned layout                                                                                                                | Style or search. Merrell, Schkufza, and Koltun, _Computer-Generated Residential Building Layouts_ (SIGGRAPH 2010), is the reference learned residential pipeline. A 2014 comparison of evolutionary methods found subdivision more reliable than dense packing when rooms must fill a footprint.                                                                                                                                                                                                           | Too heavy for the first service. Subdivision beating dense packing is why the first generator fills one footprint instead of scattering rooms into a void.                       |

Practice that is worth keeping no matter which algorithm runs:

- Seed every random choice. The same parameters and seed return the same layout.
- Validate after generation: room count, interior area within a small tolerance of the request, every room reachable, every opening on a real shared or exterior edge, bounding box inside 1024 × 1024.
- Keep the tile stamp separate from the layout. Swapping BSP for a rectangular-dual planner must not change the grid type.
- Fail when the constraints cannot be met. Do not return a map that quietly dropped a room.
- Prefer one shared wall between neighbors. Doubling the wall wastes meters and makes doors ambiguous.

`bsp-v1` fits a footprint to the interior area plus a one-tile shell, using the building type's aspect ratio, and clamps it to 1024 on each side. It splits the interior with alternating cuts until there are `roomCount` leaves. Each cut stays wide enough that both sides can still hold their rooms at the minimum size. Each leaf is a room. Each cut is a shared wall.

`adjacency-v1` stays registered. One room is still a single rectangle plus a shell. Two or more rooms are a star inside one rectangle. The south span is one room across the full interior width: a `hall` in a house, a `sales` floor in a shop. The other rooms sit in a row on its north side, each at least 3×3, with a one-tile vertical wall between neighbors. Each north room has its own horizontal wall into the south room, only as wide as that room, so every required pair gets an opening. The sales floor takes at least half the floor tiles when a plan inside the area tolerance can do that, and it is at least as large as each support room. The entrance opens into the hall or the sales floor. A house that cannot afford the hall fails instead of dropping a room.

Both planners then call `planOpenings`. That cuts one opening per shared wall, then one exterior entrance, and checks that every room is reachable. A residential opening is a door one cell wide. A commercial opening is a passage of two cells on a run of at least three, or three cells on a run of at least five. The commercial entrance sits on a long side of the footprint. When the planner names an entrance room, the entrance has to land on that room.

`adjacency-v1` is why two seeds of the same request look like the same building. The south room always spans the full interior width, and every other room is a rectangle in one row on its north side. Residential and commercial change that south room's depth, the footprint's aspect, and doors versus passages. They do not change which rooms exist, and they do not let a room sit anywhere but on that row.

## The maps have to vary

`program-v1` is the default, and it is what **ALGO** runs. The seed picks a rectangle, an L, an atrium, or an L with an atrium when the floor is large enough. If that family misses the area tolerance, the generator tries the others. It does not fall back to the star. `bsp-v1` and `adjacency-v1` stay available by id. A seed may still draw a rectangle. Across seeds the outline changes.

- A room can be an L, a T, a U, or a ring. The floor is an orthogonal polygon stored as edge-connected rectangles that share one room id. The wall between those rectangles is removed.
- A room can sit inside other rooms. It does not have to touch the outer wall. One room can also wrap another, so the outer room is a U or a ring and the inner room has its own walls and its own door.
- Rooms in one building have different sizes and different proportions. A square room is allowed. A plan of equal squares is not.
- The building is that collection of rooms. Its outline can be a square, a longer rectangle, an L, an open atrium, or a combination. An atrium is outside: empty cells inside the bounding box, walled along the inner edge, with no floor and no door. The missing corner of an L is the same kind of empty. For this generator, cell `0` is legal inside the bounding box. The two current generators still fill their box.

### Program before geometry

Decide the rooms, their areas, and who shares a wall before placing a rectangle. Merrell, Schkufza, and Koltun, _Computer-Generated Residential Building Layouts_ (SIGGRAPH 2010), use that split for houses. We take the split. We do not take their learned search.

The program is data on the building type. `roomCount` is how many rooms it may spend. Target areas sum to the converted floor count, inside today's tolerance. Every room is still at least 3×3. If the next role cannot be paid for, generation fails.

Residential rooms are spent in this order:

| Role    | Spend when                                         | Target                                                                  | Where it may sit                                                            |
| ------- | -------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| living  | always                                             | the largest share of the floor the smaller roles do not take            | on the shell                                                                |
| hall    | `roomCount >= 2`                                   | about 12% of the floor, at least 3×3, longer than it is wide            | on the shell, and it takes the entrance. It does not run the full width     |
| bath    | `roomCount >= 3`, and a second after four bedrooms | 3×3                                                                     | interior allowed. Touches the hall or a bedroom. Does not take the entrance |
| bedroom | rooms left after living, hall, and baths           | one primary at about 1.5× each secondary. A secondary may be 3×3 or 3×4 | interior allowed when it touches the hall                                   |
| kitchen | a room remains after at least one bedroom          | a middle share, about 10–15%                                            | on the hall                                                                 |

A 4-room house is a living room, a hall, one bedroom, and one bath.

Commercial rooms are spent in this order:

| Role     | Spend when             | Target                                                                         | Where it may sit                                                        |
| -------- | ---------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| sales    | always                 | at least half the floor, and larger than each other room. This is the showroom | on the shell, and it takes the entrance. It may be the long arm of an L |
| restroom | `roomCount >= 2`       | 3×3. A second restroom only when several support rooms already exist           | interior allowed. Opens onto sales or staff                             |
| stock    | a support room is left | larger than staff, smaller than sales                                          | rear wall or interior                                                   |
| staff    | a support room is left | smaller than stock and smaller than sales                                      | off sales or stock                                                      |

A 4-room shop is a showroom, a restroom, stock, and staff. It does not share a skeleton with the house. The showroom is larger than the front bar that `adjacency-v1` gets by stretching one room's height.

### Outline, then rectangles, then an L

The seed picks a footprint before any room is placed. The solid cells are the floor budget. Walls stand wherever a solid cell meets an empty cell, including an atrium and the inner edges of an L.

- **Rectangle.** Still legal. The aspect comes from the profile. The rooms inside it are the program above, not a front bar and a row.
- **L.** Two rectangles that share a run. The missing corner stays empty.
- **Atrium.** An outer rectangle minus an inner rectangle. The hole does not touch the outer shell, and the floor around it is at least 3 tiles wide so a room can sit there.
- **Combination.** An L with an atrium in the thick arm, when the area can pay for the ring and both arms.

An orthogonal outline, including one with a hole, cuts into rectangles by extending each concave corner until the cut hits another wall. Fill those rectangles from the program so required neighbors share an edge and an interior role stays off the shell. A guillotine split inside that mask is enough. Rectangular duals, the [rectangular drawings](https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/rectangular.pdf) handbook chapter and [G2PLAN](https://onlinelibrary.wiley.com/doi/10.1111/cgf.14451), also place rectangles from a graph and they stop at rectangles. They are a way to place the pieces. They are not the room shape.

An L-shaped room is two of those rectangles with one room id and no wall between them. A ring is the same merge wrapped around an inner room or around an atrium. That is how a showroom becomes the long arm of an L, and how a bedroom can wrap a bath.

[Graph2Plan](https://doi.org/10.1145/3386569.3392391) (Hu et al., ACM Transactions on Graphics, 2020) and [House-GAN++](https://arxiv.org/abs/2103.02594) (Nauata et al., CVPR 2021) can draw non-rectangular rooms from a bubble diagram, trained on real plans. They show that a front bar plus a row is not how buildings are laid out. Black Friday does not train a model and does not take those datasets. The next planner asks a hosted chat model for a layout, and this service still checks the layout before it stamps a tile.

## LLM layout

With the header's **LLM** tab selected, Generate sends one chat turn. There is no chat header, no transcript, and no composer. The turn is two messages and nothing else: the system prompt, then the setup prompt. LuxNova's character-detail editor is that shape: a protocol system message rides with one user turn, and `onAssistantComplete` parses a fenced JSON tool. MatchDate's chat builds the same pair in `streamChatTurn` (`system` from the active prompt, then the user content, with history only when a thread has one). Black Friday sends no history. When the assistant text completes, the callback is `planOpenings`, then `rasterizeStruct`, then the existing Pixi view.

The model is MatchDate's default chat model, `deepseek/deepseek-v4-flash` (`DEFAULT_CHAT_MODEL_ID` in MatchDate `src/services/fal/models/chat/index.ts`). Registry id and OpenRouter slug are that same string. Black Friday registers Flash only. Pro, Aion, and Llama stay in MatchDate. There is no model picker on this turn.

The turn is browser `fetch`, copied from MatchDate `falClient.ts` and `chatService.ts`. Chat does not use `@fal-ai/client`.

| Piece    | Layout turn                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Key      | `VITE_FAL_KEY` from `import.meta.env`, read by `getFalApiKey`. Missing key throws `Missing VITE_FAL_KEY. Add it to your .env file.` before the request. `.env.example` is the one line from MatchDate. `.env` stays gitignored. |
| Header   | `Authorization: Key <key>`, `Content-Type` and `Accept` JSON. Fal's header is `Key`, not `Bearer`.                                                                                                                              |
| URL      | `POST https://fal.run/openrouter/router/openai/v1/chat/completions`                                                                                                                                                             |
| Body     | `{ model, messages, stream: true, response_format: { type: 'text' }, reasoning_effort: 'high', thinking: { type: 'enabled' } }`. `model` is `deepseek/deepseek-v4-flash`. `max_tokens` is omitted, the same as MatchDate, so thinking does not use up the reply. |
| Stream   | SSE lines `data: { choices[0].delta }`, ended by `data: [DONE]`, the same reader as MatchDate. `content` is the reply the parser accepts. OpenRouter sends thinking on `delta.reasoning` (and `reasoning_details`); `reasoning_content` is read too. That text is shown in the dialog log and is not part of the reply. A body that is one JSON object, with no `data:` lines, is read from `choices[0].message`. Malformed lines are skipped. Abort keeps whatever text arrived and does not apply it. |
| Messages | One `system` message (the layout system prompt), then one `user` message (the setup prompt). No prior turns and no second system message.                                                                                       |
| Tool     | A ` ```json ` fence in the assistant text. The request does not send OpenAI `tools`. The parser takes the last fence whose `tool` is `layout`.                                                                                  |

`response_format` stays `text` so the fence survives. DeepSeek's [JSON Output](https://api-docs.deepseek.com/guides/json_mode) mode (`json_object`) guarantees a JSON string and then replaces anything that is not JSON with spaces, which would delete the fence. OpenAI [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) (`json_schema`) are not the format this fal route documents for DeepSeek. The prompts do the work that mode would have done: the word `json`, a full example, and a schema the parser checks. This turn turns DeepSeek [thinking mode](https://api-docs.deepseek.com/guides/thinking_mode) on, at `reasoning_effort: 'high'`, so the model can decide the rooms from an open brief before it commits to coordinates. The chain comes back as `reasoning` on this fal route, beside `content`. The dialog log shows that chain as it arrives, the same way MatchDate appends each content chunk onto the assistant message. The parser reads `content` only. In thinking mode DeepSeek fixes temperature at 1.0, so this body omits `temperature`. `max_tokens` is omitted too, matching MatchDate, so the thinking tokens are not the whole reply. A truncated fence is a failed reply.

MatchDate's envelope is `{ "tool", "origin", "action", "id", "data" }`. Black Friday uses it. The layout is the document in `data`.

### What the two prompts are for

Published floor-plan prompts and the current API guides agree on the split. The system message holds the job, the geometry rules, the output schema, and one worked example. The user message holds this request.

- OpenAI's [prompt engineering guide](https://developers.openai.com/api/docs/guides/prompt-engineering) treats the developer message as the function and the user message as its arguments. [web.dev](https://web.dev/learn/ai/prompt-engineering) puts role, format, constraints, and examples in the system prompt, and the live variables in the user prompt.
- DeepSeek's [JSON Output](https://api-docs.deepseek.com/guides/json_mode) guide requires the word `json` and an example of the desired object in the system or user prompt, and enough output tokens that the object is not cut off. A content string that is empty or only spaces is a failed reply.
- [HouseLLM](https://arxiv.org/html/2411.12279v3) (Zong, Zhan, and Tan, 2024) splits the prompt into an initialization (role and output format) and a placement procedure (choose rooms, then place them, then size them), and it shows a demo layout. Thinking mode is where that procedure runs. The reply the parser keeps is the fence. HouseLLM's second phase is a diffusion refiner. This service does not add one. `layoutIssues` is the check.
- [Text-to-Layout](https://arxiv.org/html/2509.00543) (2025) expands every geometric rule into an explicit field constraint and then validates the JSON in code. Overlaps and a missed connection are rejected by the app.
- [ChatHouseDiffusion](https://arxiv.org/html/2410.11908) (2024) first pins rooms, types, and links, then draws. The model does that pinning from the brief, in the thinking channel, and the fence is the drawing. `planRoomProgram` stays on the ALGO path.

The setup is the brief and the seed. The brief is the building the player asked for: "Make me a mini-mall with a collection of stores and restaurants," or "Make me a posh mansion with 8 bedrooms, 2 baths and a study." The model chooses the square footage and the rooms that brief needs, then places them. The system prompt states the limits: the conversion to tiles, the 10% floor slack, the 3 by 3 minimum, the one-tile shell, and the 1024 cap. The player does not send a square footage or a room count. A brief that names counts keeps those counts. A brief that only says what kind of building it is gets the circulation and service rooms that kind needs: a concourse, showrooms, dining rooms, staff rooms, and restrooms for the mall; a hall, a living room, a kitchen, eight bedrooms, two baths, and a study for the mansion.

The prompts are source, the way MatchDate keeps `CHARACTER_SYSTEM_PROMPT` in `characterSystemPrompt.ts`. They are not a preset the player edits. The text below is what those constants should contain.

### Proposed system prompt

The prompt asks for three steps, in order, and the fence only at the end. Square footage and tile totals are not part of the task.

````text
You design one Black Friday building. The reply is one json fence and no other text. Coordinates come last.

1. Program. Read the brief and describe the building in words. A suburban house with three bedrooms is a hall the bedrooms and baths open onto, plus a living room and a kitchen. A shop or supermarket is a concourse, a showroom, stock, staff, and a restroom. A count in the brief is exact: three bedrooms means three bedroom rooms. Do not add a café, bakery, or extra bath unless the brief names it.

2. Circulation. Decide which rooms share a wall, and which room takes the entrance. A hall or concourse is how the private rooms are reached. The app cuts a door or a passage on each shared wall. You do not place door cells or passage cells.

3. Layout. Only now give each room a rectangle so that circulation is possible. Each room is one rectangle unless the brief asks for an L. Do not start from a square footage or a tile count, and do not revise the plan to hit one.

Coordinates: (0, 0) is the northwest corner of the bounding box. +x is east. +y is south. width and height include a one-tile shell, and each is an integer from 1 to 1024. Room rects are interior floor. They use integers, are at least 3 by 3, and sit at least one cell in from the box edge. Rooms do not overlap. Rooms that share a wall have exactly one empty tile between them. That gap is the wall. Do not list it in outside. outside is an atrium, a missing corner, or space you did not need. Leave that space. Do not grow rooms to fill it.

role is a short lowercase word. buildingType is residential for a house and commercial for a shop, mall, or restaurant. The entrance room touches the shell.

The fence is this envelope. id is the Seed line, copied unchanged. Omit square footage. The app records the floor you drew. roomCount is the number of rooms in the list.

```json
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
```

That example is only the fence shape: a hall and a living room that share one wall. A live brief supplies its own rooms.
````

### Setup prompt

The user message is the brief and the seed. It does not send a square footage, a room count, or a budget fence. The model chooses both, and the fence it returns reports them.

````text
Read the brief. First name the rooms and how people move through them. Then decide which rooms share a wall. Then write one json fence. Do not aim for a square footage or a tile count.

Brief: Make me a posh mansion with 8 bedrooms, 2 baths and a study.
Seed: sandbox-1
````

The same setup with a different brief asks for a different building: "Make me a mini-mall with a collection of stores and restaurants." The model answers with a concourse, showrooms, dining rooms, staff rooms, and restrooms, and sets `buildingType` to `commercial`. The mansion brief sets `buildingType` to `residential` and keeps the eight bedrooms, two baths, and study, plus a hall, a living room, and a kitchen.

The fence does not carry a target square footage. After a valid plan is stamped, `areaSquareFeet` is `round(floorTiles / 0.092903)` from the floor that was drawn, and `roomCount` is `rooms.length`. A claimed footage that does not match that floor is ignored. The LLM dialog is a brief. An empty brief is an error. ALGO still asks for square footage, room count, and residential or commercial.

### Accepting the reply

The parser reads this shape. The system-prompt example is the one that also meets the geometry rules.

```json
{
  "tool": "layout",
  "origin": "agent",
  "action": "create",
  "id": "<same seed>",
  "data": {
    "roomCount": 1,
    "width": 20,
    "height": 16,
    "buildingType": "residential",
    "outside": [{ "x": 1, "y": 1 }],
    "rooms": [
      {
        "id": "room-1",
        "role": "hall",
        "rects": [{ "x": 2, "y": 2, "width": 8, "height": 5 }]
      }
    ]
  }
}
```

`outside` lists the atrium and the missing corner of an L. Each room is one or more edge-connected rectangles. `role` is the brief's word for that room. `buildingType` on the fence selects doors or passages. The model does not emit tile ids, door cells, or wall cells. The app derives the shell and the shared walls from the rooms and `outside`, runs `planOpenings` for that building type, then `rasterizeStruct`. It records square footage from the floor it stamped. It does not parse the brief to count bedrooms. The prompt is what keeps a counted room in the plan. A reply that is prose only, empty or only spaces, the wrong tool, or invalid JSON is an error. `layoutIssues`, connectivity, and the 1024 cap still run. A failed check does not draw, and it does not fall back to `adjacency-v1`. The dialog can send the same two messages again. That retry is another sample, not a repair.

The seed in the setup is the fence `id` and the value stored on the map. It does not seed the sampler. Thinking mode runs at temperature 1.0, so the same brief can still return a different layout. `GeneratedMap` keeps the brief, the raw fence, and `generatorId: "llm-v1"` so a reload stamps that fence again and does not call fal. `bsp-v1` and `adjacency-v1` stay synchronous and do not read the key. Tests of the parser use fixture assistant text.

While the request is in flight the dialog stays open and shows that it is generating. Close aborts the fetch. If no map exists yet, the dialog stays up after the abort. A missing key is an error in the dialog, and the previous map stays.

## Phased plan

Each phase keeps the public `generate` method stable. Later phases replace a stage, not the map.

1. **Types.** Shapes are in `src/types/map.ts`. No generation yet. `layoutIssues` checks bounds, disjoint rooms, and that openings sit on wall cells. `gridIssues` checks the palette and the `Uint16Array` length.
2. **Footprint and rooms.** `generateBspLayout` in `src/services/mapGeneration/` is a seeded BSP. It returns rooms and one shared wall per cut. No tile ids. Floor area stays within `max(roomCount, 10%)` of the converted square footage. Each room is at least 3×3. The bounding box stays inside 1024×1024.
3. **Openings.** `planOpenings` cuts one opening per shared wall and adds one exterior entrance. Residential openings are doors. Commercial openings are passages, and the commercial entrance is on a long side. `roomsConnected` checks that every room is reachable. No tile ids yet.
4. **Struct rasterizer.** `generateMap` stamps the layout into a palette and a `Uint16Array`. Rooms and passages use the first `floor` struct, or `stamp.floor` when the request names one. Solid walls use `wall`. Door openings use `door`. Surfaces are not placed. `gridIssues` checks the palette. This is the first phase that returns a playable tile grid.
5. **Building-type graphs.** `generateAdjacencyLayout` (`adjacency-v1`) stays registered. For two or more rooms it builds the star above: residential rooms open off a hall, and commercial support rooms open off a sales floor. `planOpenings` prefers that south room for the entrance. `bsp-v1` stays available when the request sets `generatorId`. `program-v1` is the default.
6. **View.** The game pane mounts a Pixi canvas after Generate. The camera starts centered on that building. Drag pans a building larger than the pane and clamps to the box. The Rooms checkbox draws each room's type and id. The dialog defaults to 2,000 ft², 4 rooms, and residential. Player movement that reads `actAs.speed`, and the dead-zone follow that replaces drag, are still ahead. The generation service does not know about the camera.
7. **Dressing.** Surfaces, products, and triggers on floor cells. Out of scope until the algorithmic room shapes below are in the grid.
8. **Program.** `planRoomProgram` names the roles, target areas, aspect bands, and required neighbors from the tables above. A 4-room house is a hall, a living room, one bedroom, and a 3×3 bath. A 4-room shop is a showroom of at least half the floor, a 3×3 restroom, a larger stock room, and a smaller staff room. Areas sum to the converted floor count. A budget that cannot pay for those rooms is an error. `program-v1` is the caller.
9. **Outline.** `generateProgramLayout` (`program-v1`) picks rectangle, L, atrium, or a combination. Empty cells inside the bounding box are `layout.outside`: the 3×3 atrium, and the missing corner of an L. The floor count stays inside the area tolerance. `bsp-v1` and `adjacency-v1` stay registered.
10. **Pack.** The entrance room sits on the shell beside the largest other room. The remaining rooms stack in a column, or under the entrance room when the outline is an L. Required neighbors share a one-tile wall. The full-width front room is gone. A 4-room house still puts every room on the shell, because a rectangle buried on all four sides needs more neighbors than that plan has.
11. **Orthogonal rooms.** An atrium is cut out of the largest room, and that room's floor is stored as `parts` around the hole. `layoutIssues`, shared walls, `planOpenings`, and `rasterizeStruct` follow every rectangle. The rasterizer paints a wall on any empty cell that touches floor, including a diagonal touch, so the junction where three rooms meet and the inner corner of an L stay bricked. The ring around a court is that same wall. A court cell sits one wall away from the floor, so it stays empty. The Rooms overlay labels the room once, on its largest rectangle. A room that wraps another room is still ahead.
12. **ALGO default.** `program-v1` is what **ALGO** runs. A spread of seeds covers more than one outline. `adjacency-v1` and `bsp-v1` stay available by id. An interior room and a room shaped as an L on its own are still ahead.
13. **Env.** `.env.example` is `VITE_FAL_KEY=your-fal-api-key-here`. `.env` and `.env.local` stay gitignored. The developer copies the example to `.env` and pastes a fal key.
14. **Default chat model.** `src/services/fal/models/chat/` registers Flash only. `DEEPSEEK_V4_FLASH_ID` and `DEFAULT_CHAT_MODEL_ID` are `deepseek/deepseek-v4-flash`. `getChatModel()` with no argument returns that config. Pro, Aion, and Llama are not registered, and there is no picker.
15. **Fal chat client.** `getFalApiKey`, `getFalHeaders`, `formatFalHttpError`, and `falFetch` match MatchDate. `streamCompletion` posts to the same chat-completions URL with `Authorization: Key` and reads SSE the same way: `delta.content` for the reply, and `delta.reasoning` for the thinking MatchDate's reader skips. The layout call passes `model: DEFAULT_CHAT_MODEL_ID` and `thinking: true` (`reasoning_effort: 'high'`). It does not set `max_tokens`. The fence is built from `content` only. A missing key throws `Missing VITE_FAL_KEY. Add it to your .env file.` Abort drops the partial text. No `@fal-ai/client`. Tests stub the env and `fetch`.
16. **System and setup prompts.** `layoutSystemPrompt` asks for a room program, then circulation, then rectangles. It does not ask for a square footage. `layoutSetupPrompt(seed, brief)` is the brief and the seed. It does not send a budget. Tests assert the brief, the seed, the three steps, and that neither prompt mentions `areaSquareFeet` or `interiorTiles`.
17. **Accept the fence.** `acceptLayoutFence` parses the last closed `layout` fence into rooms, `outside`, `buildingType`, and a bounding box. `role` is whatever short word the model wrote. `areaSquareFeet` and `roomCount` on the fence are ignored. The map stores `round(floorTiles / 0.092903)` and `rooms.length`. The app derives shared walls, runs `planOpenings` for the fence's building type, and `rasterizeStruct`. It rejects a bad fence, an empty reply, a failed `layoutIssues`, a disconnected plan, a rect under 3×3, a floor cell on the shell, or a box past 1024. A floor that misses a claimed footage is still accepted. Fixture tests cover a rectangle, an L-room, an interior room, an atrium, a mansion room list, a mini-mall room list, and a mismatched footage. No live call.
18. **LLM Generate.** With the LLM tab selected, the dialog is a brief plus a 10rem log. Generate calls `generateLlmMap`. The log shows the thinking channel when the model sends one, and the reply otherwise. A fenced block is a collapsible section. The request is the system prompt plus the setup prompt. No transcript and no chat header. Success draws the map and leaves the dialog open so the log can be copied. Failure leaves the dialog open with the error and keeps the previous map. Close aborts. The dimmed backdrop and Escape do not dismiss the dialog. ALGO keeps `program-v1` and its square footage, rooms, and type fields.
19. **Replay.** The map stores `brief`, `rawFence`, and `generatorId: "llm-v1"`. `acceptLayoutFence` stamps that fence again and does not call fal. Dressing (phase 7) follows a trustworthy grid from either planner.
20. **Brief only.** The LLM dialog is a brief. The player types "Make me a mini-mall with a collection of stores and restaurants" or "Make me a posh mansion with 8 bedrooms, 2 baths and a study." That tab has no square-footage field and no room field. An empty brief is an error. ALGO still asks for square footage, rooms, and type. The typed brief is what `layoutSetupPrompt` sends, and it is what phase 19 stores.
21. **Play prompt.** During play, a later prompt can grow or restyle the building already on screen: a larger footage budget, a new brief, and the current layout fence go out as the setup. The same system prompt applies. Success replaces the grid. Failure leaves the current map. This phase waits until a map can be revised in place. LLM Generate does not include it.

## Generation service

Planned home: `src/services/mapGeneration/`. Planned types: `src/types/map.ts`. The service is a pure function plus a thin object so a later UI can call one thing.

```ts
generateMap(request: GenerateMapRequest): GenerateMapResult
```

`GenerateMapRequest` carries `MapParameters`, the `seed`, the struct catalog (or the three chosen tile ids), and an optional `generatorId`. The synchronous default is `program-v1`, which is what the header's **ALGO** tab runs. `adjacency-v1` and `bsp-v1` stay registered. `llm-v1` is asynchronous: the **LLM** tab calls `generateLlmMap` with the typed brief, streams one fal turn, and then `acceptLayoutFence`. Phase 21 is still ahead. An unknown id on `generateMap` is an error. Adding a generator means registering a new id. Callers that omit the id keep the synchronous default.

`GenerateMapResult` is either `{ ok: true, map: GeneratedMap }` or `{ ok: false, errors: string[] }`. Constraint failures and a catalog with no floor, wall, or required door are both results. An unknown `generatorId` is an error. Omitting it uses `program-v1`.

Stages, each replaceable:

1. `MapGenerator` turns parameters and a `RandomSource` into a `MapLayout` (footprint, rooms, shared walls). `program-v1` is the default. `adjacency-v1` and `bsp-v1` stay registered.
2. `OpeningPlanner` writes `Opening[]` onto that layout.
3. `StructRasterizer` writes cells from the layout and the chosen struct ids.

`GeneratedMap` stores the parameters, the seed, the generator id, the layout, the width and height, and the cells. Keeping the layout next to the cells lets a later tool explain why a door is where it is, and lets phase 5 change the planner without a new save format.

`RandomSource` is the only source of randomness: `next()`, `int(min, max)`, and `pick(items)`, all driven by the seed. Stages receive it. They do not call `Math.random`.

Cells are dense inside the bounding box and addressed as `y * width + x`. Storage is a `Uint16Array` of palette indexes, 2 bytes per cell. A 1024 × 1024 grid is about 2 MB. A JavaScript array of tile-id strings is the representation to avoid: a million strings is hundreds of megabytes, and catalog order would leak into saved maps. The palette on the map is the list of tile ids that grid uses, so a save does not depend on catalog order. `0` is outside the building. `cellAt` reads one index. If a future map is mostly exterior void, switch the storage to chunks behind that accessor.

Invariants the service checks before returning `ok: true`:

- `1 <= width <= 1024` and `1 <= height <= 1024`.
- For `program-v1`, `adjacency-v1`, and `bsp-v1`, interior floor cells, excluding walls, are within a small tolerance of `round(areaSquareFeet × 0.092903)`. Those generators cannot always hit the count exactly after integer splits. Record the achieved area on the map. `llm-v1` does not check a target. It records `areaSquareFeet` from the floor it drew.
- For `program-v1`, `adjacency-v1`, and `bsp-v1`, `rooms.length === roomCount` from the dialog. For `llm-v1`, `roomCount` is `rooms.length`. Interiors are disjoint, and each interior meets the minimum.
- Shared walls are one tile thick.
- Openings lie on a wall span they fully cover. Door openings are one tile. Passage openings are at least one tile.
- The room graph is connected.
- There is one exterior entrance.
- Every non-zero cell index is in range of `palette`. `palette[1]` is floor, `palette[2]` is wall, and `palette[3]` is door when the map has a door. A door cell uses the door index. A passage cell uses the floor index. Every other building cell is a wall. Index 0 is unused in `bsp-v1` and `adjacency-v1` because those footprints fill their bounding box. `program-v1` uses 0 for an atrium and for the missing corner of an L. Those cells are outside, and the wall along them is exterior.

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

interface RoomPart {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Room {
  id: string;
  /** Interior rectangle in tile coordinates. Excludes the surrounding wall. */
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Further floor rectangles for an L, a U, or a ring.
   * The fields above are the first rectangle. `bsp-v1` and `adjacency-v1` omit this.
   */
  parts?: RoomPart[];
  /**
   * Adjacency role, such as `hall`, `living`, or `sales`.
   * `llm-v1` uses the brief's word: `showroom`, `dining`, `bedroom`, `study`.
   * BSP leaves this unset.
   */
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
  /** Empty cells inside the box: an atrium, or the missing corner of an L. */
  outside?: TileCoord[];
}

interface GeneratedMap {
  parameters: MapParameters;
  seed: string;
  generatorId: string;
  /** The brief `llm-v1` laid out. Absent for the algorithmic generators. */
  brief?: string;
  /** The assistant fence `llm-v1` accepted. Replay stamps this and does not call fal. */
  rawFence?: string;
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

`BuildingTypeProfile` is data, not a branch buried in the splitter: target aspect, minimum interior, and which side prefers the entrance. Residential and commercial are the first two profiles. A new building type is a new profile plus a room program in the layout prompt. The `Room` above is one rectangle for `bsp-v1` and `adjacency-v1`. `program-v1` adds `parts` when a room wraps an atrium. The Rooms overlay labels the largest rectangle.

## Later, not in the service

The game pane reads the finished grid and does not call back into generation. The Sandbox dialog is the caller that asks for a new grid. Phase 21 is the later exception: a prompt during play can ask generation to grow or restyle the building already on screen. Drag moves the camera until a player exists. The player will then own the camera: movement reads `actAs.speed`, a dead zone in the middle of the pane delays scrolling, and the view still stops at the map edge.

Products (`purchase`), sale and hazard triggers, and `surface` shelves are a dressing pass on floor cells. They are catalog tiles the struct rasterizer must leave room for, and must not place.
