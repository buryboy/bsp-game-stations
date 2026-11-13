// Plastic Fantastic — content. Every line here is checked against docs/CONTENT.md, Station 3 table.
// Suspects = the six AQA thermoforming polymers.
window.NOIR_DATA = (function () {
  const SUSPECTS = [
    {
      id: 'ACRYLIC', full: 'Acrylic (PMMA)', nick: '"The Glass Act"', num: 'PMMA',
      props: ['Stiff, hard and GLOSSY', 'Edges can be POLISHED', 'Shatter-resistant: safer than glass', 'Weakness: SCRATCHES easily'],
      uses: ['Signs, display stands, shop windows', 'Car rear lights, baths', 'School laser-cut projects'],
      alibis: [
        'Me? I\'m all gloss, sweetheart. Polish my edges and I shine.',
        'Bounce a football off me. I won\'t shatter. Safer than glass.',
        'Just don\'t scrub me with a scourer. I scratch easy.',
      ],
      real: 'Wrong number, detective. I\'m ACRYLIC: glossy signs, shop windows, car rear lights.',
    },
    {
      id: 'HIPS', full: 'High impact polystyrene', nick: '"Vacuum" Vinnie', num: 'HIPS',
      props: ['Rigid, lightweight and CHEAP', 'Good IMPACT strength', 'Easy to VACUUM FORM'],
      uses: ['Vacuum-formed packaging trays', 'Toys, model making', 'Casings'],
      alibis: [
        'Heat me up, suck the air out, I hug the mould. Vacuum forming. It\'s a living.',
        'Cheap, rigid, lightweight. Nobody suspects the cheap ones.',
        'Knock me about all you like. HIGH IMPACT, see?',
      ],
      real: 'Not my style. I\'m HIPS: cheap vacuum-formed trays, toys and model kits.',
    },
    {
      id: 'HDPE', full: 'High density polythene', nick: '"The Milkman"', num: 'HDPE',
      props: ['Hard, stiff and tough', 'EXCELLENT chemical resistance', 'Food safe'],
      uses: ['MILK & DETERGENT bottles', 'Buckets, bowls, crates', 'Chopping boards'],
      alibis: [
        'Bleach, detergent... I hold the nasty stuff all day. Excellent chemical resistance.',
        'I deliver the milk, every morning. Food safe, see?',
        'Buckets, crates, chopping boards. Hard, stiff and tough. That\'s me.',
      ],
      real: 'You got the wrong guy. I\'m HDPE: milk bottles, buckets, crates, chopping boards.',
    },
    {
      id: 'PP', full: 'Polypropylene', nick: 'Polly "Hinges"', num: 'PP',
      props: ['Tough, FLEXIBLE, lightweight', 'Good chemical & HEAT resistance', 'Food safe', 'Makes LIVING HINGES'],
      uses: ['Flip-top bottle caps', 'Food containers, kitchen & medical kit', 'Rope, garden chairs'],
      alibis: [
        'Bend me a thousand times. I never snap. Living hinge, honey.',
        'I can take the heat in the kitchen. Food safe, too.',
        'Garden chairs, rope... I\'m tough AND flexible.',
      ],
      real: 'Not me, copper. I\'m PP: flip-top caps, food containers, rope, garden chairs.',
    },
    {
      id: 'PVC', full: 'Polyvinyl chloride', nick: '"Sparky" Vinyl', num: 'PVC',
      props: ['Rigid and tough', 'Flexible when PLASTICISED', 'WEATHER resistant', 'Good electrical INSULATOR'],
      uses: ['Drain pipes, guttering', 'Window frames', 'CABLE INSULATION (flexible PVC)'],
      alibis: [
        'I wrap the wires. Good electrical insulator. No sparks on my watch.',
        'Rain, frost, sun... I\'m weather resistant. Drain pipes, window frames.',
        'I\'m rigid. Add a plasticiser and I go all flexible.',
      ],
      real: 'Check your facts. I\'m PVC: drain pipes, guttering, window frames, cable insulation.',
    },
    {
      id: 'PET', full: 'Polyethylene terephthalate', nick: 'Petey "Fizz"', num: 'PET',
      props: ['Tough, lightweight, CLEAR', 'Good BARRIER to gas & moisture', 'EASILY RECYCLED'],
      uses: ['FIZZY DRINKS & water bottles', 'Food packaging', 'Fleece fibres'],
      alibis: [
        'I keep the fizz in. Good barrier to gas, see?',
        'Clear as a bell and light as a feather. Tough too.',
        'Recycle me and I come back as a fleece. Easily recycled.',
      ],
      real: 'Not guilty. I\'m PET: fizzy drinks bottles, water bottles, fleece fibres.',
    },
  ];

  // lvl 1 = names the product; lvl 2 = leans on properties. `why` is the one-line fact shown when it is solved or revealed.
  const CASES = [
    // ---- PP
    { ans: 'PP', lvl: 1, title: 'THE HINGE JOB', lines: ['A flip-top shampoo cap.', 'Opened 5,000 times.', 'Never once snapped.'], q: 'Who made the hinge?', head: 'PP NABBED IN HINGE CAPER', why: 'Polypropylene makes living hinges' },
    { ans: 'PP', lvl: 1, title: 'THE GARDEN PARTY', lines: ['A garden chair, left out', 'after the party.', 'Lightweight, tough, a bit flexible.'], q: 'Who sat in it?', head: 'POLYPROPYLENE TAKES A SEAT', why: 'PP: tough, flexible, lightweight' },
    { ans: 'PP', lvl: 2, title: 'THE HOT LUNCH', lines: ['A food container of hot soup.', 'It took the heat.', 'Food safe. Lid bends on a hinge.'], q: 'Who held the soup?', head: 'PP TAKES THE HEAT', why: 'PP: heat resistant, food safe, living hinge' },
    { ans: 'PP', lvl: 2, title: 'THE ROPE TRICK', lines: ['A rope on a fishing boat.', 'Lightweight and flexible.', 'Tough as old boots.'], q: 'Who tied the knot?', head: 'PP SKIPS TOWN ON A ROPE', why: 'PP is used for rope: tough & flexible' },
    // ---- HDPE
    { ans: 'HDPE', lvl: 1, title: 'THE MILK RUN', lines: ['A milk bottle on the step.', 'Food safe.', 'Hard, stiff and tough.'], q: 'Who delivered it?', head: 'MILKMAN HDPE BOTTLED UP', why: 'HDPE: milk bottles, food safe' },
    { ans: 'HDPE', lvl: 1, title: 'THE BLEACH STAIN', lines: ['A detergent bottle full of', 'harsh cleaner. Not a mark on it.', 'Excellent chemical resistance.'], q: 'Who held the bleach?', head: 'HDPE CLEANS UP', why: 'HDPE has excellent chemical resistance' },
    { ans: 'HDPE', lvl: 2, title: 'THE CHOPPING BLOCK', lines: ['A kitchen chopping board.', 'Hard and stiff.', 'Food safe.'], q: 'Who took the chop?', head: 'HDPE ON THE CHOPPING BLOCK', why: 'HDPE: chopping boards, hard & food safe' },
    { ans: 'HDPE', lvl: 2, title: 'THE CRATE ESCAPE', lines: ['A stack of crates and buckets', 'at the docks.', 'Hard, stiff and tough.'], q: 'Who stacked them?', head: 'CRATE ESCAPE FOILED: HDPE HELD', why: 'HDPE: buckets, crates, bowls' },
    // ---- PVC
    { ans: 'PVC', lvl: 1, title: 'THE LIVE WIRE', lines: ['Insulation round a cable.', 'It must bend and stop', 'electricity getting out.'], q: 'Who wrapped the wire?', head: 'PVC CAUGHT RED-HANDED', why: 'Flexible PVC: good electrical insulator' },
    { ans: 'PVC', lvl: 1, title: 'THE FRAME-UP', lines: ['A plastic window frame.', 'Rigid and tough.', 'Weather resistant, rain or shine.'], q: 'Who framed the window?', head: 'PVC FRAMED!', why: 'PVC: rigid, weather resistant window frames' },
    { ans: 'PVC', lvl: 2, title: 'THE GUTTER RAT', lines: ['Guttering on a rooftop.', 'Rain, frost and sun,', 'year after year.'], q: 'Who\'s in the gutter?', head: 'GUTTER RAT IS PVC', why: 'PVC is weather resistant: guttering' },
    { ans: 'PVC', lvl: 2, title: 'THE BENDY ALIBI', lines: ['Normally rigid.', 'A plasticiser was added', 'to make it flexible.'], q: 'Who went soft?', head: 'PLASTICISED PVC CONFESSES', why: 'PVC is flexible when plasticised' },
    // ---- ACRYLIC
    { ans: 'ACRYLIC', lvl: 1, title: 'THE SHOP WINDOW', lines: ['A glossy shop sign.', 'Polished edges.', 'Hit by a football: no shatter.'], q: 'Who made the sign?', head: 'ACRYLIC: SAFER THAN GLASS', why: 'Acrylic: glossy, shatter-resistant signs' },
    { ans: 'ACRYLIC', lvl: 1, title: 'THE TAIL-LIGHT TAIL', lines: ['A red car rear light.', 'Coloured, see-through, glossy.', 'Stiff and hard.'], q: 'Who\'s tailing us?', head: 'ACRYLIC LIT UP', why: 'Acrylic: car rear lights' },
    { ans: 'ACRYLIC', lvl: 2, title: 'THE BATHTUB BLUES', lines: ['A shiny, glossy bath.', 'Hard and stiff...', 'but scratched by a scourer.'], q: 'Who\'s in the tub?', head: 'ACRYLIC IN HOT WATER', why: 'Acrylic is glossy but scratches easily' },
    { ans: 'ACRYLIC', lvl: 2, title: 'THE LASER JOB', lines: ['A school project, laser cut.', 'Coloured sheet, edges', 'polished to a shine.'], q: 'Who got cut?', head: 'ACRYLIC SHINES IN DT', why: 'Acrylic: laser cut, edges polish up' },
    // ---- HIPS
    { ans: 'HIPS', lvl: 1, title: 'THE TOY TRAY', lines: ['A cheap packaging tray', 'for a toy car.', 'Vacuum formed.'], q: 'Who formed the tray?', head: 'HIPS IN VACUUM PLOT', why: 'HIPS is easy to vacuum form' },
    { ans: 'HIPS', lvl: 1, title: 'THE MODEL VILLAGE', lines: ['A model maker\'s kit.', 'Rigid, lightweight sheet.', 'Cheap as chips.'], q: 'Who built it?', head: 'HIPS MODEL CITIZEN', why: 'HIPS: model making, cheap & rigid' },
    { ans: 'HIPS', lvl: 2, title: 'THE CHOCOLATE BOX', lines: ['The tray inside a box', 'of chocolates.', 'Heated sheet sucked onto a mould.'], q: 'Who\'s in the box?', head: 'SWEET DEAL FOR HIPS', why: 'HIPS: vacuum-formed packaging trays' },
    { ans: 'HIPS', lvl: 2, title: 'THE TOY BOX', lines: ['A cheap plastic toy.', 'Dropped 100 times,', 'good impact strength.'], q: 'Who survived the drop?', head: 'HIGH IMPACT FOR HIPS', why: 'HIPS: good impact strength, toys' },
    // ---- PET
    { ans: 'PET', lvl: 1, title: 'THE FIZZY LIFTING', lines: ['A fizzy drinks bottle.', 'Clear. The fizz', 'can\'t escape.'], q: 'Who kept the fizz in?', head: 'PET KEEPS A LID ON IT', why: 'PET: good barrier to gas' },
    { ans: 'PET', lvl: 1, title: 'THE FLEECE CAPER', lines: ['A fleece jacket made', 'from old bottles.', 'Easily recycled.'], q: 'Who was it before?', head: 'PET FLEECED!', why: 'PET is easily recycled into fleece' },
    { ans: 'PET', lvl: 2, title: 'THE WATER JUMP', lines: ['A water bottle.', 'Lightweight, tough, clear.', 'Keeps the moisture in.'], q: 'Who holds the water?', head: 'PET WON\'T LEAK', why: 'PET: barrier to gas & moisture' },
    { ans: 'PET', lvl: 2, title: 'THE SALAD BOX', lines: ['Clear food packaging', 'for a salad.', 'Moisture stays in.'], q: 'Who packed lunch?', head: 'PET WRAPPED UP', why: 'PET: clear food packaging' },
  ];

  const TRAINING = { ans: 'PP', lvl: 0, title: 'TRAINING: THE HINGE JOB', lines: ['A flip-top shampoo cap.', 'Opened 5,000 times.', 'Never snapped.'], q: 'Who made the hinge?', head: 'PP NABBED IN HINGE CAPER', why: 'Polypropylene makes living hinges' };

  return { SUSPECTS, CASES, TRAINING };
})();
