-- 0011_seed_taxonomy.sql
-- BUET Prep AI — seed universities, programs, test configurations, subjects, topics
-- Based on publicly published BUET structure.

-- =============================================================
-- UNIVERSITY
-- =============================================================
insert into "public"."universities" (code, name, country, is_active) values
  ('BU', 'Bahria University', 'Pakistan', true)
on conflict (code) do nothing;

-- =============================================================
-- PROGRAMS
-- =============================================================
insert into "public"."programs" (university_id, code, name, description, campus, degree_level) values
  ((select id from "public"."universities" where code = 'BU'),
   'BBA', 'Bachelor of Business Administration', 'Management/Business program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'),
   'BS-CS', 'BS Computer Science', 'Computing program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'),
   'BDS', 'Bachelor of Dental Surgery', 'Medical Sciences program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'),
   'MBBS', 'Bachelor of Medicine and Bachelor of Surgery', 'Medical Sciences program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'),
   'BS-ENG', 'BS English', 'English/Humanities program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'),
   'BS-PSY', 'BS Psychology', 'Social Sciences program', 'Islamabad/others', 'undergraduate'),
  ((select id from "public"."universities" where code = 'BU'),
   'BS-IS', 'BS Islamic Studies', 'Humanities program', 'Islamabad/others', 'undergraduate')
on conflict (university_id, code) do nothing;

-- =============================================================
-- SUBJECTS
-- =============================================================
insert into "public"."subjects" (code, name, category, description, sort_order) values
  ('ENG', 'English / Verbal', 'verbal', 'Grammar, vocabulary, sentence correction, reading comprehension', 1),
  ('QUANT', 'Quantitative Reasoning', 'quantitative', 'Arithmetic, algebra, geometry, probability, statistics', 2),
  ('ANALY', 'Analytical Reasoning', 'analytical', 'Logic, sequences, patterns, puzzles, critical reasoning', 3),
  ('GK', 'General Knowledge', 'general_knowledge', 'Pakistan studies, geography, history, science, current affairs', 4),
  ('PHY', 'Physics', 'science', 'Mechanics, waves, electricity, magnetism, optics, thermodynamics', 5),
  ('CHEM', 'Chemistry', 'science', 'Atomic structure, bonding, stoichiometry, organic/inorganic chemistry', 6),
  ('BIO', 'Biology', 'medical', 'Cell biology, genetics, human biology, ecology, evolution', 7)
on conflict (code) do nothing;

-- =============================================================
-- TEST CONFIGURATIONS (database-driven BUET structure)
-- =============================================================
-- BUET: 100 MCQs, 100 marks, 120 minutes, 4 options, no negative marking.
-- Subject distributions per program group (publicly published).

insert into "public"."test_configurations"
  (program_id, university_id, name, description, total_questions, total_marks, duration_minutes, negative_marking, pass_percentage)
select p.id, u.id, 'BUET — Management/Business/Media', '100 MCQs · 120 min · no negative marking',
       100, 100, 120, false, 50
from "public"."programs" p
join "public"."universities" u on u.id = p.university_id
where p.code in ('BBA')
on conflict do nothing;

insert into "public"."test_configurations"
  (program_id, university_id, name, description, total_questions, total_marks, duration_minutes, negative_marking, pass_percentage)
select p.id, u.id, 'BUET — Computing', '100 MCQs · 120 min · no negative marking',
       100, 100, 120, false, 50
from "public"."programs" p
join "public"."universities" u on u.id = p.university_id
where p.code in ('BS-CS')
on conflict do nothing;

insert into "public"."test_configurations"
  (program_id, university_id, name, description, total_questions, total_marks, duration_minutes, negative_marking, pass_percentage)
select p.id, u.id, 'BUET — Medical Sciences', '100 MCQs · 120 min · no negative marking',
       100, 100, 120, false, 60
from "public"."programs" p
join "public"."universities" u on u.id = p.university_id
where p.code in ('BDS','MBBS')
on conflict do nothing;

insert into "public"."test_configurations"
  (program_id, university_id, name, description, total_questions, total_marks, duration_minutes, negative_marking, pass_percentage)
select p.id, u.id, 'BUET — Psychology/English/Islamic Studies', '100 MCQs · 120 min · no negative marking',
       100, 100, 120, false, 50
from "public"."programs" p
join "public"."universities" u on u.id = p.university_id
where p.code in ('BS-ENG','BS-PSY','BS-IS')
on conflict do nothing;

-- =============================================================
-- TEST SECTIONS (subject distribution per config)
-- =============================================================
-- Management/Business/Media: Verbal 50%, Quantitative 15%, Analytical 15%, GK 20%
insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name,
       case s.code
         when 'ENG'   then 50
         when 'QUANT' then 15
         when 'ANALY' then 15
         when 'GK'    then 20
       end,
       case s.code
         when 'ENG'   then 50
         when 'QUANT' then 15
         when 'ANALY' then 15
         when 'GK'    then 20
       end,
       case s.code
         when 'ENG'   then 1
         when 'QUANT' then 2
         when 'ANALY' then 3
         when 'GK'    then 4
       end
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code in ('ENG','QUANT','ANALY','GK')
where p.code in ('BBA')
  and s.code in ('ENG','QUANT','ANALY','GK')
on conflict (test_config_id, subject_id) do nothing;

-- Computing: Verbal 40%, Quantitative 20%, Analytical 20%, GK 20%
insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name,
       case s.code
         when 'ENG'   then 40
         when 'QUANT' then 20
         when 'ANALY' then 20
         when 'GK'    then 20
       end,
       case s.code
         when 'ENG'   then 40
         when 'QUANT' then 20
         when 'ANALY' then 20
         when 'GK'    then 20
       end,
       case s.code
         when 'ENG'   then 1
         when 'QUANT' then 2
         when 'ANALY' then 3
         when 'GK'    then 4
       end
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code in ('ENG','QUANT','ANALY','GK')
where p.code in ('BS-CS')
  and s.code in ('ENG','QUANT','ANALY','GK')
on conflict (test_config_id, subject_id) do nothing;

-- Medical: Verbal 25%, Physics 25%, Chemistry 25%, Biology 25%
insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name, 25, 25,
       case s.code
         when 'ENG'  then 1
         when 'PHY'  then 2
         when 'CHEM' then 3
         when 'BIO'  then 4
       end
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code in ('ENG','PHY','CHEM','BIO')
where p.code in ('BDS','MBBS')
  and s.code in ('ENG','PHY','CHEM','BIO')
on conflict (test_config_id, subject_id) do nothing;

-- Psychology/English/Islamic Studies: English 50%, GK 25%, Verbal Reasoning 25%
insert into "public"."test_sections" (test_config_id, subject_id, name, question_count, marks, order_index)
select tc.id, s.id, s.name,
       case s.code
         when 'ENG'   then 50
         when 'GK'    then 25
         when 'ANALY' then 25
       end,
       case s.code
         when 'ENG'   then 50
         when 'GK'    then 25
         when 'ANALY' then 25
       end,
       case s.code
         when 'ENG'   then 1
         when 'GK'    then 2
         when 'ANALY' then 3
       end
from "public"."test_configurations" tc
join "public"."programs" p on p.id = tc.program_id
join "public"."subjects" s on s.code in ('ENG','GK','ANALY')
where p.code in ('BS-ENG','BS-PSY','BS-IS')
  and s.code in ('ENG','GK','ANALY')
on conflict (test_config_id, subject_id) do nothing;
