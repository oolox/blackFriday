# BF-legacy

Review of `legacy/`. This is a very old AngularJS 1.x app from 2015 (credits: Paul Cousineau, Summer Snover). It is reference only. The new React app does not run this code.

## What the app is

Black Friday is a top-down shopping game. The player moves a shopper through a store, grabs items on a shopping list, avoids other shoppers, and cashes out at a register.

A level is a fixed grid, usually 7×7 to 17×11, at 50 pixels per cell. The floor is drawn on a canvas. The player, products, objects, and rival shoppers are absolutely positioned images on top of that canvas.

Play loop:

1. A pregame screen walks through the rules, then **SHOP NOW** loads `maps/map0.json`.
2. A countdown plays `snd/readysetshop`.
3. A `setInterval` of 50ms steps rival shoppers, the player, and product respawns.
4. Arrow keys turn and move. Space stops the player and buys the product in the facing cell.
5. Touching a rival shopper kills the player. Any key reloads the current map. `numLives` is set to 3 and the intro says three lives, but nothing decrements it, so respawns are unlimited. `timesRespawned` is only a counter on the death screen.
6. Running onto a register cashes out. Every list item must already be in the cart. Score added is `levelBudget - levelTotal` (money left under budget). Extra items that were not still needed count as junk and still add to the total. Under budget plays `bigsavings`; at or over budget plays `overbudget`. A missing list item plays `buzzer` and does not finish the level.
7. `maxLevel` is 14, so the campaign is `map0` through `map14` (15 levels). Finishing map 14 sets game over. `map15.json` exists and is not part of that path.

Movement does not read an `actAs` string on floor tiles. A tile blocks when its `speed` is 0 (walls and shelves). Anything with `speed` above 0 is walkable, including doors and floors. Rival shoppers use `speed` to move, `random` as a chance to turn, and `buy` as a chance to grab an adjacent product and put it into a faded respawn state. Their `hp` is editable in the level editor and is never read during play.

Objects on the board do use `actAs`:

| `actAs` | Effect |
| --- | --- |
| `speed` | Coffee. Temporary speed buff. |
| `sale` | Discount on the next purchases. UI matches `0.25`, `0.5`, and `0.75`. |
| `slide` | Wet floor. Picks a new facing and keeps moving. |
| `slow` | Stopwatch. Slows rival shoppers. |
| `register` | Cash out. |

Products that are bought, or taken by a rival, go to state `respawn` (drawn faded) and return to `new` after their `spawn` delay.

The same page is also a level editor, shown when `gameRun` is false. `gameRun` starts `true`, so a normal load goes straight into play and hides the editor. The editor can resize the board, paint tiles, products, objects, shoppers, and the player, edit list quantities and budget, and **Save Level**. Save only `console.log`s the level JSON. It does not write a file. Load reads `maps/map{levelToLoad}.json` with jQuery `$.getJSON`.

## Stack

`legacy/index.html` is the real entry. It bootstraps `ng-app="blackFridayApp"` into `<div ng-view>`.

Scripts come from CDNs, not a package manifest:

- AngularJS 1.3.15 and `angular-route` 1.3.15
- jQuery 2.1.3 and jQuery UI 1.11.4
- Bootstrap 3.3.6
- Howler 1.1.28 (`new Howl({ urls: [...] })`)
- Google font Rancho

`legacy/js/app.js` declares module `blackFridayApp`, depends on `ngRoute` and `blackFridayApp.controllers`, and routes every URL to `partials/viewGame.html` with controller `gameCtrl`. There is one controller file, `legacy/js/controllers.js` (about 1,880 lines). There are no services, filters, or directives in the running app.

## Folders

| Folder | Role |
| --- | --- |
| `css/` | `blackFriday.css`. Layout and editor chrome on top of Bootstrap. Rancho is the body font. |
| `datasource/` | Catalog JSON. Definitions of the player, structural tiles, products, rival shoppers, and pickup objects. Loaded once at init. These are not the levels. |
| `js/` | `app.js` (module and route) and `controllers.js` (all game and editor behavior). Also a duplicate of the game view, `js/viewGame.html`, which the route does not use. |
| `maps/` | Hand-authored levels, `map0.json` through `map15.json`. Each file is a saved board plus the shopping list, budget, player start, and placed entities. |
| `partials/` | `viewGame.html` is the only template the route loads. `partial1.html` and `partial2.html` are leftover Angular seed views and are not routed. |
| `snd/` | Sound effects as matching `.mp3` and `.wav` pairs. Playback uses the `.mp3` files. |
| `sprites/` | 50×50-style PNG art for tiles, products, shoppers, the player, objects, and cash-out icons, plus `blackFridaySprites.zip`. |

Root files that are not part of a folder:

- `index.html` — running app. Includes a Facebook pixel.
- `index-async.html` — unused Angular seed. It bootstraps `myApp`, links `view1` / `view2`, and asks for `js/services.js`, `js/filters.js`, `js/directives.js`, and `css/app.css`, none of which exist.
- `jsmin.exe` — a JS minifier binary. Nothing in the app calls it.
- `sprites.zip` — archive of the sprite set. The live images are the loose PNGs in `sprites/`.

## Datasource files

Each catalog is an array of records. `id` is a string. `file` is a path relative to `legacy/`, such as `sprites/player1.png`. Maps copy these records and add position and runtime fields (`posObj`, `state`, `active`, `rotate`).

`posObj` is `{ tileX, tileY, offsetX, offsetY }`. Pixel position is `tile * 50 + offset`.

### `players.json`

The player definition. One record, Player 1.

- Sprites: `file` (walk), `shop` (buying), `dead`.
- `speed` is 5.
- `buffCtr` is the coffee-buff timer.
- Start tile is filled in by the map, not by this file.

### `struct.json` — the tiles the game actually loads

`loadTileSet()` requests `datasource/struct.json` and stores it as `tileSet`. The canvas paints `tileSet[tileArray[x][y]].file`. Cell ids in a map's `tileArray` are indexes into this list.

10 records: walls (`struct0`, `struct1`), floors (`struct2`–`struct4`), shelves (`struct5`, `struct6`), doors (`struct7`–`struct9`).

`actAs` is `wall`, `floor`, `shelf`, or `door`. Gameplay ignores that label and uses `speed`: 0 blocks, above 0 walks. Shelf and wall speeds are 0. Floor speeds are 10, 10, and 7. Door speed is 5.

### `tiles.json` — unused alternate catalog

Nothing loads this file. It is an older, larger tile list (floor, wall, door, coffee, 25/50/75% off, wet floor, shelf, register, stopwatch) pointing at `sprites/tile0.png` through `tile23.png`. Those PNGs are still in `sprites/`.

Two data bugs if this file is ever revived: id `"22"` is duplicated, and sale `ammount` values (`0.75`, `0.5`, `0.25`) are the opposite fraction from `objs.json` (those are the discount the UI and sale sounds expect).

### `products.json`

22 merchandise records, ids 0–21. Departments are `hardware`, `toy`, `clothing`, and `electronics`.

Fields: `name`, `department`, `file`, `cost`, `spawn` (ticks before a taken item returns), `height`, `width` (all 50).

Examples: Drill $90, Bear $10, TV $450, Robot $2400, Socks $10. `loadProductSet()` also builds `shoplistSet` from this catalog with `needed`, `inventory`, and `spent` starting at 0. A map then overwrites `shoplistSet` with its own quantities.

`sprites/productRandom.png` is the art for an editor "Random" paint tool. The controller checks `name == 'Random'`, but no catalog row has that name, so the tool is unreachable.

### `spawns.json`

10 rival shopper types. `file` is `sprites/shopper0.png` through `shopper9.png`.

| id | name | speed | random | hp | buy |
| --- | --- | --- | --- | --- | --- |
| 0 | White Trash | 4 | 4 | 5 | 2 |
| 1 | Baby Momma | 6 | 5 | 5 | 6 |
| 2 | Geiser | 2 | 0 | 3 | 1 |
| 3 | Vato | 5 | 2 | 7 | 5 |
| 4 | Shopaholic | 4 | 7 | 10 | 8 |
| 5 | Last Minute | 8 | 4 | 1 | 9 |
| 6 | Track Suit | 12 | 3 | 8 | 5 |
| 7 | Kids | 10 | 10 | 1 | 0 |
| 8 | Spinster | 1 | 8 | 4 | 2 |
| 9 | Bargin Hunter | 4 | 10 | 2 | 2 |

`random` and `buy` are chances out of 10. `hp` is unused at runtime. Kill sounds `snd/kill0`–`kill9` are chosen by this display name. Spinster maps to `kill9` and Bargin Hunter to `kill8`.

### `objs.json`

7 pickup / fixture records placed in `objArray` and indexed by `objMap`:

| id | name | actAs | ammount | sprite |
| --- | --- | --- | --- | --- |
| 0 | Coffee | speed | 2 | `obj0.png` |
| 1 | 25% Off | sale | .25 | `obj1.png` |
| 2 | 50% Off | sale | .50 | `obj2.png` |
| 3 | 75% Off | sale | .75 | `obj3.png` |
| 4 | Wet Floor | slide | .75 | `obj4.png` |
| 5 | Register | register | 0 | `obj5.png` |
| 6 | Stop Watch | slow | 0 | `obj6.png` |

Cash-out result icons are not in this file. The controller hardcodes `sprites/iconX.png` and `sprites/iconDollar.png`. `sprites/iconCheck.png` is unused.

## Maps

A map is one JSON object, not a tile-id grid alone. Fields written by `saveLevel` / read by `loadLevel`:

- `mapname`, `mapdesc`, `mapSpeed`
- `boardWidth`, `boardHeight`, and the pending size fields
- `tileArray` — 2D list of `struct.json` indexes
- `productArray`, `productMap`, `productId` — placed products and the cell-to-id index
- `objArray`, `objMap`
- `spawnArray`, `spawnId`
- `shoplistSet` — full catalog with `needed` quantities for this level
- `playerObj` — player record plus start `posObj`, `originX`, `originY`
- `levelBudget`

Only map 0 has a name and description: "Thrifty Threads Boutiq" / "Grab a new outfit for your shopping spree!" The other files have empty strings. Every map's `mapSpeed` is 3.

| Map | Size | Budget | Shoppers | Products | Objects | List |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 7×7 | 200 | 0 | 7 | 2 | T-Shirt, Jeans, Socks |
| 1 | 11×9 | 300 | 2 | 12 | 4 | Drill, TapeMeasure ×2, Hat |
| 2 | 7×11 | 1250 | 1 | 7 | 4 | Dress ×3, Jeans ×6 |
| 3 | 11×11 | 1000 | 2 | 18 | 4 | Hammer, Socks ×8 |
| 4 | 10×10 | 1500 | 2 | 12 | 4 | Ball ×2, Horsey, Telescope |
| 5 | 13×9 | 6000 | 3 | 10 | 8 | Boombox ×2, Computer, Headphones, Phone ×2, Robot |
| 6 | 13×9 | 2000 | 2 | 23 | 5 | Boombox, Computer, Headphones ×6 |
| 7 | 11×11 | 3000 | 2 | 36 | 5 | Bear ×8, T-Shirt ×6, Jeans ×10, Headphones ×5 |
| 8 | 9×9 | 7500 | 3 | 7 | 8 | Boombox, TV, Computer, Headphones, Phone, Robot |
| 9 | 11×11 | 3000 | 2 | 16 | 5 | Dress ×4, Jeans ×4 |
| 10 | 11×11 | 4000 | 3 | 12 | 9 | Toy Truck ×6, Telescope ×4 |
| 11 | 13×9 | 3000 | 4 | 20 | 13 | Socks ×42 |
| 12 | 15×7 | 7500 | 2 | 16 | 7 | Ball ×2, Computer, Robot, Blocks ×2, TapeMeasure ×2 |
| 13 | 11×11 | 1000 | 2 | 1 | 13 | Doll House |
| 14 | 17×11 | 8000 | 4 | 26 | 7 | Drill, Saw, Boombox, TV, Phone ×12, Horsey |
| 15 | 10×10 | 1000 | 0 | 1 | 1 | Bear (not in the campaign) |

## Sounds

`playSound` loads `.mp3` through Howler. The `.wav` copies are unused by the controller.

| Key | Files |
| --- | --- |
| `readysetshop` | `readysetshop` |
| `shop` | `shop0`, `shop1`, `shop2` (random) |
| `speed` | `coffee` |
| `sale` | `sale0` / `sale1` / `sale2` for 25% / 50% / 75% |
| `slide` | `slide` |
| `slow` | `slow` |
| `buzzer` | `buzzer` |
| `overbudget` | `overbudget` |
| `bigsavings` | `bigsavings` |
| `kill` | `kill0`–`kill9` by shopper name |

`snd/cashout.mp3` and `cashout.wav` are never played.

## What we take forward

This game will not be ported directly.

The new game is a new top-down game. It will reuse the sprites, and it will reuse the datasource after a refactor (catalogs separated from authored levels, unused files and duplicate ids cleaned up, `actAs` and amounts given one meaning). Maps will be created generatively instead of loaded from the hand-authored `maps/` JSON.
