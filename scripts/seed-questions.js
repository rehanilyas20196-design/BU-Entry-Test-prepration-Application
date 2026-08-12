// One-time seed: adds practice questions + options into Supabase.
// Reads credentials from apps/api/.env
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

// topic ids (verified earlier)
const T = {
  quant_arithmetic: 'b08264af-1a08-46e3-947d-aba5a6eb1087',
  quant_algebra: '3efbe72d-80cb-40fd-abc6-992525859e7d',
  quant_percentages: '9cb4bd06-4fd2-4f7a-9087-cbd74ec4a40d',
  quant_geometry: 'bf9d91dc-f762-4656-a6fc-1c8a32062fdb',
  quant_probability: '036f0d6f-2a63-43fa-9440-fe75c6267cd8',
  eng_grammar: '78354703-1169-434b-80db-788255574931',
  eng_vocab: 'c40fc035-6721-4d8d-9d95-4368642dc39a',
  eng_prepositions: '425d9bbe-bc62-4a90-8d81-58b696ffdd5f',
  eng_tenses: 'a8ee872a-94a5-46d4-88db-c78cb014ada0',
  eng_sentence: 'fe2080ad-bd38-4b2f-afad-9dcace414951',
  analy_syllogisms: '9f5f52bf-a8bc-4512-95ba-9f53bc037228',
  analy_number: 'b5e6db0b-2579-40cc-aa47-68207306f5cd',
  analy_analogies: '38e15c6e-3156-4d33-8ce6-10d4bc1a4d5f',
  analy_logic: '34bc25df-ae40-4624-9870-5425d6e09ad8',
  gk_pakistan: '757cbc94-84e1-4333-afdc-91341bd384ca',
  gk_current: 'a1e01203-41d7-4abf-b1a2-61503829545e',
  gk_worldgeo: 'ca37a79d-908e-44a6-931c-d574af11adb6',
  phy_mechanics: '31158177-f5cb-4da3-9004-fcd30feda7c5',
  phy_electricity: '04b402ec-0d96-40f5-883a-904431acc48a',
  phy_waves: 'fd806ae7-a17d-4e9e-b4e3-c1c2e2312d42',
  chem_atomic: '86aea8e9-e003-4361-ba52-95f3c9ea3bdc',
  chem_bonding: '13731a5d-e7fe-44d3-b3b1-254f15fd879d',
  chem_acids: '5df00816-5d47-4321-9388-589741ce4d6c',
  bio_cell: '6a551248-0cd2-4e29-8780-b8acd0c16607',
  bio_genetics: '02ac9c06-3e04-43bc-adc6-2b066f43b9a4',
  bio_human: 'bd809689-8026-44d3-baed-121b68a2a390',
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

// Each question: [subject, topicKey, difficulty, question, [options], correctIdx, explanation, hint]
const QUESTIONS = [
  // ---------------- QUANT ----------------
  ['QUANT', 'quant_arithmetic', 'easy',
    'A shopkeeper buys 120 pens for Rs. 2,400. He sells them at Rs. 25 each. What is his total profit?',
    ['Rs. 400', 'Rs. 500', 'Rs. 600', 'Rs. 800'], 2,
    'Cost per pen = 2400/120 = Rs. 20. Selling price per pen = Rs. 25. Profit per pen = 5, total = 5 x 120 = Rs. 600.',
    'Profit = (SP - CP) x quantity.'],
  ['QUANT', 'quant_algebra', 'medium',
    'If 3x + 7 = 22, what is the value of x?',
    ['3', '5', '6', '9'], 1,
    '3x = 22 - 7 = 15, so x = 5.',
    'Isolate x by subtracting 7 then dividing by 3.'],
  ['QUANT', 'quant_percentages', 'medium',
    'A student scores 465 out of 620. What is his percentage?',
    ['65%', '70%', '75%', '80%'], 2,
    'Percentage = (465 / 620) x 100 = 0.75 x 100 = 75%.',
    'Divide the marks obtained by total marks, then multiply by 100.'],
  ['QUANT', 'quant_geometry', 'medium',
    'The area of a circle is 154 cm². Taking π = 22/7, what is its radius?',
    ['5 cm', '6 cm', '7 cm', '8 cm'], 2,
    'Area = πr² = 154 => r² = 154 x 7 / 22 = 49 => r = 7 cm.',
    'Rearrange the area formula to solve for r², then take the square root.'],
  ['QUANT', 'quant_probability', 'medium',
    'A bag contains 5 red, 3 blue and 2 green balls. One ball is drawn at random. What is the probability it is NOT red?',
    ['1/5', '1/2', '2/5', '3/5'], 1,
    'Total balls = 10. Non-red = 5. Probability = 5/10 = 1/2.',
    'Count favourable outcomes and divide by total outcomes.'],
  // ---------------- ENG ----------------
  ['ENG', 'eng_grammar', 'easy',
    'Choose the sentence with correct subject-verb agreement:',
    ['The list of participants are on the table.', 'Each of the boys have a book.',
      'Neither the teacher nor the students was late.', 'The number of students is increasing.'], 3,
    'Option D is correct: "The number of students is increasing." Here "number" is the singular subject. Options A, B and C violate subject-verb agreement.',
    'Watch for phrases like "the number of" and "each of".'],
  ['ENG', 'eng_vocab', 'easy',
    'What is the closest synonym of "meticulous"?',
    ['Careless', 'Careful and precise', 'Rough', 'Hasty'], 1,
    '"Meticulous" means showing great attention to detail, i.e. careful and precise.',
    'Think of someone who checks every detail.'],
  ['ENG', 'eng_prepositions', 'medium',
    'Fill in the blank: "She is very good ____ mathematics."',
    ['in', 'at', 'on', 'for'], 1,
    'We say "good at" a subject or activity.',
    'Common collocation: good at + skill/subject.'],
  ['ENG', 'eng_tenses', 'medium',
    'Choose the correct sentence in the present perfect tense:',
    ['I have finished my homework.', 'I finishes my homework.', 'I finished my homework yesterday.',
      'I am finishing my homework.'], 0,
    'Option A uses "have + past participle" which is the present perfect. Option C is simple past, D is present continuous, B is grammatically wrong.',
    'Present perfect = has/have + past participle.'],
  ['ENG', 'eng_sentence', 'medium',
    'Choose the word that best completes the sentence: "Despite the heavy rain, the match ____ as scheduled."',
    ['proceeded', 'preceded', 'receded', 'ceded'], 0,
    '"Proceeded" means continued. "Preceded" means came before; the other options do not fit the context.',
    'The sentence means the match went ahead despite rain.'],
  // ---------------- ANALY ----------------
  ['ANALY', 'analy_syllogisms', 'easy',
    'All students in class A passed. Sarah is in class A. Which conclusion is valid?',
    ['Sarah passed.', 'Sarah failed.', 'Sarah is a teacher.', 'No conclusion can be drawn.'], 0,
    'If all students in class A passed and Sarah is in class A, then Sarah passed.',
    'Apply the rule directly to the specific person.'],
  ['ANALY', 'analy_number', 'easy',
    'What number comes next in the series: 2, 6, 12, 20, 30, ?',
    ['36', '40', '42', '44'], 2,
    'Differences are 4, 6, 8, 10; next difference is 12, so 30 + 12 = 42.',
    'Look at the differences between consecutive terms.'],
  ['ANALY', 'analy_analogies', 'medium',
    'Doctor is to Hospital as Teacher is to ____',
    ['Library', 'School', 'Classroom', 'Books'], 1,
    'A doctor works in a hospital; a teacher works in a school.',
    'Identify the workplace of the first noun.'],
  ['ANALY', 'analy_logic', 'medium',
    'If all roses are flowers and some flowers fade quickly, which statement is true?',
    ['All roses fade quickly.', 'Some roses fade quickly.', 'All flowers are roses.',
      'Some flowers are roses.'], 3,
    'We know all roses are flowers, so some flowers (the roses) are roses. Nothing guarantees that roses fade quickly.',
    'Draw a Venn diagram: roses form a subset of flowers.'],
  // ---------------- GK ----------------
  ['GK', 'gk_pakistan', 'easy',
    'What is the capital of Pakistan?',
    ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'], 2,
    'Islamabad is the capital of Pakistan since 1960.',
    'Think of the seat of the federal government.'],
  ['GK', 'gk_current', 'medium',
    'Who is the head of the World Health Organization (as of 2024)?',
    ['António Guterres', 'Tedros Adhanom Ghebreyesus', 'Ngozi Okonjo-Iweala', 'Kofi Annan'], 1,
    'Dr Tedros Adhanom Ghebreyesus has served as WHO Director-General since 2017.',
    'Consider who leads the WHO.'],
  ['GK', 'gk_worldgeo', 'medium',
    'Which is the largest ocean in the world?',
    ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3,
    'The Pacific Ocean is the largest and deepest ocean.',
    'Think about the ocean between Asia and the Americas.'],
  // ---------------- PHY ----------------
  ['PHY', 'phy_mechanics', 'easy',
    'What is the SI unit of force?',
    ['Joule', 'Newton', 'Watt', 'Pascal'], 1,
    'Force is measured in newtons (N). 1 N = 1 kg·m/s².',
    'Newton\'s laws are named after Isaac Newton; the unit is named after him too.'],
  ['PHY', 'phy_electricity', 'medium',
    'According to Ohm\'s law, V = I × R. If the current is 3 A and the resistance is 4 Ω, what is the voltage?',
    ['7 V', '12 V', '1.33 V', '0.75 V'], 1,
    'V = 3 × 4 = 12 volts.',
    'Multiply current by resistance.'],
  ['PHY', 'phy_waves', 'medium',
    'What is the speed of a wave with frequency 50 Hz and wavelength 2 m?',
    ['25 m/s', '52 m/s', '100 m/s', '200 m/s'], 2,
    'Speed = frequency × wavelength = 50 × 2 = 100 m/s.',
    'Use v = f × λ.'],
  // ---------------- CHEM ----------------
  ['CHEM', 'chem_atomic', 'easy',
    'Which particle is positively charged?',
    ['Electron', 'Neutron', 'Proton', 'Photon'], 2,
    'Protons carry a positive charge. Electrons are negative and neutrons are neutral.',
    'Remember: P for proton = Positive.'],
  ['CHEM', 'chem_bonding', 'medium',
    'Which type of bond is formed when electrons are shared between atoms?',
    ['Ionic bond', 'Covalent bond', 'Metallic bond', 'Hydrogen bond'], 1,
    'A covalent bond forms when atoms share electron pairs. Ionic bonds transfer electrons.',
    'Sharing = covalent; transfer = ionic.'],
  ['CHEM', 'chem_acids', 'medium',
    'What is the pH value of a neutral solution at 25°C?',
    ['0', '7', '10', '14'], 1,
    'A pH of 7 is neutral. Values below 7 are acidic and above 7 are basic.',
    'Neutral water has pH = 7.'],
  // ---------------- BIO ----------------
  ['BIO', 'bio_cell', 'easy',
    'Which organelle is known as the "powerhouse of the cell"?',
    ['Nucleus', 'Ribosome', 'Mitochondrion', 'Golgi apparatus'], 2,
    'Mitochondria generate most of the cell\'s ATP through cellular respiration.',
    'It produces energy for the cell.'],
  ['BIO', 'bio_genetics', 'medium',
    'If both parents have the genotype Tt (T = tall, dominant), what fraction of offspring will be short (tt)?',
    ['1/4', '1/2', '1/3', '3/4'], 0,
    'A Tt x Tt cross gives TT, Tt, Tt, tt in a 1:2:1 ratio, so 1/4 are tt (short).',
    'Use a Punnett square for a monohybrid cross.'],
  ['BIO', 'bio_human', 'medium',
    'Which blood group is the universal donor?',
    ['A', 'B', 'AB', 'O'], 3,
    'Type O negative blood has no A or B antigens and is safe for most recipients, making it the universal donor.',
    'It lacks A and B antigens.'],
];

async function main() {
  let inserted = 0;
  let errors = 0;
  for (const q of QUESTIONS) {
    const [subjCode, topicKey, difficulty, text, options, correctIdx, explanation, hint] = q;
    const keys = ['A', 'B', 'C', 'D'];
    const subjectId = SUBJ[subjCode];
    const topicId = T[topicKey];
    const res = await req('POST', '/rest/v1/questions', {
      subject_id: subjectId,
      topic_id: topicId,
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
      console.log('FAIL insert: ' + text.slice(0, 40) + ' -> ' + res.status + ' ' + res.body.slice(0, 200));
      errors++;
      continue;
    }
    let qRow = null;
    try {
      const parsed = JSON.parse(res.body || '[]');
      qRow = Array.isArray(parsed) ? parsed[0] : null;
    } catch {
      // body may be empty on 201
    }
    if (!qRow) {
      const sel = await req('GET', '/rest/v1/questions?question_text=eq.' + encodeURIComponent(text) + '&select=id&limit=1');
      try {
        qRow = JSON.parse(sel.body || '[]')[0] || null;
      } catch {
        qRow = null;
      }
    }
    if (!qRow) {
      console.log('WARN: could not resolve id for: ' + text.slice(0, 40));
      errors++;
      continue;
    }
    const optionRows = [];
    for (let i = 0; i < 4; i++) {
      optionRows.push({
        question_id: qRow.id,
        option_key: keys[i],
        option_text: options[i],
        is_correct: i === correctIdx,
        order_index: i,
      });
    }
    const optRes = await req('POST', '/rest/v1/question_options', optionRows);
    if (optRes.status >= 300) {
      console.log('FAIL options for: ' + text.slice(0, 40) + ' -> ' + optRes.status + ' ' + optRes.body.slice(0, 200));
      errors++;
      continue;
    }
    inserted++;
  }
  console.log('Done. inserted=' + inserted + ' errors=' + errors);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
