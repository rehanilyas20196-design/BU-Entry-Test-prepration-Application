-- 0012_seed_topics.sql
-- BUET Prep AI — seed topics for all subjects

-- ENGLISH / VERBAL
insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'ENG'), 'Grammar', 'Sentence correction, error detection, parts of speech'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Vocabulary', 'Synonyms, antonyms, word meanings'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Sentence Completion', 'Fill in the blank with the best word/phrase'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Reading Comprehension', 'Passage-based understanding and inference'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Tenses', 'Present, past, future tense usage'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Prepositions', 'Correct preposition usage'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Articles', 'a, an, the usage'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Subject-Verb Agreement', 'Agreement between subject and verb'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Active-Passive Voice', 'Voice transformation'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Direct-Indirect Speech', 'Narration transformation')
on conflict (subject_id, name) do nothing;

-- QUANTITATIVE
insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'QUANT'), 'Arithmetic', 'Basic operations, order of operations'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Percentages', 'Percent change, applications'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Ratios and Proportions', 'Ratio, proportion, direct/inverse'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Algebra', 'Linear and quadratic equations, exponents'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Sequences and Series', 'Arithmetic and geometric sequences'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Geometry', 'Angles, triangles, circles, areas'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Probability', 'Basic probability, combinatorics'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Statistics', 'Mean, median, mode, averages'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Word Problems', 'Application problems'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Profit and Loss', 'Business math'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Time and Work', 'Work rate problems'),
  ((select id from "public"."subjects" where code = 'QUANT'), 'Speed Distance Time', 'Motion problems')
on conflict (subject_id, name) do nothing;

-- ANALYTICAL
insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'ANALY'), 'Number Patterns', 'Find next number in sequence'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Letter Patterns', 'Alphabet series and coding'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Coding Decoding', 'Decode coded messages'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Analogies', 'Word and number analogies'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Logical Ordering', 'Arrangement and ordering'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Classification', 'Odd one out, grouping'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Syllogisms', 'Statements and conclusions'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Logic Puzzles', 'Deductive reasoning puzzles'),
  ((select id from "public"."subjects" where code = 'ANALY'), 'Critical Reasoning', 'Arguments, assumptions, inferences')
on conflict (subject_id, name) do nothing;

-- GENERAL KNOWLEDGE
insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'GK'), 'Pakistan Studies', 'History, geography, constitution of Pakistan'),
  ((select id from "public"."subjects" where code = 'GK'), 'World Geography', 'Capitals, countries, physical geography'),
  ((select id from "public"."subjects" where code = 'GK'), 'World History', 'Major events and eras'),
  ((select id from "public"."subjects" where code = 'GK'), 'Science and Technology', 'Discoveries, inventions, technology'),
  ((select id from "public"."subjects" where code = 'GK'), 'Organizations', 'International organizations and bodies'),
  ((select id from "public"."subjects" where code = 'GK'), 'Important Personalities', 'Famous figures and their contributions'),
  ((select id from "public"."subjects" where code = 'GK'), 'Current Affairs', 'Recent national and international events')
on conflict (subject_id, name) do nothing;

-- PHYSICS
insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'PHY'), 'Mechanics', 'Motion, force, energy, momentum'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Waves and Sound', 'Wave properties, sound'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Electricity', 'Current, circuits, resistance'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Magnetism', 'Magnetic fields, electromagnetism'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Optics', 'Light, reflection, refraction'),
  ((select id from "public"."subjects" where code = 'PHY'), 'Thermodynamics', 'Heat, temperature, laws of thermodynamics')
on conflict (subject_id, name) do nothing;

-- CHEMISTRY
insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'CHEM'), 'Atomic Structure', 'Atoms, subatomic particles, electron configuration'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Periodic Table', 'Periodicity, groups and periods'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Chemical Bonding', 'Ionic, covalent, metallic bonds'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Stoichiometry', 'Moles, balancing, reaction quantities'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Acids and Bases', 'pH, neutralization'),
  ((select id from "public"."subjects" where code = 'CHEM'), 'Organic Chemistry', 'Hydrocarbons, functional groups')
on conflict (subject_id, name) do nothing;

-- BIOLOGY
insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'BIO'), 'Cell Biology', 'Cell structure and function'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Genetics', 'Inheritance, DNA, genes'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Human Biology', 'Organ systems, physiology'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Ecology', 'Ecosystems, environment'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Evolution', 'Natural selection, origins'),
  ((select id from "public"."subjects" where code = 'BIO'), 'Biomolecules', 'Carbohydrates, proteins, lipids, nucleic acids')
on conflict (subject_id, name) do nothing;
