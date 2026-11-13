// Recycle Run — content tables. Every fact here comes from docs/CONTENT.md (Station 7, plus Station 2-4 for
// which products are thermoforming / thermosetting).
window.RR = (function () {
  'use strict';
  // Resin identification codes (the number in the recycling triangle)
  const CODES = {
    1: { ab: 'PET', ex: 'drinks bottles' },
    2: { ab: 'HDPE', ex: 'milk bottles' },
    3: { ab: 'PVC', ex: 'pipes, window frames' },
    4: { ab: 'LDPE', ex: 'carrier bags, cling film' },
    5: { ab: 'PP', ex: 'yoghurt pots, caps' },
    6: { ab: 'PS', ex: 'foam cups, packaging' },
    7: { ab: 'OTHER', ex: 'e.g. PLA, acrylic' },
  };
  // [product, code, icon]
  const ITEMS = [
    ['DRINKS BOTTLE', 1, 'bottle'], ['WATER BOTTLE', 1, 'bottle'],
    ['MILK BOTTLE', 2, 'jug'], ['DETERGENT BOTTLE', 2, 'jug'],
    ['DRAIN PIPE', 3, 'pipe'], ['WINDOW FRAME', 3, 'frame'],
    ['CARRIER BAG', 4, 'bag'], ['CLING FILM', 4, 'roll'], ['SQUEEZY BOTTLE', 4, 'squeezy'],
    ['YOGHURT POT', 5, 'pot'], ['BOTTLE CAP', 5, 'cap'],
    ['FOAM CUP', 6, 'cup'], ['FOAM PACKAGING', 6, 'box'],
    ['PLA CUP', 7, 'cup'], ['ACRYLIC SIGN', 7, 'sign'],
  ];
  // Can it be recycled by remelting?  [product, polymer, thermoforming?, icon]
  const REMELT = [
    ['DRINKS BOTTLE', 'PET', true, 'bottle'], ['MILK BOTTLE', 'HDPE', true, 'jug'], ['YOGHURT POT', 'PP', true, 'pot'],
    ['DRAIN PIPE', 'PVC', true, 'pipe'], ['ACRYLIC SIGN', 'acrylic', true, 'sign'], ['PACKAGING TRAY', 'HIPS', true, 'tray'],
    ['MELAMINE PLATE', 'melamine formaldehyde', false, 'plate'], ['PLUG SOCKET', 'urea formaldehyde', false, 'socket'],
    ['LIGHT SWITCH', 'urea formaldehyde', false, 'socket'], ['SAUCEPAN HANDLE', 'phenol formaldehyde', false, 'handle'],
    ['CIRCUIT BOARD', 'epoxy resin', false, 'pcb'], ['BOAT HULL', 'polyester resin', false, 'hull'],
  ];
  // Recycling process, in order (then: new granules -> new products)
  const STEPS = [['COLLECT', ''], ['SORT', 'by code'], ['WASH', ''], ['SHRED', 'into flakes'], ['MELT', '']];
  // Compost run: biopolymers vs oil-based polymers
  const BIO = [['PLA CUP', 'cup', 'corn starch'], ['POTATOPAK TRAY', 'tray', 'potato starch']];
  const NOTBIO = [['FOAM CUP', 'cup'], ['CARRIER BAG', 'bag'], ['DRINKS BOTTLE', 'bottle'], ['YOGHURT POT', 'pot'], ['CLING FILM', 'roll'], ['MILK BOTTLE', 'jug']];
  // Eco quiz: [question, right, wrong]
  const ECO = [
    ['CRUDE OIL IS...', 'FINITE', 'RENEWABLE'],
    ['MOST OIL-BASED POLYMERS ARE...', 'NOT BIODEGRADABLE', 'BIODEGRADABLE'],
    ['IN LANDFILL OR THE OCEAN THEY LAST...', 'HUNDREDS OF YEARS', 'A FEW WEEKS'],
    ['TINY PLASTIC BITS THAT HARM WILDLIFE', 'MICROPLASTICS', 'MONOMERS'],
    ['BURNING WASTE TO MAKE ELECTRICITY', 'INCINERATION', 'COMPOSTING'],
    ['INCINERATION RELEASES...', 'CO₂', 'OXYGEN'],
    ['PLA IS MADE FROM...', 'CORN STARCH', 'CRUDE OIL'],
    ['POTATOPAK IS MADE FROM...', 'POTATO STARCH', 'CRUDE OIL'],
    ['THERMOSETS CAN BE GROUND UP AS...', 'FILLERS', 'NEW BOTTLES'],
    ['RECYCLED PET BOTTLES CAN BECOME...', 'FLEECE JACKETS', 'PLUG SOCKETS'],
    ['BIOPOLYMERS ARE MADE FROM...', 'PLANTS', 'CRUDE OIL'],
    ['ONLY THESE CAN BE REMELTED', 'THERMOFORMING', 'THERMOSETTING'],
  ];
  return { CODES, ITEMS, REMELT, STEPS, BIO, NOTBIO, ECO };
})();
