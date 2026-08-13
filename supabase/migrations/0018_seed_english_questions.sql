-- 0018_seed_english_questions.sql
-- BUET Prep AI — original English / Verbal practice questions (100 MCQs)
-- Covers the five areas common in entry tests (NTS, university admission tests, etc.):
--   Synonyms, Antonyms, Analogies, Sentence Completion, One-Word Substitution & Idioms,
--   Error Detection, Prepositions, Tenses & Sentence Correction, Reading Comprehension,
--   and Mixed Grammar & Vocabulary.
-- All questions are original practice items (ORIGINAL_AI, approved).

insert into "public"."topics" (subject_id, name, description) values
  ((select id from "public"."subjects" where code = 'ENG'), 'Analogies', 'Word analogies: X is to Y as A is to B'),
  ((select id from "public"."subjects" where code = 'ENG'), 'Idioms and Phrases', 'Common idioms, phrasal expressions, one-word substitution')
on conflict (subject_id, name) do nothing;

-- =============================================================
-- SECTION A: SYNONYMS (1–10) — Vocabulary
-- =============================================================
select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "ABUNDANT".$$, 'B',
  $$Scarce$$, $$Plentiful$$, $$Weak$$, $$Limited$$,
  $$"Abundant" means existing in large quantity — plentiful. "Scarce", "weak", and "limited" all describe a small amount.$$,
  '[]',
  $$Think of a plentiful harvest.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "CANDID".$$, 'B',
  $$Dishonest$$, $$Frank$$, $$Shy$$, $$Hidden$$,
  $$"Candid" means open, honest, and straightforward — frank.$$,
  '[]',
  $$A candid person gives an honest answer.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "DILIGENT".$$, 'B',
  $$Lazy$$, $$Hardworking$$, $$Careless$$, $$Slow$$,
  $$"Diligent" means showing steady, earnest effort — hardworking. "Lazy" is its opposite.$$,
  '[]',
  $$A diligent student studies every day.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "ELOQUENT".$$, 'A',
  $$Fluent$$, $$Silent$$, $$Confused$$, $$Rude$$,
  $$"Eloquent" means fluent, forceful, and persuasive in speaking — fluent.$$,
  '[]',
  $$An eloquent speaker uses words well.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "FRUGAL".$$, 'B',
  $$Wasteful$$, $$Thrifty$$, $$Generous$$, $$Rich$$,
  $$"Frugal" means economical and careful with money — thrifty. "Wasteful" is its opposite.$$,
  '[]',
  $$A frugal person saves rather than spends freely.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "GENUINE".$$, 'B',
  $$Fake$$, $$Authentic$$, $$Doubtful$$, $$Strange$$,
  $$"Genuine" means real and authentic — not fake.$$,
  '[]',
  $$A genuine signature is real, not forged.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "HOSTILE".$$, 'B',
  $$Friendly$$, $$Antagonistic$$, $$Calm$$, $$Neutral$$,
  $$"Hostile" means unfriendly and aggressive — antagonistic. "Friendly" is its opposite.$$,
  '[]',
  $$Hostile forces oppose each other.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "IMMINENT".$$, 'B',
  $$Distant$$, $$Impending$$, $$Unlikely$$, $$Past$$,
  $$"Imminent" means about to happen soon — impending.$$,
  '[]',
  $$An imminent storm is about to strike.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "JUBILANT".$$, 'B',
  $$Sad$$, $$Elated$$, $$Angry$$, $$Tired$$,
  $$"Jubilant" means feeling great joy — elated. "Sad" is its opposite.$$,
  '[]',
  $$A jubilant crowd celebrates a victory.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly the SAME in meaning as "LUCID".$$, 'B',
  $$Confusing$$, $$Clear$$, $$Dark$$, $$Complex$$,
  $$"Lucid" means expressed clearly and easy to understand — clear.$$,
  '[]',
  $$A lucid explanation is easy to follow.$$);

-- =============================================================
-- SECTION B: ANTONYMS (11–20) — Vocabulary
-- =============================================================
select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "BENEVOLENT".$$, 'B',
  $$Kind$$, $$Malicious$$, $$Generous$$, $$Caring$$,
  $$"Benevolent" means kindly and generous. Its opposite is "malicious" — intending harm.$$,
  '[]',
  $$Think of the opposite of goodwill.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "CONCISE".$$, 'B',
  $$Brief$$, $$Verbose$$, $$Short$$, $$Clear$$,
  $$"Concise" means brief and to the point. Its opposite is "verbose" — using too many words.$$,
  '[]',
  $$A verbose reply is wordy.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "DILUTE".$$, 'B',
  $$Weaken$$, $$Concentrate$$, $$Thin$$, $$Water down$$,
  $$"Dilute" means to make weaker or thinner. Its opposite is "concentrate" — to make stronger.$$,
  '[]',
  $$Dilute adds water; concentrate removes it.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "EXPAND".$$, 'B',
  $$Grow$$, $$Contract$$, $$Extend$$, $$Enlarge$$,
  $$"Expand" means to become larger. Its opposite is "contract" — to become smaller.$$,
  '[]',
  $$Gas expands when heated and contracts when cooled.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "FRIVOLOUS".$$, 'B',
  $$Silly$$, $$Serious$$, $$Playful$$, $$Trivial$$,
  $$"Frivolous" means not serious or trivial. Its opposite is "serious".$$,
  '[]',
  $$A frivolous remark is light or silly.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "GENEROUS".$$, 'B',
  $$Giving$$, $$Stingy$$, $$Kind$$, $$Charitable$$,
  $$"Generous" means giving freely. Its opposite is "stingy" — unwilling to give.$$,
  '[]',
  $$A stingy person hates to share.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "HAZARDOUS".$$, 'B',
  $$Risky$$, $$Safe$$, $$Dangerous$$, $$Unstable$$,
  $$"Hazardous" means risky or dangerous. Its opposite is "safe".$$,
  '[]',
  $$A hazardous road becomes safe after repairs.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "INNOCENT".$$, 'B',
  $$Pure$$, $$Guilty$$, $$Naive$$, $$Blameless$$,
  $$"Innocent" means not guilty. Its opposite is "guilty".$$,
  '[]',
  $$The verdict was guilty, not innocent.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "JOVIAL".$$, 'B',
  $$Cheerful$$, $$Gloomy$$, $$Happy$$, $$Lively$$,
  $$"Jovial" means cheerful and friendly. Its opposite is "gloomy" — sad and pessimistic.$$,
  '[]',
  $$A jovial host contrasts with a gloomy guest.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'easy',
  $$Choose the word most nearly OPPOSITE in meaning to "KEEN".$$, 'B',
  $$Eager$$, $$Indifferent$$, $$Sharp$$, $$Enthusiastic$$,
  $$"Keen" means eager or enthusiastic. Its opposite is "indifferent" — uninterested.$$,
  '[]',
  $$A keen learner is anything but indifferent.$$);

-- =============================================================
-- SECTION C: ANALOGIES (21–30) — Analogies
-- =============================================================
select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$DOCTOR : HOSPITAL :: TEACHER : ?$$, 'B',
  $$Book$$, $$School$$, $$Student$$, $$Chalk$$,
  $$A doctor works in a hospital; a teacher works in a school.$$,
  '[]',
  $$Match the worker with the workplace.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$PEN : WRITER :: BRUSH : ?$$, 'B',
  $$Paint$$, $$Painter$$, $$Canvas$$, $$Color$$,
  $$A pen is the tool a writer uses; a brush is the tool a painter uses.$$,
  '[]',
  $$Match the tool with the person who uses it.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$BIRD : NEST :: BEE : ?$$, 'B',
  $$Honey$$, $$Hive$$, $$Flower$$, $$Sting$$,
  $$A bird lives in a nest; a bee lives in a hive.$$,
  '[]',
  $$Match the creature with its home.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$FISH : WATER :: BIRD : ?$$, 'B',
  $$Nest$$, $$Air$$, $$Tree$$, $$Sky$$,
  $$A fish moves through water; a bird moves through air. Most entry tests use "air" as the medium of movement.$$,
  '[]',
  $$Match the creature with the medium it moves through.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$AUTHOR : BOOK :: SCULPTOR : ?$$, 'B',
  $$Chisel$$, $$Statue$$, $$Stone$$, $$Museum$$,
  $$An author creates a book; a sculptor creates a statue.$$,
  '[]',
  $$Match the creator with what they produce.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$THIEF : STEAL :: LIAR : ?$$, 'B',
  $$Truth$$, $$Lie$$, $$Cheat$$, $$Hide$$,
  $$A thief steals; a liar tells lies.$$,
  '[]',
  $$Match the person with their characteristic action.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$KNIFE : CUT :: HAMMER : ?$$, 'B',
  $$Break$$, $$Hit$$, $$Nail$$, $$Build$$,
  $$A knife is used to cut; a hammer is used to hit.$$,
  '[]',
  $$Match the tool with its purpose.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$OPTIMIST : HOPEFUL :: PESSIMIST : ?$$, 'B',
  $$Cheerful$$, $$Hopeless$$, $$Careful$$, $$Doubtful$$,
  $$An optimist is hopeful; a pessimist is hopeless.$$,
  '[]',
  $$Match each person with their outlook.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$CUB : LION :: CALF : ?$$, 'B',
  $$Horse$$, $$Cow$$, $$Goat$$, $$Deer$$,
  $$A cub is a baby lion; a calf is a baby cow.$$,
  '[]',
  $$Match the young animal with its parent.$$);

select "public"."seed_question"('ENG', 'Analogies', 'easy',
  $$DIAMOND : HARD :: COTTON : ?$$, 'A',
  $$Soft$$, $$White$$, $$Light$$, $$Smooth$$,
  $$A diamond is hard; cotton is soft. The pair expresses an opposite quality.$$,
  '[]',
  $$Hard and soft are opposite qualities.$$);

-- =============================================================
-- SECTION D: SENTENCE COMPLETION (31–40) — Sentence Completion
-- =============================================================
select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$Despite his ______ efforts, he failed to win the match.$$, 'B',
  $$careless$$, $$strenuous$$, $$weak$$, $$minor$$,
  $$"Strenuous" means demanding great effort. The clause "despite ... he failed" needs a word meaning great effort that still led to failure.$$,
  '["Note the contrast signaled by the word despite", "The result (failure) happened in spite of it", "Require a strong-effort word"]',
  $$The word must describe strong, earnest effort.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The teacher was so ______ that all the students respected her.$$, 'B',
  $$rude$$, $$knowledgeable$$, $$careless$$, $$absent$$,
  $$Respect follows from being "knowledgeable". The other options would not inspire respect.$$,
  '[]',
  $$Respect is earned through deep subject knowledge.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The company had to ______ hundreds of workers due to losses.$$, 'B',
  $$hire$$, $$lay off$$, $$promote$$, $$train$$,
  $$"Lay off" means to dismiss employees, which fits the context of company losses.$$,
  '[]',
  $$Losses force a company to reduce its workforce.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$His argument was so ______ that no one could refute it.$$, 'B',
  $$weak$$, $$convincing$$, $$short$$, $$boring$$,
  $$Only a "convincing" argument cannot be refuted (proved wrong).$$,
  '[]',
  $$The argument persuaded everyone.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The government announced new measures to ______ inflation.$$, 'B',
  $$increase$$, $$curb$$, $$promote$$, $$ignore$$,
  $$"Curb" means to restrain or control, which is what measures against inflation do.$$,
  '[]',
  $$Measures are announced to control rising prices.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$She remained ______ even in the most difficult situations.$$, 'B',
  $$nervous$$, $$composed$$, $$confused$$, $$angry$$,
  $$"Composed" means calm and self-controlled, fitting "even in difficult situations".$$,
  '[]',
  $$She stayed calm under pressure.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The old bridge was declared ______ and closed to traffic.$$, 'B',
  $$safe$$, $$unsafe$$, $$new$$, $$strong$$,
  $$Closure to traffic implies the bridge was declared "unsafe".$$,
  '[]',
  $$Traffic is stopped because the bridge is dangerous.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$It is difficult to ______ between the two similar products.$$, 'B',
  $$choose$$, $$differentiate$$, $$buy$$, $$compare$$,
  $$"Differentiate" means to tell the difference, which is hard between similar products.$$,
  '[]',
  $$The products look alike, so telling them apart is hard.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The professor's lecture was so ______ that students lost interest.$$, 'B',
  $$interesting$$, $$monotonous$$, $$short$$, $$clear$$,
  $$"Monotonous" means dull and repetitive — the natural reason students lost interest.$$,
  '[]',
  $$Students stopped paying attention because it was dull.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$The team worked ______ to meet the deadline.$$, 'B',
  $$lazily$$, $$tirelessly$$, $$slowly$$, $$reluctantly$$,
  $$"Tirelessly" means without getting tired, matching the effort needed to meet a deadline.$$,
  '[]',
  $$The team gave continuous hard effort.$$);

-- =============================================================
-- SECTION E: ONE-WORD SUBSTITUTION & IDIOMS (41–50)
-- =============================================================
select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A person who loves books is called:$$, 'A',
  $$Bibliophile$$, $$Philanthropist$$, $$Linguist$$, $$Author$$,
  $$A "bibliophile" loves books; "philanthropist" loves humanity, and "linguist" studies languages.$$,
  '[]',
  $$"Biblio-" relates to books.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A place where birds are kept is called:$$, 'A',
  $$Aviary$$, $$Aquarium$$, $$Zoo$$, $$Sanctuary$$,
  $$An "aviary" is a large enclosure for birds; an "aquarium" holds fish.$$,
  '[]',
  $$Think of words starting with "av-" for birds.$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "to break the ice" means:$$, 'A',
  $$To start a conversation$$, $$To cause trouble$$, $$To end a fight$$, $$To freeze something$$,
  $$"To break the ice" means to make people feel comfortable so a conversation can begin.$$,
  '[]',
  $$It happens at the start of a social meeting.$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "once in a blue moon" means:$$, 'B',
  $$Every night$$, $$Very rarely$$, $$Every month$$, $$Frequently$$,
  $$A blue moon is rare, so "once in a blue moon" means very rarely.$$,
  '[]',
  $$The event hardly ever happens.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A person who can speak many languages is called:$$, 'A',
  $$Polyglot$$, $$Linguist$$, $$Translator$$, $$Orator$$,
  $$A "polyglot" knows many languages; a "linguist" studies language in general.$$,
  '[]',
  $$"Poly-" means many.$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "to let the cat out of the bag" means:$$, 'B',
  $$To adopt a pet$$, $$To reveal a secret$$, $$To cause chaos$$, $$To escape$$,
  $$"To let the cat out of the bag" means to reveal a secret, usually accidentally.$$,
  '[]',
  $$A hidden secret gets exposed.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A person who studies the stars is called:$$, 'B',
  $$Astrologer$$, $$Astronomer$$, $$Physicist$$, $$Geologist$$,
  $$An "astronomer" scientifically studies stars and celestial bodies; an "astrologer" interprets horoscopes.$$,
  '[]',
  $$Choose the scientific study of stars.$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "to hit the nail on the head" means:$$, 'A',
  $$To do something exactly right$$, $$To cause harm$$, $$To fail$$, $$To argue$$,
  $$"To hit the nail on the head" means to describe or do something exactly right.$$,
  '[]',
  $$The guess was perfectly accurate.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$A word that has the same spelling but a different meaning is called a:$$, 'B',
  $$Synonym$$, $$Homonym$$, $$Antonym$$, $$Acronym$$,
  $$A "homonym" shares spelling or pronunciation with another word but differs in meaning.$$,
  '[]',
  $$Think of "bat" (animal) and "bat" (sports gear).$$);

select "public"."seed_question"('ENG', 'Idioms and Phrases', 'medium',
  $$The idiom "to burn the midnight oil" means:$$, 'B',
  $$To waste resources$$, $$To work late into the night$$, $$To start a fire$$, $$To relax$$,
  $$"To burn the midnight oil" means to work or study late into the night.$$,
  '[]',
  $$You need light — oil lamps — to work at night.$$);

-- =========================================================================
-- SET 2: GRAMMAR, PREPOSITIONS, TENSES, READING COMPREHENSION, MIXED
-- =========================================================================

-- =============================================================
-- SECTION A: ERROR DETECTION / SPOT THE ERROR (1–10) — Grammar
-- =============================================================
select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "Neither of the boys / have completed / their homework." Choose (d) if there is no error.$$, 'B',
  $$Neither of the boys$$, $$have completed$$, $$their homework$$, $$No error$$,
  $$"Neither" takes a singular verb, so it should be "has completed", not "have completed".$$,
  '["Identify the subject: neither of the boys (singular)", "Singular subject requires has", "Correct: Neither of the boys has completed..."]',
  $$Neither/Either take a singular verb.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "She is one of the students / who has / topped the exam." Choose (d) if there is no error.$$, 'B',
  $$She is one of the students$$, $$who has$$, $$topped the exam$$, $$No error$$,
  $$The relative pronoun "who" refers to the plural noun "students", so the verb should be "have" — "who have topped...".$$,
  '["Find the antecedent of the relative pronoun: students (plural)", "Plural antecedent requires have", "Correct: one of the students who have topped..."]',
  $$The verb agrees with "students", not "one".$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "He is senior than / me by / two years." Choose (d) if there is no error.$$, 'A',
  $$He is senior than$$, $$me by$$, $$two years$$, $$No error$$,
  $$With "senior", the correct preposition is "to", not "than" — "senior to me".$$,
  '["Note: senior/junior take to, not than", "Correct: He is senior to me by two years"]',
  $$Senior and junior use "to".$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "Each of the players / were given / a medal." Choose (d) if there is no error.$$, 'B',
  $$Each of the players$$, $$were given$$, $$a medal$$, $$No error$$,
  $$"Each" is singular, so the verb should be "was given", not "were given".$$,
  '["Each is always singular", "Correct: Each of the players was given a medal"]',
  $$Each takes a singular verb.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "I have been living here / since ten years / without any break." Choose (d) if there is no error.$$, 'B',
  $$I have been living here$$, $$since ten years$$, $$without any break$$, $$No error$$,
  $$"Since" is used with a point in time; for a duration we use "for" — "for ten years".$$,
  '["Since + point in time (2015)", "For + duration (ten years)", "Correct: for ten years"]',
  $$Since takes a point in time, for a duration.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "The number of unemployed people / are increasing / every year." Choose (d) if there is no error.$$, 'B',
  $$The number of unemployed people$$, $$are increasing$$, $$every year$$, $$No error$$,
  $$"The number of" takes a singular verb — "is increasing".$$,
  '["The number of + plural noun → singular verb", "Correct: The number of unemployed people is increasing"]',
  $$The number of is singular.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "He along with his friends / are going / to the market." Choose (d) if there is no error.$$, 'B',
  $$He along with his friends$$, $$are going$$, $$to the market$$, $$No error$$,
  $$The subject is "He" (singular); "along with" does not change the number, so the verb should be "is going".$$,
  '["Identify the main subject: He", "Along with his friends is a parenthetical addition", "Correct: He along with his friends is going..."]',
  $$Ignore the phrase after "along with".$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "This is one of the best book / I have ever / read in my life." Choose (d) if there is no error.$$, 'A',
  $$This is one of the best book$$, $$I have ever$$, $$read in my life$$, $$No error$$,
  $$After "one of the", the noun must be plural — "one of the best books".$$,
  '["One of the is followed by a plural noun", "Correct: one of the best books"]',
  $$One of the best books.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "She has not completed / her work isn't it? / Please check." Choose (d) if there is no error.$$, 'B',
  $$She has not completed$$, $$her work isn't it?$$, $$Please check$$, $$No error$$,
  $$The question tag must match the auxiliary verb: since the statement is "has not", the tag should be "has she?" — "her work, has she?"$$,
  '["Statement is negative (has not)", "Tag must be positive and use the same auxiliary", "Correct: a positive tag matching the auxiliary has she?"]',
  $$A negative statement takes a positive tag with the same auxiliary.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Spot the error: "Everyone must submit / their assignments before / the deadline expires." Choose (d) if there is no error.$$, 'D',
  $$Everyone must submit$$, $$their assignments before$$, $$the deadline expires$$, $$No error$$,
  $$No error. Singular "everyone" with "their" is now widely accepted as correct in modern usage.$$,
  '[]',
  $$"Everyone ... their" is accepted in modern usage.$$);

-- =============================================================
-- SECTION B: PREPOSITIONS (11–20) — Prepositions
-- =============================================================
select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$She is good ______ mathematics.$$, 'B',
  $$in$$, $$at$$, $$on$$, $$with$$,
  $$"Good at" is the correct collocation for skill.$$,
  '[]',
  $$Skill with a subject uses "at".$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$He was accused ______ theft.$$, 'A',
  $$of$$, $$for$$, $$with$$, $$about$$,
  $$"Accused of" is the correct collocation.$$,
  '[]',
  $$Accused takes "of".$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$I am fond ______ music.$$, 'B',
  $$with$$, $$of$$, $$at$$, $$on$$,
  $$"Fond of" is the correct collocation.$$,
  '[]',
  $$Fond takes "of".$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$The train arrived ______ time.$$, 'B',
  $$in$$, $$on$$, $$at$$, $$by$$,
  $$"On time" means punctually, according to the schedule.$$,
  '[]',
  $$On time = punctual.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$She apologized ______ her mistake.$$, 'A',
  $$for$$, $$of$$, $$about$$, $$with$$,
  $$"Apologized for" is the correct collocation.$$,
  '[]',
  $$You apologize for something.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$He is married ______ a doctor.$$, 'B',
  $$with$$, $$to$$, $$for$$, $$of$$,
  $$"Married to" is the correct collocation.$$,
  '[]',
  $$You are married to someone.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$They divided the sweets ______ themselves.$$, 'B',
  $$between$$, $$among$$, $$with$$, $$in$$,
  $$"Among" is used when dividing among more than two people.$$,
  '[]',
  $$Among = more than two.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$She sat ______ the chair quietly.$$, 'C',
  $$at$$, $$in$$, $$on$$, $$over$$,
  $$We sit "on" a chair.$$,
  '[]',
  $$You sit on a chair, in an armchair.$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$He was absent ______ school yesterday.$$, 'A',
  $$from$$, $$in$$, $$at$$, $$of$$,
  $$"Absent from" is the correct collocation.$$,
  '[]',
  $$Absent takes "from".$$);

select "public"."seed_question"('ENG', 'Prepositions', 'easy',
  $$I am waiting ______ the bus.$$, 'B',
  $$on$$, $$for$$, $$at$$, $$to$$,
  $$"Waiting for" is the correct collocation.$$,
  '[]',
  $$You wait for a bus.$$);

-- =============================================================
-- SECTION C: TENSES & SENTENCE CORRECTION (21–30) — Tenses
-- =============================================================
select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$She has gone to market yesterday.$$,
  $$She went to market yesterday.$$,
  $$She has went to market yesterday.$$,
  $$She go to market yesterday.$$,
  $$A definite past time ("yesterday") requires the simple past: "She went to market yesterday."$$,
  '["Spot the time marker: yesterday (past)", "Simple past is required, present perfect is not", "Correct: She went to market yesterday."]',
  $$Yesterday signals simple past.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'A',
  $$By the time we arrived, the movie had already started.$$,
  $$By the time we arrived, the movie already started.$$,
  $$By the time we arrive, the movie had already started.$$,
  $$By the time we arrived, the movie has already started.$$,
  $$A past event completed before another past event needs the past perfect: "had already started".$$,
  '["Two past actions", "Earlier action takes past perfect (had started)", "Correct: By the time we arrived, the movie had already started."]',
  $$The earlier of two past events uses past perfect.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$I am living here since 2015.$$,
  $$I have been living here since 2015.$$,
  $$I live here since 2015.$$,
  $$I was living here since 2015.$$,
  $$An action beginning in the past and continuing into the present uses the present perfect continuous: "I have been living here since 2015."$$,
  '["Action started in past and continues now", "Use present perfect continuous", "Correct: I have been living here since 2015."]',
  $$"Since 2015" + ongoing action → present perfect continuous.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$If I was you, I would apologize.$$,
  $$If I were you, I would apologize.$$,
  $$If I am you, I would apologize.$$,
  $$If I would be you, I would apologize.$$,
  $$Unreal/subjunctive conditionals use "were" for all persons: "If I were you...".$$,
  '["Second conditional (unreal)", "Subjunctive requires were for all persons", "Correct: If I were you, I would apologize."]',
  $$Use "were" in hypothetical "if I ... you" clauses.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$He suggested me to see a doctor.$$,
  $$He suggested that I should see a doctor.$$,
  $$He suggested me that I see a doctor.$$,
  $$He suggested to see a doctor to me.$$,
  $$"Suggest" is followed by a that-clause, not by an object + infinitive: "He suggested that I should see a doctor."$$,
  '["Suggest + that-clause is correct", "Suggest is not used as suggest + me + to-infinitive", "Correct: He suggested that I should see a doctor."]',
  $$Suggest takes "that + subject + (should) verb".$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct passive voice for "They are building a new bridge.":$$, 'B',
  $$A new bridge is built by them.$$,
  $$A new bridge is being built by them.$$,
  $$A new bridge was being built by them.$$,
  $$A new bridge has been built by them.$$,
  $$The active sentence is in the present continuous, so the passive must use "is being built" to preserve the tense.$$,
  '["Active tense: present continuous", "Passive form: is/are + being + past participle", "Correct: A new bridge is being built by them."]',
  $$Present continuous passive = is/are being + V3.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'B',
  $$Neither the teacher nor the students was present.$$,
  $$Neither the teacher nor the students were present.$$,
  $$Neither the teacher nor the students are present.$$,
  $$Neither the teacher nor the students has present.$$,
  $$With "neither ... nor", the verb agrees with the nearer subject ("the students", plural), so "were present".$$,
  '["Neither ... nor → agreement with nearer subject", "Nearer subject: the students (plural)", "Correct: Neither the teacher nor the students were present."]',
  $$Agree with the noun closer to the verb.$$);

select "public"."seed_question"('ENG', 'Tenses', 'easy',
  $$Choose the correct sentence:$$, 'C',
  $$She don't like coffee.$$,
  $$She doesn't likes coffee.$$,
  $$She doesn't like coffee.$$,
  $$She not like coffee.$$,
  $$Third-person singular present negative: "doesn't" + base form of the verb, so "She doesn't like coffee."$$,
  '["doesn\u0027t + base verb", "She doesn\u0027t like coffee."]',
  $$Doesn't is followed by the base form.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct reported speech for: He said, "I am going home."$$, 'B',
  $$He said that he is going home.$$,
  $$He said that he was going home.$$,
  $$He said that he has gone home.$$,
  $$He said that he will go home.$$,
  $$In reported speech the present continuous "am going" changes to past continuous "was going": "He said that he was going home."$$,
  '["Said (past) backshifts the tense", "am → was (present continuous → past continuous)", "Correct: He said that he was going home."]',
  $$Backshift present continuous to past continuous.$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct sentence:$$, 'D',
  $$Each of the students have their own book.$$,
  $$Each of the students has their own book.$$,
  $$Each of the students has his own book.$$,
  $$Both b and c are acceptable.$$,
  $$Formal grammar prefers "has his own book", while modern usage accepts "has their own book". Both are acceptable.$$,
  '["Each takes a singular verb (has)", "Formal: his own book; modern: their own book", "Both b and c are acceptable"]',
  $$Each + has + his/their.$$);

-- =============================================================
-- SECTION D: SHORT READING COMPREHENSION (31–40) — Reading Comprehension
-- =============================================================
select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Water scarcity is becoming one of the most pressing global issues. Rapid population growth, industrialization, and climate change have significantly reduced freshwater availability in many regions. Experts warn that without immediate conservation efforts, several countries could face severe water crises within the next few decades.

What is the main cause of water scarcity mentioned in the passage?$$, 'B',
  $$Only climate change$$,
  $$Population growth, industrialization, and climate change$$,
  $$Only industrialization$$,
  $$Natural disasters$$,
  $$The passage lists rapid population growth, industrialization, and climate change as the causes reducing freshwater availability.$$,
  '["Identify causes in the passage", "Population growth, industrialization, and climate change are all named"]',
  $$Look at the second sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Water scarcity is becoming one of the most pressing global issues. Rapid population growth, industrialization, and climate change have significantly reduced freshwater availability in many regions. Experts warn that without immediate conservation efforts, several countries could face severe water crises within the next few decades.

According to the passage, what will happen without conservation efforts?$$, 'B',
  $$Nothing will change$$,
  $$Countries could face water crises$$,
  $$Population will decrease$$,
  $$Industries will shut down$$,
  $$The passage warns that without immediate conservation efforts, several countries could face severe water crises.$$,
  '["Find the warning sentence", "Without conservation → severe water crises"]',
  $$Check the final sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Water scarcity is becoming one of the most pressing global issues. Rapid population growth, industrialization, and climate change have significantly reduced freshwater availability in many regions. Experts warn that without immediate conservation efforts, several countries could face severe water crises within the next few decades.

The word "pressing" in the passage most nearly means:$$, 'B',
  $$Ironing$$, $$Urgent$$, $$Minor$$, $$Distant$$,
  $$"Pressing" in this context means urgent — requiring immediate attention.$$,
  '[]',
  $$Something pressing demands quick action.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Reading is one of the best habits a student can develop. It not only improves vocabulary and comprehension but also enhances critical thinking and imagination. Studies show that students who read regularly perform better academically than those who don't.

According to the passage, reading improves:$$, 'B',
  $$Only vocabulary$$,
  $$Vocabulary, comprehension, thinking, and imagination$$,
  $$Only academic performance$$,
  $$Only imagination$$,
  $$The passage says reading improves vocabulary, comprehension, critical thinking, and imagination.$$,
  '["List the benefits named in the passage", "Vocabulary, comprehension, critical thinking, imagination"]',
  $$Re-read the second sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Reading is one of the best habits a student can develop. It not only improves vocabulary and comprehension but also enhances critical thinking and imagination. Studies show that students who read regularly perform better academically than those who don't.

What does the passage suggest about students who read regularly?$$, 'B',
  $$They perform worse academically$$,
  $$They perform better academically$$,
  $$There is no difference$$,
  $$They read less over time$$,
  $$The passage states that students who read regularly perform better academically.$$,
  '[]',
  $$Look at the final sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Reading is one of the best habits a student can develop. It not only improves vocabulary and comprehension but also enhances critical thinking and imagination. Studies show that students who read regularly perform better academically than those who don't.

The word "enhances" in the passage means:$$, 'B',
  $$Reduces$$, $$Improves$$, $$Ignores$$, $$Complicates$$,
  $$"Enhances" means to improve or make better.$$,
  '[]',
  $$Enhance = improve.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Renewable energy sources such as solar and wind power are gaining popularity as alternatives to fossil fuels. Unlike coal or oil, these sources do not deplete over time and produce significantly less pollution, making them essential for a sustainable future.

Why are renewable energy sources considered better than fossil fuels?$$, 'B',
  $$They are cheaper$$,
  $$They don't deplete and cause less pollution$$,
  $$They are easier to transport$$,
  $$They require no technology$$,
  $$The passage says renewables do not deplete over time and produce significantly less pollution.$$,
  '[]',
  $$Check the middle sentence.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Renewable energy sources such as solar and wind power are gaining popularity as alternatives to fossil fuels. Unlike coal or oil, these sources do not deplete over time and produce significantly less pollution, making them essential for a sustainable future.

The word "deplete" most nearly means:$$, 'B',
  $$Increase$$, $$Exhaust$$, $$Improve$$, $$Multiply$$,
  $$"Deplete" means to use up or exhaust a supply.$$,
  '[]',
  $$A resource that depletes runs out.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Renewable energy sources such as solar and wind power are gaining popularity as alternatives to fossil fuels. Unlike coal or oil, these sources do not deplete over time and produce significantly less pollution, making them essential for a sustainable future.

What is the main idea of the passage?$$, 'B',
  $$Fossil fuels are the best energy source$$,
  $$Renewable energy is a sustainable alternative to fossil fuels$$,
  $$Solar power is expensive$$,
  $$Wind power is unreliable$$,
  $$The passage presents renewable energy as a sustainable alternative to fossil fuels because it does not deplete and causes less pollution.$$,
  '["Identify the topic sentence", "Renewables = sustainable alternative to fossil fuels"]',
  $$Focus on the first and last sentences.$$);

select "public"."seed_question"('ENG', 'Reading Comprehension', 'medium',
  $$Renewable energy sources such as solar and wind power are gaining popularity as alternatives to fossil fuels. Unlike coal or oil, these sources do not deplete over time and produce significantly less pollution, making them essential for a sustainable future.

The passage implies that fossil fuels:$$, 'B',
  $$Are unlimited$$,
  $$Do deplete over time$$,
  $$Produce no pollution$$,
  $$Are renewable$$,
  $$By saying renewable sources "do not deplete" unlike coal or oil, the passage implies that fossil fuels do deplete over time.$$,
  '[]',
  $$"Unlike coal or oil" marks the contrast.$$);

-- =============================================================
-- SECTION E: MIXED GRAMMAR & VOCABULARY IN CONTEXT (41–50)
-- =============================================================
select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Choose the correctly punctuated sentence:$$, 'B',
  $$Its a beautiful day, isnt it?$$,
  $$It's a beautiful day, isn't it?$$,
  $$Its' a beautiful day, isn't it?$$,
  $$It's a beautiful day, isnt' it?$$,
  $$"It's" (it is) uses an apostrophe, and the contraction "isn't" needs an apostrophe where letters are omitted.$$,
  '["It\u0027s = it is (with apostrophe)", "isn\u0027t = is not (apostrophe for o)", "Correct: It\u0027s a beautiful day, isn\u0027t it?"]',
  $$Apostrophes mark contractions.$$);

select "public"."seed_question"('ENG', 'Sentence Completion', 'medium',
  $$Choose the word that best completes: "The manager was ______ to accept the new proposal."$$, 'A',
  $$reluctant$$, $$willingly$$, $$reluctance$$, $$reluctantly$$,
  $$The blank follows the linking verb "was", so an adjective is needed: "reluctant".$$,
  '["was + adjective", "reluctant is the only adjective among the options"]',
  $$A linking verb takes an adjective.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$Identify the correctly spelled word:$$, 'C',
  $$Accomodate$$, $$Acommodate$$, $$Accommodate$$, $$Acomodate$$,
  $$"Accommodate" has two c's and two m's.$$,
  '[]',
  $$Double c, double m.$$);

select "public"."seed_question"('ENG', 'Vocabulary', 'medium',
  $$Identify the correctly spelled word:$$, 'B',
  $$Recieve$$, $$Receive$$, $$Receve$$, $$Receeve$$,
  $$"Receive" follows the rule "i before e except after c".$$,
  '[]',
  $$I before e, except after c.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Choose the correct plural form of "criterion":$$, 'B',
  $$Criterions$$, $$Criteria$$, $$Criterias$$, $$Criterion's$$,
  $$"Criterion" is a Greek-derived noun whose plural is "criteria".$$,
  '[]',
  $$Like datum → data.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Choose the correct word: "This is the ______ solution among the three."$$, 'C',
  $$good$$, $$better$$, $$best$$, $$well$$,
  $$With three or more items, the superlative "best" is required.$$,
  '["Comparison among three → superlative", "best is the superlative of good"]',
  $$Three items need the superlative.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Choose the correct sentence:$$, 'C',
  $$The data is clear.$$,
  $$The data are clear.$$,
  $$Both a and b are acceptable depending on context.$$,
  $$The datas is clear.$$,
  $$"Data" is treated as singular in everyday use and plural in formal/scientific use, so both forms are acceptable depending on context.$$,
  '["Data can be singular in everyday use", "Data can be plural in formal/scientific use", "Both are acceptable"]',
  $$Data works as both singular and plural.$$);

select "public"."seed_question"('ENG', 'Grammar', 'medium',
  $$Fill in the blank: "Not only did she win the award, ______ she also broke the record."$$, 'A',
  $$but$$, $$and$$, $$so$$, $$or$$,
  $$The correlative pair is "not only ... but also", so "but" fills the blank.$$,
  '["Recognize the correlative pair not only ... but also", "Fill with but"]',
  $$Not only … but also.$$);

select "public"."seed_question"('ENG', 'Subject-Verb Agreement', 'medium',
  $$Choose the correct sentence:$$, 'A',
  $$He is one of those students who always come late.$$,
  $$He is one of those students who always comes late.$$,
  $$He is one of those student who always come late.$$,
  $$He is one of those students that always coming late.$$,
  $$"Who" refers to the plural "students", so the verb is "come" — "students who always come late".$$,
  '["Who refers to students (plural)", "Plural verb come", "Correct: He is one of those students who always come late."]',
  $$Agree with "students", not "one".$$);

select "public"."seed_question"('ENG', 'Tenses', 'medium',
  $$Choose the correct word: "The committee ______ its decision yesterday."$$, 'B',
  $$announce$$, $$announced$$, $$announcing$$, $$announces$$,
  $$"Yesterday" is a definite past time, so the simple past "announced" is required.$$,
  '["Time marker: yesterday", "Simple past announced"]',
  $$Yesterday → simple past.$$);
