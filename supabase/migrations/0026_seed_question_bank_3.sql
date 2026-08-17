-- 0026_seed_question_bank_3.sql
-- BUET Prep AI — user-provided question bank (Batch 1 + Batch 2)
--   Batch 1: 32 original MCQs seeded subject/topic-wise via seed_question
--            (English 5, Quantitative 3, Analytical 5, Physics 5,
--             Chemistry 5, Biology 5, General Knowledge 4)
--   Batch 2: 45 original MCQs seeded as a new 45-question sectional mock test
--            (English 8, Quant 9, Analytical 8, Physics 8, Chemistry 6,
--             Biology 4, GK 2) — "Bahria University — Sectional Mock Test"
-- Also restores the Biology (BIO) subject, its topics, and the medical
-- (BDS/MBBS) test section that were removed in 0019, because these batches
-- include Biology content and the app config still references Biology.
-- Flawed items from the user's draft were corrected or dropped (see notes).
-- All questions are original practice items (ORIGINAL_AI, approved), each
-- with exactly 4 options and 1 correct answer.

-- =============================================================
-- RESTORE BIOLOGY SUBJECT + TOPICS + MEDICAL TEST SECTION
-- (removed in 0019; user batches include Biology questions)
-- =============================================================
insert into "public"."subjects" (code, name, category, description, sort_order)
values ('BIO', 'Biology', 'medical', 'Cell biology, genetics, human biology, ecology, evolution', 7)
on conflict (code) do nothing;

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'BIO'), 'Cell Biology', 'Cell structure and function'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Genetics', 'Inheritance, DNA, genes'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Human Biology', 'Organ systems, physiology'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Ecology', 'Ecosystems, environment'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Evolution', 'Natural selection, origins'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Biomolecules', 'Carbohydrates, proteins, lipids, nucleic acids')
on conflict (subject_id, name) do nothing;

-- Re-add the Biology section (25 Q / 25 marks / order 4) to medical configs.
insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name, 25, 25, 4
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code = 'BIO'
where p.code in ('BDS', 'MBBS')
on conflict (test_config_id, subject_id) do nothing;

-- =============================================================
-- NEW SECTIONAL MOCK TEST (45 questions, 60 minutes)
-- =============================================================
do $$
begin
  if not exists (select 1 from "public"."mock_tests" where name = 'Bahria University — Sectional Mock Test') then
    insert into "public"."mock_tests"
      (name, description, is_active, question_count, duration_minutes)
    values
      ('Bahria University — Sectional Mock Test', '45 MCQs · 60 minutes · 1 mark each · no negative marking', true, 45, 60);
  end if;
end;
$$;

-- =============================================================
-- BATCH 1 — SUBJECT / TOPIC-WISE QUESTIONS
-- =============================================================

-- ---------- ENGLISH (5) ----------
select "public"."seed_question"('ENG', 'Subject-Verb Agreement', 'medium',
  $$Identify the part with the error: "Neither the committee members nor the chairperson were willing to accept the responsibility for the decision that had been taken in their absence."$$, 'B',
  $$Neither the committee members$$,
  $$nor the chairperson were willing$$,
  $$to accept the responsibility$$,
  $$No error$$,
  $$With "neither ... nor", the verb agrees with the nearer subject. "The chairperson" is singular, so it requires the singular verb "was": "nor the chairperson was willing". Option B contains the error.$$,
  '[]',
  $$Rule: neither/nor → verb agrees with the nearest subject. Chairperson is singular → was.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$The scientist's explanation only served to _______ the already complex theory.$$, 'B',
  $$elucidate$$,
  $$obfuscate$$,
  $$simplify$$,
  $$illuminate$$,
  $$"Obfuscate" means to make something obscure or difficult to understand — the opposite of the clarifying effect the other options describe, matching "only served to".$$,
  '[]',
  $$Obfuscate = make unclear/confusing.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The proposal was rejected not because it lacked merit but because of the _______ timing of its submission.$$, 'B',
  $$propitious$$,
  $$inopportune$$,
  $$auspicious$$,
  $$fortuitous$$,
  $$"Inopportune" means happening at an inconvenient or unsuitable time. A rejection caused by timing indicates the submission came at a bad moment.$$,
  '[]',
  $$Inopportune = poorly timed / inconvenient.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the correctly spelled word:$$, 'B',
  $$Accomodation$$,
  $$Accommodation$$,
  $$Acommodation$$,
  $$Accomadation$$,
  $$The correct spelling is "accommodation", with double "c" and double "m".$$,
  '[]',
  $$accommodation = double c, double m.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$"Despite of his best efforts, he could not succeed." The error is in:$$, 'A',
  $$Despite of$$,
  $$his best efforts$$,
  $$he could not$$,
  $$No error$$,
  $$"Despite" is used alone ("Despite his best efforts") or "in spite of". "Despite of" is incorrect, so the error is in option A.$$,
  '[]',
  $$Use "despite" alone or "in spite of" — never "despite of".$$);

-- ---------- QUANTITATIVE (3 — GP ratio and log question dropped: mathematically correct answers were not among the given options) ----------
select "public"."seed_question"('QUANT', 'Algebra', 'hard',
  $$If f(x) = (x² + 3x + 2)/(x² − 1) for x ≠ ±1, then lim (x→1) f(x) is:$$, 'C',
  $$2$$,
  $$2.5$$,
  $$Does not exist$$,
  $$3$$,
  $$Factorise: (x² + 3x + 2)/(x² − 1) = (x + 1)(x + 2)/((x − 1)(x + 1)) = (x + 2)/(x − 1). As x → 1 the numerator tends to 3 but the denominator tends to 0, and the left-hand and right-hand limits differ, so the two-sided limit does not exist.$$,
  '["Factorise the numerator and denominator", "Cancel the common factor (x + 1)", "Note (x + 2)/(x − 1) blows up as x → 1", "Left and right limits differ → no limit"]',
  $$The denominator becomes zero at x = 1; check left/right behaviour.$$);

select "public"."seed_question"('QUANT', 'Probability', 'hard',
  $$The number of ways to arrange 7 different books so that 3 particular books are never together is:$$, 'A',
  $$7! − 5! × 3!$$,
  $$7! − 5! × 2!$$,
  $$5! × 3!$$,
  $$7! − 6!$$,
  $$Total arrangements = 7!. Treat the 3 particular books as a single block: 5 items (block + 4 others) can be arranged in 5! ways and the block internally in 3! ways, giving 5! × 3! arrangements where they are together. Answer = 7! − 5! × 3!.$$,
  '["Total = 7!", "Glue the 3 books into one block: 5 items → 5!", "Block internally → 3!", "Subtract: 7! − 5!×3!"]',
  $$Total minus the arrangements where the 3 books sit together.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'hard',
  $$The equation of the tangent to y = x³ − 3x + 2 at the point where the slope is minimum is:$$, 'B',
  $$y = −2x + 4$$,
  $$y = −3x + 2$$,
  $$y = x + 1$$,
  $$y = −x$$,
  $$y' = 3x² − 3. The slope is minimum where y'' = 6x = 0, i.e. x = 0. Slope there = −3 and the point is (0, 2). Tangent: y − 2 = −3(x − 0) → y = −3x + 2.$$,
  '["Differentiate: y'' = 3x² − 3", "Min slope where y'' = 6x = 0 → x = 0", "Slope = −3 at (0,2)", "Line: y = −3x + 2"]',
  $$Minimum slope occurs at the inflection point x = 0.$$);

-- ---------- ANALYTICAL (5) ----------
select "public"."seed_question"('ANALY', 'Coding Decoding', 'hard',
  $$In a certain code, CALENDAR is written as CLANAEDR. How is CIRCULAR written in that code?$$, 'B',
  $$LACANDER$$,
  $$CRIUACLR$$,
  $$CLANADER$$,
  $$ICRCLUAR$$,
  $$Positions are reordered to 1, 3, 2, 5, 7, 4, 6, 8 (check: CALENDAR → C L A N A E D R). Applying the same reordering to CIRCULAR (C I R C U L A R) gives C R I U A C L R = CRIUACLR.$$,
  '["Write the letter order for CALENDAR → CLANAEDR: 1,3,2,5,7,4,6,8", "Apply the same index order to CIRCULAR", "Result: CRIUACLR"]',
  $$Compare letter positions between the word and its code.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'hard',
  $$Five films A, B, C, D, E are to be shown. Conditions: A before C, B before D, E is not last. If D and E are shown as far apart as possible, which statement is true?$$, 'D',
  $$B is shown earlier than C$$,
  $$C is shown earlier than E$$,
  $$D is shown earlier than A$$,
  $$E is shown earlier than B$$,
  $$Maximum separation with E not last means E is first and D is last. Then E (first) is necessarily earlier than B, which must appear before D. So "E is shown earlier than B" is true.$$,
  '["E not last + max separation → E first, D last", "B must precede D", "E (position 1) is before B → option D"]',
  $$Max separation with E not last forces E first and D last.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$In a certain code, POND is written as RQPF. How is HEART written in that code?$$, 'A',
  $$JGCTV$$,
  $$IGCTV$$,
  $$JGCST$$,
  $$JGCSV$$,
  $$Each letter is shifted +2 positions in the alphabet: H→J, E→G, A→C, R→T, T→V, giving JGCTV. (The original draft example "POND → RPSF" was a typo; the intended rule is +2, which gives RQPF for POND and JGCTV for HEART.)$$,
  '["Shift each letter +2: H+2=J, E+2=G, A+2=C, R+2=T, T+2=V", "Result: JGCTV"]',
  $$Add 2 to the alphabet position of each letter.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$Statements: All pens are pencils. Some pencils are erasers. Conclusions: I. Some pens are erasers. II. All erasers are pens.$$, 'D',
  $$Only I follows$$,
  $$Only II follows$$,
  $$Either I or II follows$$,
  $$Neither follows$$,
  $$The pens are a subset of pencils, and some pencils are erasers — that does not force any pen to be an eraser, nor all erasers to be pens. Neither conclusion necessarily follows.$$,
  '["Diagram: pens ⊂ pencils; erasers only overlap part of pencils", "No pen is guaranteed to be an eraser", "No eraser is guaranteed to be a pen", "Neither follows"]',
  $$Some pencils are erasers - this overlap may fall entirely outside the pens.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'easy',
  $$In a row of 40 students, A is 12th from the left and B is 18th from the right. How many students are between A and B?$$, 'A',
  $$10$$,
  $$11$$,
  $$12$$,
  $$Cannot be determined$$,
  $$Students before A = 11; students after B = 17. Between them = 40 − 11 − 17 − 2 = 10. (Alternatively 40 − 12 − 18 = 10.)$$,
  '["Position of A = 12 from left", "Position of B = 40 − 18 + 1 = 23 from left", "Between = 23 − 12 − 1 = 10"]',
  $$Convert B to a left-index, then subtract.$$);

-- ---------- PHYSICS (5) ----------
select "public"."seed_question"('PHY', 'Mechanics', 'medium',
  $$The escape velocity of a body from Earth's gravitational field is independent of:$$, 'C',
  $$Mass of the body$$,
  $$Angle at which it is projected$$,
  $$Both mass and angle$$,
  $$Gravitational field of Earth$$,
  $$Escape velocity = √(2GM/R) depends only on the planet's mass and radius, not on the projectile's mass or launch angle. Option C (both mass and angle) is therefore correct.$$,
  '["Formula: v_e = sqrt(2GM/R)", "Only M and R appear — body mass and angle are absent", "Independent of both mass and angle"]',
  $$v_e = sqrt(2GM/R).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$"Bar" is the unit of:$$, 'B',
  $$Heat$$,
  $$Atmospheric pressure$$,
  $$Current$$,
  $$Sound$$,
  $$The bar is a unit of pressure, commonly used for atmospheric pressure (1 bar ≈ 100 kPa).$$,
  '[]',
  $$Bar = unit of pressure.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$In a series LCR circuit, V_L = 80 V, V_C = 60 V, V_R = 40 V. The source voltage is approximately:$$, 'A',
  $$44.7 V$$,
  $$60 V$$,
  $$89 V$$,
  $$100 V$$,
  $$Source voltage V = √(V_R² + (V_L − V_C)²) = √(40² + (80 − 60)²) = √(1600 + 400) = √2000 ≈ 44.7 V.$$,
  '["V_L − V_C = 20 V", "V = sqrt(VR² + (VL − VC)²)", "sqrt(1600 + 400) = sqrt(2000) ≈ 44.7 V"]',
  $$Use the phasor sum: sqrt(VR² + (VL − VC)²).$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$In the photoelectric effect, if the wavelength of the incident light is decreased by 20%, the stopping potential:$$, 'A',
  $$Increases$$,
  $$Decreases$$,
  $$Remains the same$$,
  $$Becomes zero$$,
  $$Decreasing the wavelength increases the photon energy (E = hc/λ), which increases the maximum kinetic energy of the ejected electrons and hence the stopping potential.$$,
  '["E = hc/λ", "Smaller λ → larger photon energy", "Larger KEmax → larger stopping potential"]',
  $$Shorter wavelength means higher photon energy.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'hard',
  $$A particle is under the force F = −kx + bx². For small oscillations about equilibrium, the motion is:$$, 'A',
  $$SHM$$,
  $$Not periodic$$,
  $$Simple harmonic only if b = 0$$,
  $$Damped$$,
  $$For small oscillations, x is small so the bx² term is negligible and F ≈ −kx, which is a linear restoring force giving simple harmonic motion (SHM).$$,
  '["Near equilibrium x is small", "bx² term negligible", "F ≈ −kx → linear restoring force → SHM"]',
  $$Drop the quadratic term for small x.$$);

-- ---------- CHEMISTRY (5) ----------
select "public"."seed_question"('CHEM', 'Atomic Structure', 'easy',
  $$The amount of ozone in the atmosphere is expressed in:$$, 'C',
  $$Debye$$,
  $$Diopter$$,
  $$Dobson$$,
  $$Decibel$$,
  $$Ozone column amounts are measured in Dobson units (DU). One DU ≈ 2.69 × 10²⁰ molecules per square metre.$$,
  '[]',
  $$Ozone is measured in Dobson units.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'easy',
  $$The most abundant gas in the atmosphere is:$$, 'C',
  $$Carbon dioxide$$,
  $$Oxygen$$,
  $$Nitrogen$$,
  $$Moisture$$,
  $$Nitrogen makes up about 78% of Earth's atmosphere, far more than oxygen (~21%), carbon dioxide (~0.04%) or water vapour.$$,
  '[]',
  $$N2 ≈ 78% of the atmosphere.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'hard',
  $$For the reaction 2A + B ⇌ C, Kc = 0.5. If the initial concentrations are [A] = 1 M, [B] = 1 M and [C] = 0, the equilibrium concentration of C is approximately:$$, 'A',
  $$0.2 M$$,
  $$0.3 M$$,
  $$0.4 M$$,
  $$0.5 M$$,
  $$Let x = [C] at equilibrium. Then [A] = 1 − 2x, [B] = 1 − x. Kc = x / ((1 − 2x)²(1 − x)) = 0.5. Solving gives x ≈ 0.175 M ≈ 0.2 M.$$,
  '["ICE table: A = 1−2x, B = 1−x, C = x", "Kc = x/((1−2x)²(1−x)) = 0.5", "Solve numerically → x ≈ 0.175 ≈ 0.2 M"]',
  $$Set up the ICE table and solve for x.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Which compound has the highest SN1 reactivity?$$, 'B',
  $$CH₃CH₂Br$$,
  $$(CH₃)₃CBr$$,
  $$CH₂=CH−CH₂Br$$,
  $$C₆H₅CH₂Br$$,
  $$SN1 reactions proceed through a carbocation intermediate, so reactivity follows carbocation stability: tertiary (CH₃)₃C⁺ is the most stable, making (CH₃)₃CBr the most SN1-reactive.$$,
  '["SN1 → carbocation intermediate", "Tertiary carbocation most stable", "(CH₃)₃CBr gives tertiary carbocation → highest reactivity"]',
  $$SN1 reactivity increases with carbocation stability.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$The hybridisation of the central atom in [Ni(CN)₄]²⁻ is:$$, 'B',
  $$sp³$$,
  $$dsp²$$,
  $$sp³d$$,
  $$d²sp³$$,
  $$[Ni(CN)₄]²⁻ is square planar (CN⁻ is a strong-field ligand, Ni²⁺ is d⁸). Square planar complexes are dsp² hybridised.$$,
  '["Ni²⁺ is d⁸, CN⁻ is strong-field", "Strong-field + d⁸ → square planar", "Square planar → dsp²"]',
  $$d8 with strong-field ligands → square planar → dsp².$$);

-- ---------- BIOLOGY (5) ----------
select "public"."seed_question"('BIO', 'Biomolecules', 'medium',
  $$The reserve food material in cyanobacteria is:$$, 'C',
  $$Starch$$,
  $$Cellulose$$,
  $$Glycogen$$,
  $$Protein$$,
  $$Cyanobacteria store reserve food as glycogen, a branched polysaccharide.$$,
  '[]',
  $$Cyanobacteria store glycogen.$$);

select "public"."seed_question"('BIO', 'Human Biology', 'easy',
  $$The substance that does NOT appear in the filtrate during glomerular filtration is:$$, 'B',
  $$Carbon dioxide$$,
  $$Fibrinogen$$,
  $$Urea$$,
  $$Sodium chloride$$,
  $$Fibrinogen is a large plasma protein that cannot pass through the glomerular filter, so it is absent from the filtrate.$$,
  '[]',
  $$Large plasma proteins like fibrinogen are excluded from the filtrate.$$);

select "public"."seed_question"('BIO', 'Genetics', 'medium',
  $$In a pedigree of an autosomal recessive trait, the probability that an unaffected child of two carrier parents is itself a carrier is:$$, 'C',
  $$1/4$$,
  $$1/2$$,
  $$2/3$$,
  $$1$$,
  $$Carrier × Carrier → genotypes AA, Aa, Aa, aa. Excluding the affected child (aa), the unaffected children are AA, Aa, Aa, so the probability the unaffected child is a carrier is 2/3.$$,
  '["Aa × Aa → 1 AA : 2 Aa : 1 aa", "Unaffected = AA or Aa", "Among unaffected, 2 of 3 are carriers → 2/3"]',
  $$Given the child is unaffected, exclude the aa genotype.$$);

select "public"."seed_question"('BIO', 'Genetics', 'easy',
  $$Which is NOT a feature of the genetic code?$$, 'C',
  $$Degenerate$$,
  $$Universal$$,
  $$Overlapping$$,
  $$Commaless$$,
  $$The genetic code is triplet, degenerate, universal and commaless, but it is non-overlapping. "Overlapping" is therefore not a feature of the code.$$,
  '[]',
  $$The genetic code is non-overlapping.$$);

select "public"."seed_question"('BIO', 'Genetics', 'easy',
  $$The enzyme that joins Okazaki fragments is:$$, 'C',
  $$DNA polymerase$$,
  $$Helicase$$,
  $$Ligase$$,
  $$Primase$$,
  $$DNA ligase seals the gaps between Okazaki fragments on the lagging strand during DNA replication.$$,
  '[]',
  $$Ligase joins Okazaki fragments.$$);

-- ---------- GENERAL KNOWLEDGE (4 — highest-peak question dropped: near-duplicate of an existing bank item) ----------
select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The word "Urdu" is derived from which language?$$, 'C',
  $$Persian$$,
  $$Arabic$$,
  $$Turkish$$,
  $$Sanskrit$$,
  $$"Urdu" comes from the Turkish word "ordu" meaning army or camp, reflecting the language's origins in military camps.$$,
  '[]',
  $$Urdu ← Turkish "ordu" (army/camp).$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$Which country has no permanent river?$$, 'A',
  $$Qatar$$,
  $$UAE$$,
  $$Jordan$$,
  $$Saudi Arabia$$,
  $$Qatar has no permanent rivers; it relies on desalination and groundwater.$$,
  '[]',
  $$Qatar has no permanent rivers.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$CPEC stands for:$$, 'A',
  $$China Pakistan Economic Corridor$$,
  $$Central Pakistan Economic Corridor$$,
  $$China Pakistan Energy Corridor$$,
  $$Collective Pakistan Economic Corridor$$,
  $$CPEC = China Pakistan Economic Corridor, a major infrastructure and economic project linking Gwadar to China.$$,
  '[]',
  $$CPEC = China Pakistan Economic Corridor.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Pakistan's first nuclear test was conducted in:$$, 'B',
  $$1996$$,
  $$1998$$,
  $$1999$$,
  $$2000$$,
  $$Pakistan conducted its first nuclear tests on 28 May 1998 (Chagai-I) in Balochistan.$$,
  '[]',
  $$28 May 1998 - Chagai-I.$$);

-- =============================================================
-- BATCH 2 — SECTIONAL MOCK TEST QUESTIONS
-- (45 questions; Q18 dropped — premise inconsistent; near-duplicate
--  GK/Biology items dropped to keep the bank clean)
-- =============================================================

-- Section 1 — English (Q1–Q8)
select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 1, 1, $$ENG$$, $$Subject-Verb Agreement$$, $$medium$$, $$Choose the correct sentence:$$, 'B',
  $$He is one of those who always speaks the truth.$$,
  $$He is one of those who always speak the truth.$$,
  $$He is one of those who always spoken the truth.$$,
  $$He is one of those who always speaking the truth.$$,
  $$"One of those who" takes a plural verb because "who" refers to "those": "who always speak the truth".$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 1, 2, $$ENG$$, $$Vocabulary$$, $$medium$$, $$The synonym of "Ephemeral" is:$$, 'B',
  $$Permanent$$,
  $$Transient$$,
  $$Eternal$$,
  $$Durable$$,
  $$Ephemeral means lasting a very short time; transient (short-lived, passing) is its synonym.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 1, 3, $$ENG$$, $$Subject-Verb Agreement$$, $$medium$$, $$Identify the error: "The number of students who have applied for the scholarship are increasing every year."$$, 'C',
  $$The number of students$$,
  $$who have applied$$,
  $$are increasing$$,
  $$No error$$,
  $$"The number of" is singular, so the verb should be "is increasing", not "are increasing". The error is in option C.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 1, 4, $$ENG$$, $$Grammar$$, $$easy$$, $$"He has been working hard _______ he could get the promotion."$$, 'A',
  $$so that$$,
  $$so as$$,
  $$in order$$,
  $$such that$$,
  $$"So that" introduces a purpose clause and is followed by a finite verb: "...so that he could get the promotion".$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 1, 5, $$ENG$$, $$Vocabulary$$, $$easy$$, $$The antonym of "Benevolent" is:$$, 'B',
  $$Kind$$,
  $$Malevolent$$,
  $$Generous$$,
  $$Charitable$$,
  $$Benevolent means kind and well-meaning; its antonym is malevolent (wishing evil or harm).$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 1, 6, $$ENG$$, $$Grammar$$, $$easy$$, $$Choose the correctly punctuated sentence:$$, 'B',
  $$"Where are you going," he asked.$$,
  $$"Where are you going?" he asked.$$,
  $$"Where are you going" he asked.$$,
  $$"Where are you going." he asked.$$,
  $$A direct question inside quotation marks takes a question mark inside the closing quotes.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 1, 7, $$ENG$$, $$Vocabulary$$, $$easy$$, $$The idiom "to hit the nail on the head" means:$$, 'B',
  $$To hurt someone$$,
  $$To do or say something exactly right$$,
  $$To miss the target$$,
  $$To work hard$$,
  $$"To hit the nail on the head" means to describe or identify something exactly and correctly.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 1, 8, $$ENG$$, $$Subject-Verb Agreement$$, $$easy$$, $$Neither of the two candidates _______ suitable for the post.$$, 'B',
  $$are$$,
  $$is$$,
  $$were$$,
  $$have$$,
  $$"Neither" is singular, so the verb must be singular: "Neither of the two candidates is suitable".$$);

-- Section 2 — Quantitative Reasoning (Q9–Q17; Q18 dropped)
select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 9, $$QUANT$$, $$Algebra$$, $$medium$$, $$If x + 1/x = 3, then x² + 1/x² equals:$$, 'A',
  $$7$$,
  $$8$$,
  $$9$$,
  $$10$$,
  $$(x + 1/x)² = x² + 2 + 1/x² = 9, so x² + 1/x² = 9 − 2 = 7.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 10, $$QUANT$$, $$Algebra$$, $$easy$$, $$The roots of the equation x² − 5x + 6 = 0 are:$$, 'A',
  $$2 and 3$$,
  $$−2 and −3$$,
  $$1 and 6$$,
  $$5 and 1$$,
  $$Factorise: x² − 5x + 6 = (x − 2)(x − 3) = 0, so the roots are 2 and 3.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 11, $$QUANT$$, $$Statistics$$, $$easy$$, $$If the arithmetic mean of 5 numbers is 20 and four of them are 15, 18, 22 and 25, the fifth number is:$$, 'B',
  $$18$$,
  $$20$$,
  $$22$$,
  $$25$$,
  $$Sum = 5 × 20 = 100. The four given numbers sum to 80, so the fifth = 100 − 80 = 20.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 12, $$QUANT$$, $$Algebra$$, $$easy$$, $$The value of log₂ 8 + log₃ 9 is:$$, 'B',
  $$4$$,
  $$5$$,
  $$6$$,
  $$7$$,
  $$log₂ 8 = 3 and log₃ 9 = 2, so the sum is 3 + 2 = 5.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 13, $$QUANT$$, $$Arithmetic$$, $$medium$$, $$How many numbers between 100 and 300 are divisible by 7?$$, 'A',
  $$28$$,
  $$29$$,
  $$30$$,
  $$31$$,
  $$Smallest multiple ≥ 100 is 105 (15 × 7); largest ≤ 300 is 294 (42 × 7). Count = 42 − 15 + 1 = 28.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 14, $$QUANT$$, $$Geometry$$, $$easy$$, $$If sin θ = 3/5 and θ is acute, then cos θ is:$$, 'A',
  $$4/5$$,
  $$3/4$$,
  $$5/4$$,
  $$5/3$$,
  $$sin²θ + cos²θ = 1 → cos²θ = 1 − 9/25 = 16/25, so cos θ = 4/5 (positive for acute θ).$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 15, $$QUANT$$, $$Sequences and Series$$, $$medium$$, $$The sum of the first 20 terms of an AP whose first term is 5 and common difference is 3 is:$$, 'B',
  $$650$$,
  $$670$$,
  $$690$$,
  $$710$$,
  $$S_n = (n/2)[2a + (n − 1)d] = (20/2)[2(5) + 19(3)] = 10[10 + 57] = 670.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 16, $$QUANT$$, $$Algebra$$, $$medium$$, $$If A = [[2, 3], [1, 4]], then det(A) is:$$, 'A',
  $$5$$,
  $$8$$,
  $$11$$,
  $$14$$,
  $$det(A) = (2)(4) − (3)(1) = 8 − 3 = 5.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 2, 17, $$QUANT$$, $$Probability$$, $$easy$$, $$The probability of getting a sum of 7 when two dice are thrown is:$$, 'A',
  $$1/6$$,
  $$5/36$$,
  $$1/9$$,
  $$7/36$$,
  $$Favourable outcomes: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 out of 36 → 6/36 = 1/6.$$);

-- Section 3 — Analytical Reasoning (Q19–Q26)
select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 3, 18, $$ANALY$$, $$Coding Decoding$$, $$hard$$, $$If in a certain code "COMPUTER" is written as "RFUVQNPC", how is "MEDICINE" written?$$, 'B',
  $$MFEDJJOE$$,
  $$EOJDJEFM$$,
  $$MFEJDJOE$$,
  $$EOJDEJFM$$,
  $$Reverse the word, then shift only the inner letters +1: MEDICINE → ENICIDEM → E O J D J E F M = EOJDJEFM (first and last letters stay fixed).$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 3, 19, $$ANALY$$, $$Syllogisms$$, $$medium$$, $$Statements: All books are papers. Some papers are pens. Conclusions: I. Some books are pens. II. Some pens are books.$$, 'D',
  $$Only I follows$$,
  $$Only II follows$$,
  $$Either I or II follows$$,
  $$Neither follows$$,
  $$The pens overlap only part of the papers, which may lie entirely outside the books. Neither conclusion necessarily follows.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 3, 20, $$ANALY$$, $$Logic Puzzles$$, $$medium$$, $$In a family of six, A is the father of B. C is the mother of B and D. E is the brother of D. F is the brother of A. How is C related to F?$$, 'B',
  $$Sister$$,
  $$Sister-in-law$$,
  $$Mother$$,
  $$Aunt$$,
  $$C is A's wife (mother of his children). F is A's brother, so C is F's sister-in-law.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 3, 21, $$ANALY$$, $$Number Patterns$$, $$easy$$, $$Find the next number in the series: 2, 6, 12, 20, 30, ?$$, 'B',
  $$40$$,
  $$42$$,
  $$44$$,
  $$46$$,
  $$Differences are 4, 6, 8, 10, so the next difference is 12: 30 + 12 = 42.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 3, 22, $$ANALY$$, $$Logical Ordering$$, $$easy$$, $$If A is taller than B, B is taller than C, and C is taller than D, who is the shortest?$$, 'D',
  $$A$$,
  $$B$$,
  $$C$$,
  $$D$$,
  $$A > B > C > D, so D is the shortest.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 3, 23, $$ANALY$$, $$Letter Patterns$$, $$easy$$, $$Which comes next in the series: AZ, BY, CX, ?$$, 'A',
  $$DW$$,
  $$EV$$,
  $$FU$$,
  $$GT$$,
  $$First letter advances +1 (A, B, C, D); second letter moves back −1 (Z, Y, X, W). So the next term is DW.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 3, 24, $$ANALY$$, $$Logic Puzzles$$, $$hard$$, $$Pointing to a photograph, a man said, "I have no brother or sister but that man's father is my father's son." Whose photograph is it?$$, 'B',
  $$His own$$,
  $$His son's$$,
  $$His father's$$,
  $$His nephew's$$,
  $$The man has no siblings, so "my father's son" is the man himself. Therefore "that man's father" is the speaker, and the photograph is of his son.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 3, 25, $$ANALY$$, $$Logic Puzzles$$, $$easy$$, $$If the day before yesterday was Thursday, what day will it be the day after tomorrow?$$, 'B',
  $$Sunday$$,
  $$Monday$$,
  $$Tuesday$$,
  $$Wednesday$$,
  $$Day before yesterday = Thursday → today = Saturday → day after tomorrow = Monday.$$);

-- Section 4 — Physics (Q27–Q34)
select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 4, 26, $$PHY$$, $$Mechanics$$, $$medium$$, $$The dimensional formula of Planck's constant is:$$, 'A',
  $$[ML²T⁻¹]$$,
  $$[ML²T⁻²]$$,
  $$[MLT⁻¹]$$,
  $$[ML²T⁻³]$$,
  $$Energy E = hν → h = E/ν, so [h] = [ML²T⁻²]/[T⁻¹] = [ML²T⁻¹].$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 4, 27, $$PHY$$, $$Mechanics$$, $$easy$$, $$A body is projected vertically upward. At the highest point its:$$, 'C',
  $$Velocity is zero and acceleration is zero$$,
  $$Velocity is maximum and acceleration is zero$$,
  $$Velocity is zero and acceleration is g downward$$,
  $$Velocity is maximum and acceleration is g downward$$,
  $$At the highest point the velocity is momentarily zero, but the acceleration due to gravity g acts downward throughout the motion.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 4, 28, $$PHY$$, $$Electricity$$, $$easy$$, $$The unit of electric field intensity is:$$, 'D',
  $$N/C$$,
  $$J/C$$,
  $$V/m$$,
  $$Both A and C$$,
  $$Electric field intensity is measured in N/C (newton per coulomb) which is equivalent to V/m (volt per metre).$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 4, 29, $$PHY$$, $$Thermodynamics$$, $$medium$$, $$In an isothermal process, the internal energy of an ideal gas:$$, 'C',
  $$Increases$$,
  $$Decreases$$,
  $$Remains constant$$,
  $$First increases then decreases$$,
  $$For an ideal gas, internal energy depends only on temperature. In an isothermal process T is constant, so the internal energy remains constant.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 4, 30, $$PHY$$, $$Optics$$, $$easy$$, $$The focal length of a convex lens is 20 cm. Its power is:$$, 'A',
  $$+5 D$$,
  $$−5 D$$,
  $$+0.05 D$$,
  $$−0.05 D$$,
  $$Power P = 1/f (in metres) = 1/0.20 = +5 dioptres (positive for a convex lens).$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 4, 31, $$PHY$$, $$Optics$$, $$easy$$, $$Which of the following has the highest refractive index?$$, 'C',
  $$Glass$$,
  $$Water$$,
  $$Diamond$$,
  $$Air$$,
  $$Diamond has the highest refractive index (≈ 2.42) among the options.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 4, 32, $$PHY$$, $$Mechanics$$, $$medium$$, $$The half-life of a radioactive substance is 10 days. The fraction remaining after 30 days is:$$, 'C',
  $$1/2$$,
  $$1/4$$,
  $$1/8$$,
  $$1/16$$,
  $$30 days = 3 half-lives, so the remaining fraction = (1/2)³ = 1/8.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 4, 33, $$PHY$$, $$Electricity$$, $$easy$$, $$Kirchhoff's first law is based on conservation of:$$, 'B',
  $$Energy$$,
  $$Charge$$,
  $$Momentum$$,
  $$Mass$$,
  $$Kirchhoff's current law (first law) states that current entering a junction equals current leaving it — a consequence of conservation of charge.$$);

-- Section 5 — Chemistry (Q35–Q40)
select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 5, 34, $$CHEM$$, $$Acids and Bases$$, $$easy$$, $$The pH of a 0.001 M HCl solution is:$$, 'C',
  $$1$$,
  $$2$$,
  $$3$$,
  $$4$$,
  $$HCl is a strong acid, so [H⁺] = 0.001 M. pH = −log(0.001) = 3.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 5, 35, $$CHEM$$, $$Chemical Bonding$$, $$medium$$, $$Which of the following is a Lewis acid?$$, 'B',
  $$NH₃$$,
  $$BF₃$$,
  $$H₂O$$,
  $$OH⁻$$,
  $$BF₃ has an incomplete octet and accepts an electron pair, making it a Lewis acid. NH₃, H₂O and OH⁻ are electron-pair donors (Lewis bases).$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 5, 36, $$CHEM$$, $$Atomic Structure$$, $$easy$$, $$The oxidation number of Mn in KMnO₄ is:$$, 'C',
  $$+5$$,
  $$+6$$,
  $$+7$$,
  $$+4$$,
  $$K is +1 and each O is −2 (total −8). So Mn = +1 − (−8) = +7 (since the compound is neutral: +1 + Mn + 4(−2) = 0 → Mn = +7).$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 5, 37, $$CHEM$$, $$Atomic Structure$$, $$easy$$, $$Which gas is responsible for the greenhouse effect the most?$$, 'A',
  $$CO₂$$,
  $$CH₄$$,
  $$N₂O$$,
  $$O₃$$,
  $$By total contribution, carbon dioxide is the most significant greenhouse gas driving global warming, even though CH₄ and N₂O are more potent per molecule.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 5, 38, $$CHEM$$, $$Organic Chemistry$$, $$easy$$, $$The hybridisation of carbon in ethyne (C₂H₂) is:$$, 'A',
  $$sp$$,
  $$sp²$$,
  $$sp³$$,
  $$dsp²$$,
  $$Each carbon in ethyne forms two sigma bonds and two pi bonds (triple bond), so it is sp hybridised.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 5, 39, $$CHEM$$, $$Periodic Table$$, $$easy$$, $$Which of the following is NOT an alkali metal?$$, 'C',
  $$Sodium$$,
  $$Potassium$$,
  $$Calcium$$,
  $$Lithium$$,
  $$Sodium, potassium and lithium are Group-1 alkali metals. Calcium is a Group-2 alkaline earth metal, so it is the answer.$$);

-- Section 6 — Biology (Q41–Q45; Q41 "powerhouse" dropped — near-duplicate)
select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 6, 40, $$BIO$$, $$Human Biology$$, $$easy$$, $$Which blood group is the universal donor?$$, 'D',
  $$A$$,
  $$B$$,
  $$AB$$,
  $$O$$,
  $$Type O negative blood has no A, B or Rh antigens, so it can be donated to any blood group — the universal donor.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 6, 41, $$BIO$$, $$Genetics$$, $$easy$$, $$DNA replication is:$$, 'B',
  $$Conservative$$,
  $$Semi-conservative$$,
  $$Dispersive$$,
  $$Non-conservative$$,
  $$DNA replication is semi-conservative (Meselson–Stahl experiment): each new DNA molecule contains one parental and one new strand.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 6, 42, $$BIO$$, $$Human Biology$$, $$easy$$, $$The functional unit of the kidney is:$$, 'B',
  $$Neuron$$,
  $$Nephron$$,
  $$Alveolus$$,
  $$Osteon$$,
  $$The nephron is the structural and functional unit of the kidney, responsible for filtering blood and forming urine.$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 6, 43, $$BIO$$, $$Human Biology$$, $$easy$$, $$Which vitamin is synthesised in the human skin in the presence of sunlight?$$, 'D',
  $$Vitamin A$$,
  $$Vitamin B$$,
  $$Vitamin C$$,
  $$Vitamin D$$,
  $$Vitamin D is synthesised in the skin when it is exposed to sunlight (UV-B radiation).$$);

-- Section 7 — General Knowledge (Q46–Q50; near-duplicate items dropped)
select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 7, 44, $$GK$$, $$World Geography$$, $$easy$$, $$The currency of Japan is:$$, 'B',
  $$Yuan$$,
  $$Yen$$,
  $$Won$$,
  $$Ringgit$$,
  $$The currency of Japan is the Japanese yen (¥).$$);

select "public"."seed_mock_question"($$Bahria University — Sectional Mock Test$$, $$45 MCQs · 60 minutes · 1 mark each · no negative marking$$, 7, 45, $$GK$$, $$Pakistan Studies$$, $$easy$$, $$Pakistan became a nuclear power in the year:$$, 'B',
  $$1974$$,
  $$1998$$,
  $$2000$$,
  $$1996$$,
  $$Pakistan conducted its nuclear tests on 28 May 1998, becoming a declared nuclear power.$$);
