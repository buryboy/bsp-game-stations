// data.js — every fact the game shows (from docs/CONTENT.md, Station 5). Machines are listed in lap order from the start line.
export const MACHINES = [
  { id: 'inj', s: 95.2, side: 1, col: '#aab6e8', name: 'Injection moulding', form: 'granules',
    how: ['Granules from a hopper are heated,', 'a screw injects them under pressure', 'into a closed mould'], makes: 'bottle caps, toy bricks, phone casings' },
  { id: 'ext', s: 116.4, side: -1, col: '#bfe7da', name: 'Extrusion', form: 'granules',
    how: ['A screw pushes melted polymer', 'through a shaped die, non-stop:', 'long lengths, constant cross-section'], makes: 'pipes, guttering, window frames' },
  { id: 'blow', s: 125.8, side: -1, col: '#dbe3f6', name: 'Blow moulding', form: 'HDPE, PET',
    how: ['A soft tube (parison) is clamped', 'in a mould, then air is blown in', 'to inflate it to the mould shape'], makes: 'drinks, milk & shampoo bottles' },
  { id: 'vac', s: 6, side: -1, col: '#ffd9cf', name: 'Vacuum forming', form: 'HIPS / acrylic sheet',
    how: ['Sheet heated until soft, mould raised,', 'air sucked out: sheet pulled over it', 'Moulds need draft angles'], makes: 'packaging trays, blister packs, masks' },
  { id: 'line', s: 15.5, side: -1, col: '#e7d6c9', name: 'Line bending', form: 'acrylic / HIPS sheet',
    how: ['A strip heater softens the sheet', 'along a straight line,', 'then it is bent (often on a jig)'], makes: 'phone stands, display stands, brackets' },
  { id: 'laser', s: 25, side: -1, col: '#eef1fa', name: 'Laser cutting', form: 'acrylic sheet',
    how: ['A laser beam cuts or engraves sheet', 'following a CAD drawing (CAM)'], makes: 'signs, keyrings, jewellery' },
  { id: 'print', s: 46, side: 1, col: '#c4ecd6', name: '3D printing (FDM)', form: 'PLA / ABS filament',
    how: ['Filament is melted and laid down', 'layer by layer from a CAD model'], makes: 'prototypes, one-off parts' },
  { id: 'roto', s: 55.4, side: 1, col: '#cfc6ea', name: 'Rotational moulding', form: 'powder',
    how: ['Polymer powder in a hollow mould', 'is heated and rotated in two axes'], makes: 'large hollow products: kayaks, traffic cones' },
  { id: 'comp', s: 76.4, side: 1, col: '#c8cdea', name: 'Compression moulding', form: 'thermosetting',
    how: ['A measured amount of thermosetting', 'powder is pressed in a heated mould', 'and sets'], makes: 'melamine plates, UF plug sockets' },
];

// job tickets. lv 1 = first minute, lv 2 = added later. [product, plural, machine]
export const PRODUCTS = [
  ['bottle cap', 'bottle caps', 'inj', 1], ['toy brick', 'toy bricks', 'inj', 1], ['phone casing', 'phone casings', 'inj', 2], ['remote control casing', 'remote control casings', 'inj', 2], ['chair', 'chairs', 'inj', 2],
  ['pipe', 'pipes', 'ext', 1], ['guttering', 'guttering', 'ext', 2], ['window frame', 'window frames', 'ext', 2], ['cable insulation', 'cable insulation', 'ext', 2], ['rod', 'rods', 'ext', 2],
  ['drinks bottle', 'drinks bottles', 'blow', 1], ['milk bottle', 'milk bottles', 'blow', 1], ['shampoo bottle', 'shampoo bottles', 'blow', 2],
  ['packaging tray', 'packaging trays', 'vac', 1], ['blister pack', 'blister packs', 'vac', 2], ['mask', 'masks', 'vac', 2], ['chocolate box insert', 'chocolate box inserts', 'vac', 2],
  ['phone stand', 'phone stands', 'line', 1], ['display stand', 'display stands', 'line', 2], ['bracket', 'brackets', 'line', 2],
  ['sign', 'signs', 'laser', 1], ['keyring', 'keyrings', 'laser', 2], ['jewellery', 'jewellery', 'laser', 2],
  ['prototype', 'prototypes', 'print', 1], ['one-off part', 'one-off parts', 'print', 2],
  ['kayak', 'kayaks', 'roto', 1], ['traffic cone', 'traffic cones', 'roto', 1], ['water tank', 'water tanks', 'roto', 2], ['playground slide', 'playground slides', 'roto', 2],
  ['melamine plate', 'melamine plates', 'comp', 1], ['UF plug socket', 'UF plug sockets', 'comp', 2],
].map(([p, pl, m, lv]) => ({ p, pl, m, lv }));

// level 3: process clues instead of products
export const CLUES = [
  ['Granules injected under pressure into a closed mould', 'inj'], ['Hopper → heated → screw → closed mould', 'inj'],
  ['Pushed through a shaped die: constant cross-section', 'ext'], ['Long lengths made continuously', 'ext'],
  ['Air blown into a parison or preform', 'blow'],
  ['Heated sheet, air sucked out over a mould', 'vac'], ['Mould needs draft angles & rounded corners', 'vac'],
  ['Strip heater softens sheet along a straight line', 'line'],
  ['Beam cuts or engraves sheet from a CAD drawing', 'laser'],
  ['Filament melted, laid down layer by layer', 'print'],
  ['Powder heated and rotated in two axes', 'roto'], ['Large hollow products from powder', 'roto'],
  ['Thermosetting powder pressed in a heated mould', 'comp'],
].map(([clue, m]) => ({ clue, m, lv: 3 }));
