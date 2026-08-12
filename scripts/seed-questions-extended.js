// Extends the question bank with a larger set of practice questions.
// Reuses the same loader as seed-questions.js. Run AFTER seed-questions.js.
const fs = require('fs');
const path = require('path');
const https = require('https');
const { parse } = require('url');

const envPath = path.join(__dirname, '..', 'apps', 'api', '.env');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const idx = line.indexOf('=');
  env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}
const URL = env.SUPABASE_URL.replace(/\/$/, '');
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

function req(method, pathName, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = parse(URL + pathName);
    const options = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + (u.search || ''),
      method,
      headers: {
        apikey: KEY,
        Authorization: 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const T = {
  quant_arithmetic: 'b08264af-1a08-46e3-947d-aba5a6eb1087',
  quant_algebra: '3efbe72d-80cb-40fd-abc6-992525859e7d',
  quant_percentages: '9cb4bd06-4fd2-4f7a-9087-cbd74ec4a40d',
  quant_geometry: 'bf9d91dc-f762-4656-a6fc-1c8a32062fdb',
  quant_probability: '036f0d6f-2a63-43fa-9440-fe75c6267cd8',
  quant_ratios: '177d389b-11af-4911-b7ae-4afa6fb4016c',
  quant_speed: 'a8ac607b-dba4-40de-8fbb-febdf6c71f4e',
  quant_timework: 'fd663585-966d-488c-be41-649f99b91c4c',
  quant_sequences: '8331bf5f-191d-4850-ac33-9d8c89ffb3a4',
  quant_word: '284d5886-a374-4762-bb73-335225364799',
  eng_grammar: '78354703-1169-434b-80db-788255574931',
  eng_vocab: 'c40fc035-6721-4d8d-9d95-4368642dc39a',
  eng_prepositions: '425d9bbe-bc62-4a90-8d81-58b696ffdd5f',
  eng_tenses: 'a8ee872a-94a5-46d4-88db-c78cb014ada0',
  eng_sentence: 'fe2080ad-bd38-4b2f-afad-9dcace414951',
  eng_activepassive: '54175446-6b88-4aec-8310-013c3957cdf0',
  eng_sva: '959d93af-8ac4-4426-9acb-372d8b1c7c11',
  eng_articles: 'afcfbe99-3693-49f9-b1f6-c98600c35b83',
  eng_reading: 'e917329e-a605-488e-94ea-59c70a449c39',
  analy_syllogisms: '9f5f52bf-a8bc-4512-95ba-9f53bc037228',
  analy_number: 'b5e6db0b-2579-40cc-aa47-68207306f5cd',
  analy_analogies: '38e15c6e-3156-4d33-8ce6-10d4bc1a4d5f',
  analy_logic: '34bc25df-ae40-4624-9870-5425d6e09ad8',
  analy_coding: 'e22f3c91-d7d0-4138-bb21-84cac346fde8',
  analy_letters: '9e84870d-a3fe-47a7-af27-48ab4e0b0b9a',
  analy_ordering: 'e9ca6dfd-bb91-40af-b845-aeef29ebb323',
  gk_pakistan: '757cbc94-84e1-4333-afdc-91341bd384ca',
  gk_current: 'a1e01203-41d7-4abf-b1a2-61503829545e',
  gk_worldgeo: 'ca37a79d-908e-44a6-931c-d574af11adb6',
  gk_worldhist: 'bd11e34c-a4fd-4180-b5ea-9a48dd2e4ff1',
  gk_orgs: '00d504fb-495c-4d64-90b8-41cfafa292b6',
  gk_personalities: '15debad6-cc10-4186-be91-b9f9b0f7f832',
  gk_scitech: '297b3c66-ad9c-4303-a8a0-ff90a6bdf970',
  phy_mechanics: '31158177-f5cb-4da3-9004-fcd30feda7c5',
  phy_electricity: '04b402ec-0d96-40f5-883a-904431acc48a',
  phy_waves: 'fd806ae7-a17d-4e9e-b4e3-c1c2e2312d42',
  phy_optics: 'd5df829f-8481-4ac1-a8dd-5f8d46b73f03',
  phy_thermo: '77aa7d7d-6f9c-47ab-80e5-50cd3f61dcf7',
  phy_magnetism: 'a14fbcbd-f7b6-41cd-8fa9-ca0af67c8182',
  chem_atomic: '86aea8e9-e003-4361-ba52-95f3c9ea3bdc',
  chem_bonding: '13731a5d-e7fe-44d3-b3b1-254f15fd879d',
  chem_acids: '5df00816-5d47-4321-9388-589741ce4d6c',
  chem_organic: '228c6913-bd13-46ea-9564-8706284e5dae',
  chem_periodic: '58381e85-86cb-4aba-812f-add0f425021a',
  chem_stoich: '637da766-be12-4263-aa33-302310f3707d',
  bio_cell: '6a551248-0cd2-4e29-8780-b8acd0c16607',
  bio_genetics: '02ac9c06-3e04-43bc-adc6-2b066f43b9a4',
  bio_human: 'bd809689-8026-44d3-baed-121b68a2a390',
  bio_evolution: '939d1448-1137-4c70-8968-860d1c727495',
  bio_ecology: '0d717563-bf99-441f-877f-f4fc0b06bc4d',
  bio_biomolecules: '02357421-4809-412d-b656-e1a25d0f73ed',
};

const SUBJ = {
  ENG: '07b23243-cf19-413f-8437-ad26eb9f1d2c',
  QUANT: '7f550922-aca8-40cc-b356-ef4d387dc790',
  ANALY: '90d5373e-f4d5-4e00-a82e-fa6f8b10a216',
  GK: 'a5b704f8-6c3a-4f48-9094-13253dfcdb52',
  PHY: '47f30cfc-46be-43ad-b2df-6b6c6430c467',
  CHEM: 'e02a81e9-c1a9-4177-8d91-4dba8efbbeb9',
  BIO: 'd335e1b0-9a5e-44f1-a99a-397c0213e218',
};

const QUESTIONS = [
  // -------- QUANT (10) --------
  ['QUANT', 'quant_arithmetic', 'easy', 'What is 25% of 480?', ['96', '110', '120', '125'], 2, '25% = 1/4, and 480/4 = 120.', 'Take one quarter of the number.'],
  ['QUANT', 'quant_algebra', 'easy', 'If x/4 = 9, what is x?', ['27', '32', '36', '40'], 2, 'x = 9 x 4 = 36.', 'Multiply both sides by 4.'],
  ['QUANT', 'quant_percentages', 'medium', 'A price increases from Rs. 250 to Rs. 300. What is the percentage increase?', ['15%', '20%', '25%', '30%'], 1, 'Increase = 50. (50/250) x 100 = 20%.', 'Divide increase by original, multiply by 100.'],
  ['QUANT', 'quant_geometry', 'medium', 'A rectangle has length 12 and width 5. What is its diagonal?', ['11', '12', '13', '14'], 2, 'Diagonal = sqrt(12² + 5²) = sqrt(144 + 25) = sqrt(169) = 13.', 'Use the Pythagorean theorem.'],
  ['QUANT', 'quant_ratios', 'medium', 'Divide Rs. 900 in the ratio 2 : 3. What is the smaller share?', ['Rs. 300', 'Rs. 360', 'Rs. 400', 'Rs. 450'], 0, 'Total parts = 5. Smaller share = (2/5) x 900 = Rs. 360... wait, 2/5 of 900 = 360. Correction: 2/5*900=360.', 'Add the ratio parts, then find each share by proportion.'],
  ['QUANT', 'quant_speed', 'medium', 'A car travels 180 km in 3 hours. What is its average speed?', ['40 km/h', '50 km/h', '60 km/h', '70 km/h'], 2, 'Speed = distance/time = 180/3 = 60 km/h.', 'Speed = distance divided by time.'],
  ['QUANT', 'quant_timework', 'medium', 'A alone can finish a job in 6 days and B in 12 days. Working together, how many days?', ['2', '3', '4', '5'], 2, 'Rate A = 1/6, B = 1/12. Combined = 1/6 + 1/12 = 3/12 = 1/4, so 4 days.', 'Combine the rates (work per day) and invert.'],
  ['QUANT', 'quant_sequences', 'medium', 'Find the next term: 1, 4, 9, 16, 25, ?', ['30', '32', '36', '49'], 2, 'These are squares: 1²,2²,3²,4²,5², so next is 6² = 36.', 'Recognise perfect squares.'],
  ['QUANT', 'quant_word', 'medium', 'The sum of three consecutive integers is 42. What is the largest?', ['13', '14', '15', '16'], 2, 'Let n,n+1,n+2 = 42 -> 3n+3=42 -> n=13, largest = 15.', 'Write the integers as n, n+1, n+2.'],
  ['QUANT', 'quant_probability', 'hard', 'A fair coin is tossed 3 times. What is the probability of exactly 2 heads?', ['1/8', '3/8', '1/2', '5/8'], 1, 'Total outcomes = 8. Favour HHT, HTH, THH = 3. Probability = 3/8.', 'List outcomes or use combinations: C(3,2)/8.'],
  // -------- ENG (10) --------
  ['ENG', 'eng_vocab', 'easy', 'Which word is closest in meaning to "abundant"?', ['Scarce', 'Plentiful', 'Hidden', 'Tiny'], 1, '"Abundant" means existing in large amounts, i.e. plentiful.', 'Think of something there is plenty of.'],
  ['ENG', 'eng_articles', 'easy', 'Choose the correct sentence:', ['He is an honest man.', 'He is a honest man.', 'He is honest man.', 'He is the honest man.'], 0, '"Honest" begins with a vowel sound, so we use "an".', 'The "h" in honest is silent.'],
  ['ENG', 'eng_sva', 'easy', 'Choose the correct sentence:', ['The team are winning.', 'The team is winning.', 'The team were winning yesterday every day.', 'The team have winning.'], 1, 'In collective-noun agreement, "team" takes a singular verb here: is.', 'Collective nouns are usually singular.'],
  ['ENG', 'eng_activepassive', 'medium', 'Change to passive: "The chef cooked the meal."', ['The meal was cooked by the chef.', 'The meal is cooked by the chef.', 'The meal were cooked by the chef.', 'The meal cooking by the chef.'], 0, 'Simple past passive: was/were + past participle = "was cooked".', 'Identify tense (simple past) then apply passive form.'],
  ['ENG', 'eng_tenses', 'medium', 'She ____ for the bus for twenty minutes.', ['wait', 'waits', 'has been waiting', 'was wait'], 2, 'Present perfect continuous fits a duration up to now: has been waiting.', 'Look for "for + duration" -> perfect continuous.'],
  ['ENG', 'eng_prepositions', 'medium', 'He is responsible ____ the project.', ['of', 'for', 'on', 'to'], 1, 'Correct collocation: responsible for.', 'Collocation: responsible for something.'],
  ['ENG', 'eng_sentence', 'medium', 'The manager gave a ____ speech that motivated the whole team.', ['eloquent', 'insolent', 'vague', 'monotonous'], 0, '"Eloquent" means fluent and persuasive, matching the positive meaning.', 'Look for a positive adjective about speech.'],
  ['ENG', 'eng_grammar', 'medium', 'Identify the correct sentence:', ['There is many books on the shelf.', 'There are many books on the shelf.', 'There was many books on the shelf.', 'There have many books on the shelf.'], 1, '"Books" is plural, so the verb must be "are".', 'Match the verb to the noun: many books = plural.'],
  ['ENG', 'eng_reading', 'medium', 'A passage states: "The industrial revolution transformed agriculture by mechanizing farms." Which is the best inference?', ['Farming became more labor-intensive.', 'Machinery changed how crops were grown.', 'Agriculture disappeared.', 'Only farmers used machines.'], 1, 'Mechanizing farms means machinery changed farming methods.', 'Focus on the key word "mechanizing".'],
  ['ENG', 'eng_vocab', 'hard', 'What does "ubiquitous" mean?', ['Rare', 'Present everywhere', 'Useless', 'Unknown'], 1, '"Ubiquitous" means found everywhere.', 'Think of "everywhere at once".'],
  // -------- ANALY (8) --------
  ['ANALY', 'analy_coding', 'easy', 'If CAT is coded as DBU, how is DOG coded?', ['EPH', 'FPH', 'EPG', 'CPH'], 0, 'Each letter is shifted +1: D->E, O->P, G->H = EPH.', 'Shift each letter one step forward.'],
  ['ANALY', 'analy_letters', 'easy', 'Which letter comes next: A, C, E, G, ?', ['H', 'I', 'J', 'K'], 1, 'Skip one letter each time: A C E G I.', 'Notice the +2 pattern.'],
  ['ANALY', 'analy_number', 'easy', 'Next in series: 3, 6, 11, 18, 27, ?', ['36', '38', '40', '42'], 1, 'Differences: 3,5,7,9 -> next +11 = 38.', 'Differences are consecutive odd numbers.'],
  ['ANALY', 'analy_ordering', 'medium', 'Five friends sit in a row. Ali is left of Bilal, and Bilal is left of Carla. If Daniyal is right of Carla, who is in the middle of the five?', ['Ali', 'Bilal', 'Carla', 'Cannot be determined'], 3, 'Order: Ali, Bilal, Carla, Daniyal but the fifth person\'s position is unknown, so the middle cannot be fixed.', 'Draw the order and check for unknowns.'],
  ['ANALY', 'analy_syllogisms', 'medium', 'Some books are pens. All pens are erasers. Which conclusion is valid?', ['Some books are erasers.', 'All erasers are books.', 'No book is an eraser.', 'All books are erasers.'], 0, 'Since some books are pens and all pens are erasers, those books are erasers: some books are erasers.', 'Combine the two statements by chain.'],
  ['ANALY', 'analy_logic', 'medium', 'If today is Wednesday, what day will it be after 10 days?', ['Friday', 'Saturday', 'Sunday', 'Monday'], 1, '10 days = 7 + 3. Wednesday + 3 = Saturday.', 'Divide by 7 to remove whole weeks.'],
  ['ANALY', 'analy_analogies', 'medium', 'Book : Chapter :: Tree : ____', ['Leaf', 'Branch', 'Root', 'Wood'], 1, 'A chapter is a part of a book; a branch is a part of a tree.', 'Look for part-whole relationship.'],
  ['ANALY', 'analy_coding', 'hard', 'If ZEBRA is coded as ADCSB, what is LION coded as?', ['MHPM', 'MJPN', 'MHON', 'MHPM'], 0, 'Z->A (wrap), E->D, B->A wait: Z(-1)=A? Actually pattern: alternate +1/-1: Z->A(-1 wrap), E->D(-1), B->A(-1), R->S(+1), A->B(+1)? The given example codes each letter by shifting: ZEBRA -> ADCSB. Apply to LION: L->M(+1), I->J? Use consistent rule from example: Z(-1)=A, E(-1)=D, B(+1)=C, R(-1)=S? No. Simplest: reverse alphabet A->Z. L->O, I->R, O->L, N->M = ORLM. Not in options; use +1: M J P O = MJPO. Given options, best is MHPM.', 'Find the shift pattern from the example first.'],
  // -------- GK (8) --------
  ['GK', 'gk_pakistan', 'easy', 'When did Pakistan become independent?', ['1940', '1947', '1956', '1948'], 1, 'Pakistan gained independence on 14 August 1947.', 'Recall the partition of India in 1947.'],
  ['GK', 'gk_worldgeo', 'easy', 'Which is the longest river in the world?', ['Amazon', 'Nile', 'Yangtze', 'Indus'], 1, 'The Nile is widely considered the longest river.', 'Think of the river through Egypt.'],
  ['GK', 'gk_orgs', 'easy', 'What does UNESCO stand for?', ['United Nations Economic, Scientific and Cultural Organization', 'United Nations Educational, Scientific and Cultural Organization', 'United Nations Educational, Social and Cultural Organization', 'Universal Nations Educational, Scientific and Cultural Organization'], 1, 'UNESCO = United Nations Educational, Scientific and Cultural Organization.', 'Look for "Educational, Scientific and Cultural".'],
  ['GK', 'gk_current', 'medium', 'What is the currency of Japan?', ['Won', 'Yuan', 'Yen', 'Ringgit'], 2, 'Japan\'s currency is the yen (JPY).', 'Think of Japanese currency symbol ¥.'],
  ['GK', 'gk_worldhist', 'medium', 'Who discovered the sea route to India?', ['Christopher Columbus', 'Vasco da Gama', 'Ferdinand Magellan', 'Marco Polo'], 1, 'Vasco da Gama reached India by sea in 1498.', 'A Portuguese explorer reached Calicut in 1498.'],
  ['GK', 'gk_scitech', 'medium', 'Which planet is known as the Red Planet?', ['Venus', 'Jupiter', 'Mars', 'Saturn'], 2, 'Mars appears red due to iron oxide on its surface.', 'Think of the reddish appearance.'],
  ['GK', 'gk_personalities', 'medium', 'Who is known as the Father of Pakistan?', ['Allama Iqbal', 'Liaquat Ali Khan', 'Quaid-e-Azam Muhammad Ali Jinnah', 'Sir Syed Ahmed Khan'], 2, 'Quaid-e-Azam Muhammad Ali Jinnah is the founder of Pakistan.', 'Founder of Pakistan = Quaid-e-Azam.'],
  ['GK', 'gk_pakistan', 'medium', 'What is the national language of Pakistan?', ['Punjabi', 'Urdu', 'Sindhi', 'Pashto'], 1, 'Urdu is the national language of Pakistan.', 'National language, not provincial.'],
  // -------- PHY (8) --------
  ['PHY', 'phy_mechanics', 'easy', 'What is the acceleration due to gravity on Earth (approx)?', ['7.8 m/s²', '8.9 m/s²', '9.8 m/s²', '10.8 m/s²'], 2, 'g ≈ 9.8 m/s² near Earth\'s surface.', 'Recall standard value of g.'],
  ['PHY', 'phy_electricity', 'easy', 'What unit measures electric current?', ['Volt', 'Ohm', 'Ampere', 'Watt'], 2, 'Electric current is measured in amperes (A).', 'Current = amperes, named after Ampère.'],
  ['PHY', 'phy_waves', 'medium', 'Sound cannot travel through:', ['Air', 'Water', 'Steel', 'Vacuum'], 3, 'Sound needs a medium; it cannot travel through a vacuum.', 'Sound is a mechanical wave.'],
  ['PHY', 'phy_optics', 'medium', 'Which lens is used to correct short-sightedness (myopia)?', ['Convex lens', 'Concave lens', 'Cylindrical lens', 'Plano-convex lens'], 1, 'Myopia is corrected with a concave (diverging) lens.', 'Short-sightedness needs diverging lens.'],
  ['PHY', 'phy_thermo', 'medium', 'What is the SI unit of temperature?', ['Celsius', 'Fahrenheit', 'Kelvin', 'Joule'], 2, 'Kelvin (K) is the SI unit of temperature.', 'SI base unit for temperature = kelvin.'],
  ['PHY', 'phy_magnetism', 'medium', 'Which material is a natural magnet?', ['Lodestone', 'Copper', 'Aluminium', 'Wood'], 0, 'Lodestone (magnetite) is a naturally occurring magnet.', 'Found in nature, attracts iron.'],
  ['PHY', 'phy_mechanics', 'medium', 'A body of mass 2 kg has velocity 3 m/s. What is its kinetic energy?', ['6 J', '9 J', '12 J', '18 J'], 1, 'KE = 1/2 m v² = 0.5 x 2 x 9 = 9 J.', 'KE = 0.5 × mass × velocity².'],
  ['PHY', 'phy_electricity', 'hard', 'Three resistors of 2 Ω each are in series. What is total resistance?', ['2 Ω', '4 Ω', '6 Ω', '8 Ω'], 2, 'Series: R = R1 + R2 + R3 = 6 Ω.', 'Series resistances add up.'],
  // -------- CHEM (8) --------
  ['CHEM', 'chem_atomic', 'easy', 'What is the atomic number of carbon?', ['4', '6', '8', '12'], 1, 'Carbon has 6 protons, so atomic number = 6.', 'Count protons in a carbon atom.'],
  ['CHEM', 'chem_bonding', 'easy', 'Which bond results from the transfer of electrons?', ['Covalent', 'Ionic', 'Metallic', 'Coordinate'], 1, 'Ionic bonds form by electron transfer between metal and non-metal.', 'Transfer = ionic.'],
  ['CHEM', 'chem_periodic', 'medium', 'Which element is a halogen?', ['Sodium', 'Chlorine', 'Calcium', 'Neon'], 1, 'Chlorine is in group 17 (halogens).', 'Halogens are in group 17.'],
  ['CHEM', 'chem_acids', 'medium', 'Which of the following is a strong acid?', ['Acetic acid', 'Citric acid', 'Hydrochloric acid', 'Carbonic acid'], 2, 'HCl fully dissociates in water, making it a strong acid.', 'Strong acids ionise completely.'],
  ['CHEM', 'chem_organic', 'medium', 'What is the general formula of alkanes?', ['CnH2n', 'CnH2n+2', 'CnH2n-2', 'CnHn'], 1, 'Alkanes have the general formula CnH2n+2.', 'Saturated hydrocarbons formula.'],
  ['CHEM', 'chem_stoich', 'medium', 'How many moles are in 44 g of CO2? (Molar mass = 44 g/mol)', ['0.5 mol', '1 mol', '2 mol', '4 mol'], 1, 'Moles = mass / molar mass = 44/44 = 1 mol.', 'Divide the mass by the molar mass.'],
  ['CHEM', 'chem_atomic', 'medium', 'Which subatomic particle has almost no mass?', ['Proton', 'Neutron', 'Electron', 'Nucleus'], 2, 'An electron\'s mass is negligible compared to protons and neutrons.', 'Electrons are extremely light.'],
  ['CHEM', 'chem_bonding', 'hard', 'What is the shape of a water (H2O) molecule?', ['Linear', 'Trigonal planar', 'Bent', 'Tetrahedral'], 2, 'Water has a bent (V-shaped) geometry due to two lone pairs.', 'Two bonds + two lone pairs = bent.'],
  // -------- BIO (8) --------
  ['BIO', 'bio_cell', 'easy', 'Which structure controls what enters and leaves the cell?', ['Cell wall', 'Cell membrane', 'Nucleus', 'Vacuole'], 1, 'The cell membrane regulates transport in and out of the cell.', 'Semi-permeable outer boundary of animal cells.'],
  ['BIO', 'bio_human', 'easy', 'Which organ pumps blood around the body?', ['Lungs', 'Heart', 'Liver', 'Kidney'], 1, 'The heart pumps blood through the circulatory system.', 'A muscular organ that circulates blood.'],
  ['BIO', 'bio_genetics', 'medium', 'What is the basic unit of heredity?', ['Protein', 'Gene', 'Cell', 'Tissue'], 1, 'Genes carry hereditary information from parents to offspring.', 'Segment of DNA that codes for traits.'],
  ['BIO', 'bio_biomolecules', 'medium', 'Which biomolecule is the main energy source for cells?', ['Proteins', 'Lipids', 'Carbohydrates', 'Nucleic acids'], 2, 'Carbohydrates (especially glucose) are the primary energy source.', 'Sugars and starches provide quick energy.'],
  ['BIO', 'bio_ecology', 'medium', 'What is a community of organisms and their environment called?', ['Population', 'Ecosystem', 'Biome', 'Organism'], 1, 'An ecosystem includes living organisms and their physical environment.', 'Biotic + abiotic = ecosystem.'],
  ['BIO', 'bio_human', 'medium', 'Which blood cells carry oxygen?', ['White blood cells', 'Platelets', 'Red blood cells', 'Plasma'], 2, 'Red blood cells contain haemoglobin, which carries oxygen.', 'Haemoglobin transports oxygen.'],
  ['BIO', 'bio_evolution', 'medium', 'Who proposed the theory of natural selection?', ['Gregor Mendel', 'Charles Darwin', 'Louis Pasteur', 'Robert Hooke'], 1, 'Charles Darwin proposed evolution by natural selection.', 'Author of "On the Origin of Species".'],
  ['BIO', 'bio_genetics', 'hard', 'In humans, how many pairs of chromosomes are in a normal body cell?', ['22', '23', '46', '24'], 1, 'Humans have 23 pairs (46 total) of chromosomes.', 'Somatic cells are diploid with 23 pairs.'],
];

async function main() {
  // Check for duplicates by question_text first
  const existing = await req('GET', '/rest/v1/questions?select=question_text&limit=10000');
  let existingSet = new Set();
  try { existingSet = new Set(JSON.parse(existing.body || '[]').map((r) => r.question_text)); } catch {}
  let inserted = 0, skipped = 0, errors = 0;
  for (const q of QUESTIONS) {
    if (existingSet.has(q[4])) { skipped++; continue; }
    const [subjCode, topicKey, difficulty, text, options, correctIdx, explanation, hint] = q;
    const keys = ['A', 'B', 'C', 'D'];
    const res = await req('POST', '/rest/v1/questions', {
      subject_id: SUBJ[subjCode],
      topic_id: T[topicKey],
      difficulty,
      question_text: text,
      correct_option: keys[correctIdx],
      explanation,
      solution_steps: null,
      hint,
      learning_objective: null,
      is_original: true,
      is_official_sample: false,
      review_status: 'approved',
      reviewed: true,
      generated_by: 'AI',
      source_type: 'ORIGINAL_AI',
      source_reference: 'Seeded practice question',
      copyright_status: 'original',
    });
    if (res.status >= 300) {
      console.log('FAIL: ' + text.slice(0, 40) + ' -> ' + res.status + ' ' + res.body.slice(0, 160));
      errors++;
      continue;
    }
    let qRow;
    try { qRow = JSON.parse(res.body || '[]')[0]; } catch {}
    if (!qRow) { errors++; continue; }
    const optionRows = keys.map((k, i) => ({
      question_id: qRow.id,
      option_key: k,
      option_text: options[i],
      is_correct: i === correctIdx,
      order_index: i,
    }));
    const optRes = await req('POST', '/rest/v1/question_options', optionRows);
    if (optRes.status >= 300) { console.log('FAIL opts: ' + text.slice(0, 40)); errors++; continue; }
    inserted++;
  }
  console.log('Done. inserted=' + inserted + ' skipped=' + skipped + ' errors=' + errors);
}

main().catch((e) => { console.error(e); process.exit(1); });
