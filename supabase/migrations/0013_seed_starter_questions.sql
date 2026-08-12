-- 0013_seed_starter_questions.sql
-- BUET Prep AI — starter set of ORIGINAL approved practice questions
-- These are original AI/human-authored practice questions, NOT official Bahria questions.
-- Each row carries provenance metadata per the content policy.
-- The production question bank is grown via the AI generation pipeline in batches.

-- Helper to insert a question and its options atomically.
create or replace function "public"."seed_question"(
  p_subject_code text,
  p_topic_name text,
  p_difficulty "public"."difficulty",
  p_question text,
  p_correct "char",
  p_a text, p_b text, p_c text, p_d text,
  p_explanation text,
  p_solution jsonb,
  p_hint text
) returns void language plpgsql as $$
declare
  q_id uuid;
  opt text[];
  keys text[] := array['A','B','C','D'];
  i int;
begin
  insert into "public"."questions"
    (subject_id, topic_id, difficulty, question_text, correct_option, explanation, solution_steps, hint,
     is_original, is_official_sample, review_status, generated_by, source_type, source_reference, copyright_status, reviewed)
  values
    ((select id from "public"."subjects" where code = p_subject_code),
     (select id from "public"."topics" where subject_id = (select id from "public"."subjects" where code = p_subject_code) and name = p_topic_name),
     p_difficulty, p_question, p_correct, p_explanation, p_solution, p_hint,
     true, false, 'approved', 'AI', 'ORIGINAL_AI',
     'Original AI-generated practice question', 'original', true)
  returning id into q_id;

  opt := array[p_a, p_b, p_c, p_d];
  for i in 1..4 loop
    insert into "public"."question_options" (question_id, option_key, option_text, is_correct, order_index)
    values (q_id, keys[i], opt[i], (keys[i] = p_correct), i - 1);
  end loop;

  insert into "public"."question_sources" (question_id, source_type, source_reference, copyright_status, is_original)
  values (q_id, 'ORIGINAL_AI', 'Original AI-generated practice question', 'original', true);
end;
$$;

-- The "exactly 4 options" rule is a multi-row invariant, so the trigger from
-- 0003 (which fires after each row) cannot validate options inserted one at a
-- time. Re-create it as a deferred constraint trigger that runs at commit.
drop trigger if exists trg_validate_options_aiud on "public"."question_options";
create constraint trigger trg_validate_options_aiud
  after insert or update or delete on "public"."question_options"
  deferrable initially deferred
  for each row execute function "public"."validate_question_options"();

-- =============================================================
-- ENGLISH / VERBAL
-- =============================================================
select "public"."seed_question"(
  'ENG', 'Grammar', 'easy',
  'Identify the sentence with a grammatical error.',
  'C',
  'She goes to the market every Friday.',
  'The children were playing in the garden.',
  'He have finished his homework before dinner.',
  'The committee has approved the new policy.',
  'The error is in option C: the third-person singular subject "He" requires "has", not "have". The correct form is "He has finished his homework before dinner."',
  '["Identify the subject (He) and its number (singular third person)", "Choose the matching auxiliary: has (singular) vs have (plural)", "Correct: He has finished..."]',
  'Think about subject-verb agreement for third-person singular present perfect.'
);

select "public"."seed_question"(
  'ENG', 'Vocabulary', 'medium',
  'Choose the word most nearly OPPOSITE in meaning to "ephemeral".',
  'A',
  'Permanent',
  'Brief',
  'Fleeting',
  'Temporal',
  '"Ephemeral" means lasting for a very short time. Its opposite is "permanent" — lasting indefinitely. "Brief", "fleeting", and "temporal" are all synonyms or near-synonyms of ephemeral.',
  '["Define ephemeral = short-lived", "Identify the antonym among options: only Permanent denotes long duration"]',
  'Think about which option suggests a long, unchanging duration.'
);

select "public"."seed_question"(
  'ENG', 'Sentence Completion', 'medium',
  'The new policy was designed to ____ the burden of paperwork on small businesses, making compliance faster and cheaper.',
  'B',
  'aggravate',
  'alleviate',
  'magnify',
  'prolong',
  '"Alleviate" means to make (a burden) less severe. The context — faster, cheaper compliance — clearly indicates a reduction of burden. The other options all describe worsening or increasing the burden.',
  '["Note the positive outcome (faster, cheaper)", "Choose the word meaning to reduce/lessen a burden: alleviate"]',
  'The rest of the sentence signals a reduction, not an increase.'
);

-- =============================================================
-- QUANTITATIVE
-- =============================================================
select "public"."seed_question"(
  'QUANT', 'Percentages', 'easy',
  'A shirt is priced at Rs 2,500. During a sale the price is reduced by 20%. What is the sale price?',
  'A',
  'Rs 2,000',
  'Rs 1,800',
  'Rs 500',
  'Rs 2,100',
  '20% of 2500 = 0.20 × 2500 = 500. Sale price = 2500 − 500 = Rs 2,000.',
  '["Compute 20% of 2500 = 500", "Subtract the discount: 2500 - 500 = 2000"]',
  'First find the discount amount, then subtract it from the original price.'
);

select "public"."seed_question"(
  'QUANT', 'Algebra', 'medium',
  'If x² − 5x + 6 = 0, which of the following is a solution for x?',
  'D',
  'x = 6',
  'x = 1',
  'x = −3',
  'x = 2',
  'Factor the quadratic: x² − 5x + 6 = (x − 2)(x − 3) = 0, so x = 2 or x = 3. Of the given options, only x = 2 is a root. You can verify by substitution: 2² − 5(2) + 6 = 4 − 10 + 6 = 0.',
  '["Factor: (x-2)(x-3) = 0", "Set each factor to zero: x = 2, x = 3", "Check which value appears among the options: x = 2"]',
  'Look for two numbers that multiply to 6 and add to −5.'
);

select "public"."seed_question"(
  'QUANT', 'Word Problems', 'hard',
  'A train travels 240 km at a constant speed. If its speed had been 20 km/h more, the journey would have taken 1 hour less. What is the train''s actual speed in km/h?',
  'B',
  '50',
  '60',
  '80',
  '70',
  'Let speed = v and time = t. Then v·t = 240 and (v + 20)(t − 1) = 240. From the second equation: vt − v + 20t − 20 = 240. Since vt = 240, we get −v + 20t − 20 = 0 ⇒ v = 20t − 20. Substitute into vt = 240: (20t − 20)t = 240 ⇒ 20t² − 20t − 240 = 0 ⇒ t² − t − 12 = 0 ⇒ (t − 4)(t + 3) = 0 ⇒ t = 4. Hence v = 240/4 = 60 km/h.',
  '["Let vt = 240", "Set up (v+20)(t-1) = 240", "Expand and use vt = 240 to relate v and t", "Solve quadratic, t = 4", "v = 240/4 = 60"]',
  'Form two equations with the distance formula and eliminate one variable.'
);

-- =============================================================
-- ANALYTICAL
-- =============================================================
select "public"."seed_question"(
  'ANALY', 'Number Patterns', 'easy',
  'What number comes next in the series: 2, 6, 12, 20, 30, …?',
  'B',
  '40',
  '42',
  '44',
  '36',
  'The differences between consecutive terms are 4, 6, 8, 10 — increasing by 2 each time. The next difference is 12, so the next term is 30 + 12 = 42.',
  '["List differences: 4,6,8,10", "Next difference = 12", "Next term = 30 + 12 = 42"]',
  'Look at the gaps between consecutive terms — they follow a simple pattern.'
);

select "public"."seed_question"(
  'ANALY', 'Coding Decoding', 'medium',
  'In a certain code, CAT is written as DBU. How is DOG written in that code?',
  'A',
  'EPH',
  'CPH',
  'EQI',
  'DOH',
  'Each letter is shifted forward by one position in the alphabet: C→D, A→B, T→U. Applying the same rule: D→E, O→P, G→H, giving EPH.',
  '["Identify the transformation: +1 letter", "Apply: D+1=E, O+1=P, G+1=H"]',
  'Compare CAT and DBU letter by letter to find the rule.'
);

select "public"."seed_question"(
  'ANALY', 'Syllogisms', 'hard',
  'All scientists are logical. Some logical people are artists. Which conclusion necessarily follows?',
  'C',
  'All artists are scientists',
  'All scientists are artists',
  'Some logical people are scientists',
  'No artist is a scientist',
  'From "All scientists are logical", every scientist is in the set of logical people, so the set of scientists is a subset of logical people. Therefore some logical people must be scientists. The other conclusions are not guaranteed.',
  '["Draw the sets: scientists ⊆ logical people", "artists overlap logical people (partial)", "The only guaranteed statement: some logical people are scientists"]',
  'Focus only on what must be true given the two statements.'
);

-- =============================================================
-- GENERAL KNOWLEDGE
-- =============================================================
select "public"."seed_question"(
  'GK', 'Pakistan Studies', 'easy',
  'Which river flows through the city of Lahore?',
  'A',
  'Ravi',
  'Indus',
  'Chenab',
  'Jhelum',
  'The Ravi river flows along the northern edge of Lahore. The Indus, Chenab, and Jhelum flow elsewhere in Pakistan.',
  '[]',
  'A major city of Punjab is named after the river that borders it.'
);

select "public"."seed_question"(
  'GK', 'World Geography', 'medium',
  'Which of the following is the capital city of Australia?',
  'B',
  'Sydney',
  'Canberra',
  'Melbourne',
  'Perth',
  'Canberra is the capital of Australia. Sydney and Melbourne are major cities but are not capitals; Perth is a western coastal city.',
  '["Recall: the capital is not the largest city", "Canberra was purpose-built as the capital"]',
  'The capital is a purpose-built inland city, not a coastal hub.'
);

select "public"."seed_question"(
  'GK', 'Organizations', 'easy',
  'The headquarters of the United Nations is located in which city?',
  'C',
  'Geneva',
  'Paris',
  'New York',
  'London',
  'The UN headquarters is in New York City. Geneva and Paris host other international organizations, and London is not a UN headquarter site.',
  '[]',
  'Think of the iconic building on the East River.'
);

-- =============================================================
-- PHYSICS
-- =============================================================
select "public"."seed_question"(
  'PHY', 'Mechanics', 'medium',
  'A ball is dropped from rest. Ignoring air resistance, its speed after 3 seconds is approximately (g = 9.8 m/s²):',
  'D',
  '9.8 m/s',
  '19.6 m/s',
  '24.5 m/s',
  '29.4 m/s',
  'Under constant acceleration from rest: v = g·t = 9.8 × 3 = 29.4 m/s.',
  '["Use v = u + at with u = 0", "v = 9.8 × 3 = 29.4 m/s"]',
  'Apply the first kinematic equation for free fall from rest.'
);

select "public"."seed_question"(
  'PHY', 'Electricity', 'easy',
  'Which unit measures electrical resistance?',
  'A',
  'Ohm',
  'Volt',
  'Ampere',
  'Watt',
  'Resistance is measured in ohms (Ω). The volt measures potential difference, the ampere measures current, and the watt measures power.',
  '["Recall the defining unit of resistance"]',
  'Named after the German physicist Georg Ohm.'
);

-- =============================================================
-- CHEMISTRY
-- =============================================================
select "public"."seed_question"(
  'CHEM', 'Atomic Structure', 'easy',
  'Which subatomic particle carries a negative charge?',
  'B',
  'Proton',
  'Electron',
  'Neutron',
  'Nucleus',
  'Electrons carry a negative charge. Protons are positive, neutrons are neutral, and the nucleus is the central positive region containing protons and neutrons.',
  '[]',
  'The particle that orbits the nucleus.'
);

select "public"."seed_question"(
  'CHEM', 'Stoichiometry', 'medium',
  'How many moles of water are produced when 2 moles of hydrogen react completely with excess oxygen? 2H₂ + O₂ → 2H₂O',
  'C',
  '1 mole',
  '3 moles',
  '2 moles',
  '4 moles',
  'From the balanced equation, 2 mol of H₂ produces 2 mol of H₂O (1:1 ratio for H₂ to H₂O). Oxygen is in excess, so hydrogen is the limiting reactant.',
  '["Read the balanced equation", "Ratio H₂ : H₂O = 1 : 1", "2 mol H₂ → 2 mol H₂O"]',
  'Use the mole ratio straight from the balanced equation.'
);

-- =============================================================
-- BIOLOGY
-- =============================================================
select "public"."seed_question"(
  'BIO', 'Cell Biology', 'easy',
  'Which organelle is known as the "powerhouse of the cell"?',
  'D',
  'Nucleus',
  'Ribosome',
  'Golgi apparatus',
  'Mitochondrion',
  'The mitochondrion is the site of cellular respiration and produces most of the cell''s ATP, hence the nickname "powerhouse of the cell".',
  '[]',
  'Think of where ATP is mainly produced.'
);

select "public"."seed_question"(
  'BIO', 'Genetics', 'medium',
  'In Mendelian genetics, if two heterozygous tall plants (Tt) are crossed, what fraction of the offspring would be expected to be tall? Tall (T) is dominant over short (t).',
  'C',
  '1/4',
  '1/2',
  '3/4',
  'All',
  'A Tt × Tt cross yields a 1:2:1 genotypic ratio (TT : Tt : tt). Both TT and Tt are tall, so 3 out of 4 offspring (3/4) are expected to be tall.',
  '["Set up the Punnett square: TT, Tt, Tt, tt", "Tall phenotypes = TT + Tt = 3 of 4", "Fraction = 3/4"]',
  'Only the tt genotype is short.'
);

-- Cleanup helper (not needed at runtime; leave for admin use)
-- drop function if exists "public"."seed_question";
