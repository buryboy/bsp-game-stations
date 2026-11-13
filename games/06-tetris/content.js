// Station 6 content — every fact here comes from docs/CONTENT.md, Station 6 (plus process facts from Station 5).
// cat: 0 additive, 1 stock form, 2 finish
window.STICKERS = [
  { name: 'PLASTICISER', cat: 0, code: 'PL', learn: 'Makes it more flexible and softer' },
  { name: 'UV STABILISER', cat: 0, code: 'UV', learn: 'Stops it going brittle or fading in sunlight' },
  { name: 'FILLER', cat: 0, code: 'FI', learn: 'Bulks it up and reduces cost (chalk, wood flour)' },
  { name: 'FLAME RETARDANT', cat: 0, code: 'FR', learn: 'Makes it less flammable' },
  { name: 'PIGMENT', cat: 0, code: 'PG', learn: 'Gives colour all the way through' },
  { name: 'ANTISTATIC AGENT', cat: 0, code: 'AS', learn: 'Reduces static, so dust does not stick' },
  { name: 'BIODEGRADABLE ADDITIVE', cat: 0, code: 'BD', learn: 'Helps it break down faster' },
  { name: 'GRANULES', cat: 1, code: 'GR', learn: 'For injection moulding and extrusion' },
  { name: 'POWDER', cat: 1, code: 'PW', learn: 'For rotational and compression moulding' },
  { name: 'SHEET', cat: 1, code: 'SH', learn: 'e.g. 3 mm acrylic: laser cutting, vacuum forming' },
  { name: 'FILAMENT', cat: 1, code: 'FL', learn: 'For 3D printing' },
  { name: 'SELF-FINISHING', cat: 2, code: 'SF', learn: 'Colour goes right through, the mould gives the surface: no paint!' },
  { name: 'FILE › WET & DRY › POLISH', cat: 2, code: 'AE', learn: 'How to finish acrylic edges, in that order' },
  { name: 'VINYL DECALS', cat: 2, code: 'VD', learn: 'Add graphics (or printing, screen printing)' },
];
window.CATS = [
  { name: 'ADDITIVE', col: '#e2231a' },
  { name: 'STOCK FORM', col: '#1f5fbf' },
  { name: 'FINISH', col: '#ffd51f' },
];
// a = index of the matching sticker. learn: the example shown with that sticker in LEARN.
window.ORDERS = [
  { t: 'Garden chair keeps going brittle in the sun!', a: 1, learn: true },
  { t: 'Window frame is fading in the sunlight!', a: 1 },
  { t: 'Make rigid PVC flexible for cable insulation', a: 0, learn: true },
  { t: 'This polymer needs to be softer and bend more', a: 0 },
  { t: 'Bulk it up with chalk to cut the cost', a: 2 },
  { t: 'Make it cheaper using wood flour', a: 2, learn: true },
  { t: 'Electrical casing must be less flammable', a: 3, learn: true },
  { t: 'Furniture foam must not catch fire easily', a: 3 },
  { t: 'Colour all the way through, not just on the surface', a: 4, learn: true },
  { t: 'Stop dust sticking to electronics packaging', a: 5, learn: true },
  { t: 'Help this polymer break down faster', a: 6, learn: true },
  { t: 'Feed the injection moulding machine', a: 7, learn: true },
  { t: 'Feed the extruder to make a pipe', a: 7 },
  { t: 'Rotational moulding a kayak', a: 8, learn: true },
  { t: 'Load the compression moulding press', a: 8 },
  { t: 'Laser cut a sign from 3 mm acrylic', a: 9, learn: true },
  { t: 'Vacuum form a packaging tray', a: 9 },
  { t: 'Feed the 3D printer', a: 10, learn: true },
  { t: 'Sawn acrylic edges look rough: finish them!', a: 12, learn: true },
  { t: 'Get a shiny polished edge on acrylic', a: 12 },
  { t: 'No paint needed: the mould gives the gloss', a: 11, learn: true },
  { t: 'Add a logo graphic to the product', a: 13, learn: true },
];
// LEARN order: sticker index sequence
window.LEARN_SEQ = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
