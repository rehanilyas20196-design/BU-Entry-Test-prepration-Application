export interface RoadmapStage {
  title: string;
  description: string;
  icon: string;
}

export interface RoadmapArticle {
  id: string;
  title: string;
  icon: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
}

export const APPLY_URL = 'https://cms.bahria.edu.pk/Logins/candidate/Login.aspx';

export const ROADMAP_STAGES: RoadmapStage[] = [
  { title: 'Create an Account', description: 'Click "Apply Now" and register as a national student. International students use the separate ISA portal.', icon: 'user-plus' },
  { title: 'Verify Email & Set Password', description: 'Check your inbox, click the verification link, and set your password.', icon: 'mail' },
  { title: 'Log In to Your BU Account', description: 'Sign in with your email and password to access the application dashboard.', icon: 'log-in' },
  { title: 'Fill the Online Form', description: 'Complete every step of the online application form and generate a Fee Voucher.', icon: 'file-text' },
  { title: 'Pay the Processing Fee', description: 'Print the voucher and pay at any branch of Bank Alfalah or Allied Bank.', icon: 'credit-card' },
  { title: 'Print the Entry Test Slip', description: 'Download and print your admit slip (entry test slip) from your account.', icon: 'file-minus' },
  { title: 'Appear in BUET', description: 'Take the Bahria University Entry Test on the scheduled date.', icon: 'edit-3' },
  { title: 'Check the Merit List', description: 'Find your name in the merit list published on www.bahria.edu.pk.', icon: 'bar-chart-2' },
  { title: 'Appear in the Interview', description: 'Attend the interview on the date shown against your name.', icon: 'message-circle' },
  { title: 'Submit Admission Fee', description: 'Pay the first semester admission fee to confirm your seat.', icon: 'check-circle' },
];

export const ROADMAP_ARTICLES: RoadmapArticle[] = [
  {
    id: 'process',
    title: 'Admission Process',
    icon: 'git-branch',
    summary: 'The official 10-step application pipeline.',
    paragraphs: [
      'Bahria University’s official undergraduate application process is fully online and follows ten clear steps. Every step happens on the university’s admission portal, so you can track your application at each stage.',
      'The process runs in admission phases (e.g. Fall 2026), and each phase publishes its own schedule for applications, BUET and merit lists. National students apply through the candidate login; international students apply through the ISA portal.',
    ],
    bullets: [
      'Create account → verify email → log in → fill form → pay fee → print slip → BUET → merit list → interview → admission fee',
      'Apply Now (National): cms.bahria.edu.pk/Logins/Candidate',
      'International students apply via the ISA portal',
    ],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    icon: 'check-circle',
    summary: 'Who can apply for undergraduate programmes.',
    paragraphs: [
      'Eligibility is based on your qualifying examination (Intermediate / A-Level / equivalent), minimum aggregate marks, and the subject requirements of your chosen programme.',
      'Applicants awaiting results can usually apply provisionally. A-Level and foreign-qualification candidates must provide equivalence certificates from the relevant board.',
    ],
    bullets: [
      'Meet the minimum aggregate for the programme applied for.',
      'A-Level and foreign qualifications need an equivalence certificate.',
      'Provisional application is allowed if results are pending.',
    ],
  },
  {
    id: 'dates',
    title: 'Important Dates',
    icon: 'calendar',
    summary: 'The official Fall 2026 admission schedule.',
    paragraphs: [
      'Admissions are run in phases, and each phase publishes a plan with exact dates. The Fall 2026 Phase-II plan for BU Health Sciences Islamabad & Karachi and BU (E-8 & H-11) campuses is listed below.',
      'Admissions close quickly after opening, so complete your form and pay the registration fee before the deadlines.',
    ],
    bullets: [
      'Admissions Open (BUHS-CI & BUIC E-8/H-11): 31 July 2026',
      'Admissions Open (BUHS-CK): 7 August 2026',
      'Admissions Close: 20 August 2026',
      'Last date for Registration Fee: 21 August 2026',
      'Conduct of BUET: from 22 August 2026',
      'Merit list issued: 26 August 2026',
      'Commencement of classes: 31 August 2026',
      'PhD (IPP Karachi) merit list: 24 August 2026',
    ],
  },
  {
    id: 'buet-info',
    title: 'BUET Information',
    icon: 'info',
    summary: 'The Bahria University Entry Test, explained.',
    paragraphs: [
      'BUET (Bahria University Entry Test) is the university’s own admission test. For undergraduate programmes it contains 100 multiple-choice questions, each with four answer options. There is no negative marking.',
      'The test carries 100 marks and the time allowed is 120 minutes. Only one option per question is correct, and every candidate must appear unless exempted.',
    ],
    bullets: [
      '100 MCQs, four options each, no negative marking.',
      'Total 100 marks, 120 minutes allowed.',
      'Subjects and weightings vary by faculty.',
    ],
  },
  {
    id: 'test-pattern',
    title: 'Test Pattern',
    icon: 'layout',
    summary: 'Subject distribution for each faculty.',
    paragraphs: [
      'The BUET subjects and MCQ percentage vary by department. For Management, Business, Media, Maritime, Humanities & Social Sciences (except BS English) and Legal Studies, the paper is 50% Verbal Ability, 15% Quantitative Reasoning, 15% Analytical Reasoning and 20% General Knowledge.',
      'For Computer Science, Electrical, Computer and Software Engineering programmes the paper is 30% Verbal Ability, 15% Quantitative Reasoning, 15% Analytical Reasoning, 10% Physics and 30% Maths. Verbal, Quantitative and Analytical sections cover English comprehension, English grammar, algebra and general maths.',
    ],
    bullets: [
      'Management/Business/Media/Maritime/Humanities/Legal: 50% Verbal · 15% Quant · 15% Analytical · 20% General Knowledge',
      'CS / EE / CE / SE: 30% Verbal · 15% Quant · 15% Analytical · 10% Physics · 30% Maths',
      'Medical Sciences: 25% Verbal · 25% Physics · 25% Chemistry · 25% Biology',
      'BS Psychology/English/Islamic Studies: 50% English · 25% General Knowledge · 25% Verbal Reasoning',
      'Earth & Environmental Sciences: Verbal, Quantitative and Analytical Reasoning plus Chemistry, Physics, and Biology or Maths',
      'Verbal/Quant/Analytical cover English comprehension, English grammar, algebra and general maths',
    ],
  },
  {
    id: 'sample-papers',
    title: 'Sample / Mock Papers',
    icon: 'book-open',
    summary: 'Practise with official BUET sample papers.',
    paragraphs: [
      'Bahria publishes official BUET sample/mock papers so candidates can familiarise themselves with the test format, difficulty and timing.',
      'Attempting these papers under timed conditions — and reviewing every mistake — is the most effective way to prepare for the real test.',
    ],
    bullets: [
      'Download the official BUET sample/mock papers from the admissions pages.',
      'Practise 100 MCQs within 120 minutes to simulate the real test.',
      'Use this app’s practice and mock-test modes for additional timed drilling.',
    ],
  },
  {
    id: 'exemption',
    title: 'Test Exemption',
    icon: 'award',
    summary: 'Categories exempted from BUET.',
    paragraphs: [
      'The following applicants are exempted from appearing in BUET: those who have qualified GRE or GAT through NTS (General) for MS/MPhil/PhD programmes, those who qualified SAT for non-engineering and engineering Bachelor programmes, and those who qualified BUET within the last one year.',
      'Exempt applicants must still register online and pay the registration fee. They must mention GRE, GAT-NTS or SAT during online registration and upload a copy of the result card in their personal profile.',
    ],
    bullets: [
      'GRE / GAT (NTS General) for MS, MPhil & PhD.',
      'SAT for Bachelor programmes (engineering and non-engineering).',
      'Previously qualified BUET within the last one year.',
      'Exempt applicants may choose to appear to improve their score — the best result counts.',
    ],
  },
  {
    id: 'merit-list',
    title: 'Merit List',
    icon: 'bar-chart-2',
    summary: 'How results are published and seats offered.',
    paragraphs: [
      'After BUET, Bahria publishes the merit list on the official website www.bahria.edu.pk. You find your name against the programme and campus you applied for.',
      'Seats are offered in order of merit. Shortlisted candidates then appear in the interview on the date shown against their name in the list.',
    ],
    bullets: [
      'Merit lists are published on www.bahria.edu.pk.',
      'Seats are offered in order of merit per programme and campus.',
      'Your name appears with your interview date.',
    ],
  },
  {
    id: 'interview',
    title: 'Interview',
    icon: 'message-circle',
    summary: 'Final selection stage for shortlisted candidates.',
    paragraphs: [
      'Candidates on the merit list appear in a panel interview on the date given against their name. The interview assesses academic background, communication and suitability for the programme.',
      'Bring your original documents and CNIC/B-Form, be ready to discuss your studies, and arrive early on the day.',
    ],
    bullets: [
      'Attend on the date printed against your name in the merit list.',
      'Carry original documents and CNIC/B-Form.',
      'Prepare for academic and general questions.',
    ],
  },
  {
    id: 'campus',
    title: 'Campus Information',
    icon: 'map-pin',
    summary: 'Bahria campuses across Pakistan.',
    paragraphs: [
      'Bahria University operates several campuses across Pakistan: E-8 and H-11 Islamabad, Karachi, Lahore, the Institute of Professional Psychology (Karachi), and Health Sciences campuses in Islamabad and Karachi.',
      'Programme availability, intake and fee structures differ by campus. Choose your preferred campus at the time of application.',
    ],
    bullets: [
      'E-8 Islamabad · H-11 Islamabad · Karachi · Lahore',
      'Institute of Professional Psychology, Karachi',
      'Health Sciences campuses in Islamabad and Karachi',
      'Karachi Campus address: 13 National Stadium Road, Karachi (021 99240002-6)',
    ],
  },
  {
    id: 'programs',
    title: 'Programmes',
    icon: 'grid',
    summary: 'Undergraduate programmes offered by Bahria.',
    paragraphs: [
      'Bahria offers undergraduate programmes across Business Studies, Management Studies, Computer Sciences, Software Engineering, Electrical and Computer Engineering, Earth & Environmental Sciences, Maritime Sciences, Media Studies, Humanities & Social Sciences and Medical Sciences.',
      'Each programme has its own duration, credit hours and BUET subject weightings. Examples include BS Computer Science (4 years, 132 credit hours), BS Artificial Intelligence (4 years, 136), Bachelor of Software Engineering (4 years, 139) and BBA (4 years, 135).',
    ],
    bullets: [
      'Business Administration & Management',
      'Computer Science · IT · Artificial Intelligence · Software Engineering',
      'Computer, Electrical & Software Engineering',
      'Earth & Environmental Sciences · Remote Sensing & GIS',
      'Maritime · Media · Humanities · Medical & Health Sciences',
    ],
  },
];

export function getRoadmapArticle(id: string): RoadmapArticle | null {
  return ROADMAP_ARTICLES.find((a) => a.id === id) ?? null;
}