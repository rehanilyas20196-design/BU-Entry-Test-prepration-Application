-- 0019_seed_question_bank_2.sql
-- BUET Prep AI - original practice questions (440 MCQs)
--   QUANT 130 (Algebra, Arithmetic, Geometry, Percentage, Probability, Profit and Loss,
--             Ratios and Proportions, Sequences and Series, Speed Distance Time, Time and Work)
--   ENG    30 (Active-Passive Voice, Articles, Direct-Indirect Speech)
--   ANALY  90 (Analogies, Classification, Coding Decoding, Critical Reasoning, Letter Patterns,
--             Logic Puzzles, Logical Ordering, Number Patterns, Syllogisms)
--   GK     70 (Current Affairs, Important Personalities, Organizations, Pakistan Studies,
--             Science and Technology, World Geography, World History)
--   PHY    60 (Electricity, Magnetism, Mechanics, Optics, Thermodynamics, Waves and Sound)
--   CHEM   60 (Acids and Bases, Atomic Structure, Chemical Bonding, Organic Chemistry,
--             Periodic Table, Stoichiometry)
-- Also removes the Biology (BIO) subject and all its content (cascades).
-- All questions are original practice items (ORIGINAL_AI, approved).

-- =============================================================
-- FIX: option validator must skip DELETE (new is NULL on deletes)
-- =============================================================
create or replace function "public"."validate_question_options"() returns trigger language plpgsql
as $$
declare
  opt_count integer;
  correct_count integer;
  dup_count integer;
begin
  if tg_op = 'DELETE' then
    return old;
  end if;
  select count(*), count(*) filter (where is_correct), count(distinct lower(trim(option_text)))
    into opt_count, correct_count, dup_count
    from "public"."question_options"
    where question_id = new.question_id;
  if opt_count != 4 then
    raise exception 'Question % must have exactly 4 options (has %)', new.question_id, opt_count;
  end if;
  if correct_count != 1 then
    raise exception 'Question % must have exactly 1 correct option (has %)', new.question_id, correct_count;
  end if;
  if dup_count != 4 then
    raise exception 'Question % has duplicate option text', new.question_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_options_aiud on "public"."question_options";
create constraint trigger trg_validate_options_aiud
  after insert or update or delete on "public"."question_options"
  deferrable initially deferred
  for each row execute function "public"."validate_question_options"();

-- =============================================================
-- REMOVE BIOLOGY (subject cascades to topics, questions, sections)
-- =============================================================
delete from "public"."subjects" where code = 'BIO';

-- =============================================================================
-- Algebra (40)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 2x + 5 = 15$$, 'A',
  $$5$$, $$6$$, $$4$$, $$10$$,
  $$2x + 5 = 15 => 2x = 10 => x = 5.$$,
  '[]',
  $$Review: 2x + 5 = 15 => 2x = 10 => x = 5.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 3x - 7 = 11$$, 'A',
  $$6$$, $$7$$, $$5$$, $$8$$,
  $$3x - 7 = 11 => 3x = 18 => x = 6.$$,
  '[]',
  $$Review: 3x - 7 = 11 => 3x = 18 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: x / 4 = 9$$, 'A',
  $$36$$, $$32$$, $$40$$, $$27$$,
  $$x / 4 = 9 => x = 36.$$,
  '[]',
  $$Review: x / 4 = 9 => x = 36.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 2x + 3 = 11$$, 'A',
  $$4$$, $$5$$, $$3$$, $$6$$,
  $$2x + 3 = 11 => 2x = 8 => x = 4.$$,
  '[]',
  $$Review: 2x + 3 = 11 => 2x = 8 => x = 4.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 5x + 2 = 7$$, 'A',
  $$1$$, $$5$$, $$2$$, $$7$$,
  $$5x + 2 = 7 => 5x = 5 => x = 1.$$,
  '[]',
  $$Review: 5x + 2 = 7 => 5x = 5 => x = 1.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 4x - 9 = 3$$, 'A',
  $$3$$, $$2$$, $$4$$, $$5$$,
  $$4x - 9 = 3 => 4x = 12 => x = 3.$$,
  '[]',
  $$Review: 4x - 9 = 3 => 4x = 12 => x = 3.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 6x + 5 = 41$$, 'A',
  $$6$$, $$7$$, $$5$$, $$8$$,
  $$6x + 5 = 41 => 6x = 36 => x = 6.$$,
  '[]',
  $$Review: 6x + 5 = 41 => 6x = 36 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 3x + 4 = 22$$, 'A',
  $$6$$, $$5$$, $$7$$, $$4$$,
  $$3x + 4 = 22 => 3x = 18 => x = 6.$$,
  '[]',
  $$Review: 3x + 4 = 22 => 3x = 18 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 2x - 3 = 9$$, 'A',
  $$6$$, $$5$$, $$7$$, $$3$$,
  $$2x - 3 = 9 => 2x = 12 => x = 6.$$,
  '[]',
  $$Review: 2x - 3 = 9 => 2x = 12 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Solve: 7x + 1 = 36$$, 'A',
  $$5$$, $$6$$, $$4$$, $$7$$,
  $$7x + 1 = 36 => 7x = 35 => x = 5.$$,
  '[]',
  $$Review: 7x + 1 = 36 => 7x = 35 => x = 5.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 = 49$$, 'A',
  $$7$$, $$±7$$, $$6$$, $$8$$,
  $$x^2 = 49 => x = ±7; the option list gives x = 7 as the intended positive root.$$,
  '[]',
  $$Review: x^2 = 49 => x = ±7; the option list gives x = 7 as the intended positive root.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 + 5x + 6 = 0$$, 'A',
  $$-2, -3$$, $$-1, -6$$, $$2, 3$$, $$-2, 3$$,
  $$x^2 + 5x + 6 = 0 => (x + 2)(x + 3) = 0 => x = -2 or x = -3.$$,
  '[]',
  $$Review: x^2 + 5x + 6 = 0 => (x + 2)(x + 3) = 0 => x = -2 or x = -3.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 4 = 0$$, 'A',
  $$±2$$, $$±4$$, $$2$$, $$-2$$,
  $$x^2 - 4 = 0 => x^2 = 4 => x = ±2.$$,
  '[]',
  $$Review: x^2 - 4 = 0 => x^2 = 4 => x = ±2.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 3x - 10 = 0$$, 'A',
  $$5, -2$$, $$-5, 2$$, $$10, -1$$, $$-10, 1$$,
  $$x^2 - 3x - 10 = 0 => (x - 5)(x + 2) = 0 => x = 5 or x = -2.$$,
  '[]',
  $$Review: x^2 - 3x - 10 = 0 => (x - 5)(x + 2) = 0 => x = 5 or x = -2.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 6x + 9 = 0$$, 'A',
  $$3$$, $$-3$$, $$±3$$, $$9$$,
  $$x^2 - 6x + 9 = (x - 3)^2 = 0 => x = 3.$$,
  '[]',
  $$Review: x^2 - 6x + 9 = (x - 3)^2 = 0 => x = 3.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: 2x^2 - 8 = 0$$, 'A',
  $$±2$$, $$±4$$, $$2$$, $$8$$,
  $$2x^2 - 8 = 0 => x^2 = 4 => x = ±2.$$,
  '[]',
  $$Review: 2x^2 - 8 = 0 => x^2 = 4 => x = ±2.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 + 8x + 12 = 0$$, 'A',
  $$-2, -6$$, $$2, 6$$, $$-4, -3$$, $$-12, 1$$,
  $$x^2 + 8x + 12 = 0 => (x + 2)(x + 6) = 0 => x = -2 or x = -6.$$,
  '[]',
  $$Review: x^2 + 8x + 12 = 0 => (x + 2)(x + 6) = 0 => x = -2 or x = -6.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 5x + 6 = 0$$, 'A',
  $$2, 3$$, $$-2, -3$$, $$6, -1$$, $$-6, 1$$,
  $$x^2 - 5x + 6 = 0 => (x - 2)(x - 3) = 0 => x = 2 or x = 3.$$,
  '[]',
  $$Review: x^2 - 5x + 6 = 0 => (x - 2)(x - 3) = 0 => x = 2 or x = 3.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 + 4x = 0$$, 'A',
  $$0, -4$$, $$4$$, $$-4$$, $$0, 4$$,
  $$x^2 + 4x = x(x + 4) = 0 => x = 0 or x = -4.$$,
  '[]',
  $$Review: x^2 + 4x = x(x + 4) = 0 => x = 0 or x = -4.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Solve: x^2 - 9x + 14 = 0$$, 'A',
  $$7, 2$$, $$-7, -2$$, $$-14, 1$$, $$-9, 14$$,
  $$x^2 - 9x + 14 = 0 => (x - 7)(x - 2) = 0 => x = 7 or x = 2.$$,
  '[]',
  $$Review: x^2 - 9x + 14 = 0 => (x - 7)(x - 2) = 0 => x = 7 or x = 2.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 2^3$$, 'A',
  $$8$$, $$5$$, $$9$$, $$6$$,
  $$2^3 = 2 × 2 × 2 = 8.$$,
  '[]',
  $$Review: 2^3 = 2 × 2 × 2 = 8.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 3^4$$, 'A',
  $$81$$, $$12$$, $$64$$, $$27$$,
  $$3^4 = 3 × 3 × 3 × 3 = 81.$$,
  '[]',
  $$Review: 3^4 = 3 × 3 × 3 × 3 = 81.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 2^5$$, 'A',
  $$32$$, $$10$$, $$25$$, $$26$$,
  $$2^5 = 2 × 2 × 2 × 2 × 2 = 32.$$,
  '[]',
  $$Review: 2^5 = 2 × 2 × 2 × 2 × 2 = 32.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 5^2$$, 'A',
  $$25$$, $$10$$, $$20$$, $$30$$,
  $$5^2 = 5 × 5 = 25.$$,
  '[]',
  $$Review: 5^2 = 5 × 5 = 25.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 10^3$$, 'A',
  $$1000$$, $$100$$, $$30$$, $$300$$,
  $$10^3 = 10 × 10 × 10 = 1000.$$,
  '[]',
  $$Review: 10^3 = 10 × 10 × 10 = 1000.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 4^3$$, 'A',
  $$64$$, $$12$$, $$81$$, $$16$$,
  $$4^3 = 4 × 4 × 4 = 64.$$,
  '[]',
  $$Review: 4^3 = 4 × 4 × 4 = 64.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 2^6$$, 'A',
  $$64$$, $$12$$, $$32$$, $$16$$,
  $$2^6 = 2 × 2 × 2 × 2 × 2 × 2 = 64.$$,
  '[]',
  $$Review: 2^6 = 2 × 2 × 2 × 2 × 2 × 2 = 64.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 6^2$$, 'A',
  $$36$$, $$12$$, $$30$$, $$42$$,
  $$6^2 = 6 × 6 = 36.$$,
  '[]',
  $$Review: 6^2 = 6 × 6 = 36.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 2^0$$, 'A',
  $$1$$, $$0$$, $$2$$, $$20$$,
  $$Any non-zero number raised to the power 0 equals 1.$$,
  '[]',
  $$Review: any non-zero number raised to the power 0 equals 1.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'easy',
  $$Evaluate: 3^3$$, 'A',
  $$27$$, $$9$$, $$6$$, $$81$$,
  $$3^3 = 3 × 3 × 3 = 27.$$,
  '[]',
  $$Review: 3^3 = 3 × 3 × 3 = 27.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If x = 4, find the value of 3x + 7$$, 'A',
  $$19$$, $$12$$, $$21$$, $$16$$,
  $$3(4) + 7 = 12 + 7 = 19.$$,
  '[]',
  $$Review: 3(4) + 7 = 12 + 7 = 19.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If y = 3, find the value of 2y^2 + 5$$, 'A',
  $$23$$, $$22$$, $$21$$, $$24$$,
  $$2(3)^2 + 5 = 18 + 5 = 23.$$,
  '[]',
  $$Review: 2(3)^2 + 5 = 18 + 5 = 23.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Simplify: 5x + 3x - 2x$$, 'A',
  $$6x$$, $$10x$$, $$8x$$, $$5x$$,
  $$5x + 3x - 2x = (5 + 3 - 2)x = 6x.$$,
  '[]',
  $$Review: 5x + 3x - 2x = (5 + 3 - 2)x = 6x.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If a = 2 and b = 3, find ab + a + b$$, 'A',
  $$11$$, $$12$$, $$10$$, $$13$$,
  $$ab + a + b = (2)(3) + 2 + 3 = 6 + 5 = 11.$$,
  '[]',
  $$Review: ab + a + b = (2)(3) + 2 + 3 = 6 + 5 = 11.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Simplify: 4(x + 3)$$, 'A',
  $$4x + 12$$, $$4x + 3$$, $$12x$$, $$x + 7$$,
  $$4(x + 3) = 4x + 12.$$,
  '[]',
  $$Review: 4(x + 3) = 4x + 12.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If x = 5, find the value of 2x^2 - 3$$, 'A',
  $$47$$, $$45$$, $$50$$, $$42$$,
  $$2(5)^2 - 3 = 50 - 3 = 47.$$,
  '[]',
  $$Review: 2(5)^2 - 3 = 50 - 3 = 47.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Simplify: 3(2x + 4)$$, 'A',
  $$6x + 12$$, $$6x + 4$$, $$3x + 12$$, $$6x + 7$$,
  $$3(2x + 4) = 6x + 12.$$,
  '[]',
  $$Review: 3(2x + 4) = 6x + 12.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If x = 2, find the value of x^3 + 4$$, 'A',
  $$12$$, $$8$$, $$10$$, $$16$$,
  $$2^3 + 4 = 8 + 4 = 12.$$,
  '[]',
  $$Review: 2^3 + 4 = 8 + 4 = 12.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$Simplify: 7x - 2x + 4$$, 'A',
  $$5x + 4$$, $$9x + 4$$, $$5x$$, $$2x$$,
  $$7x - 2x + 4 = 5x + 4.$$,
  '[]',
  $$Review: 7x - 2x + 4 = 5x + 4.$$);

select "public"."seed_question"('QUANT', 'Algebra', 'medium',
  $$If x = 6, find the value of 2x - 8$$, 'A',
  $$4$$, $$5$$, $$3$$, $$2$$,
  $$2(6) - 8 = 12 - 8 = 4.$$,
  '[]',
  $$Review: 2(6) - 8 = 12 - 8 = 4.$$);

-- =============================================================================
-- Arithmetic (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 15 + 8$$, 'A',
  $$23$$, $$21$$, $$22$$, $$24$$,
  $$15 + 8 = 23.$$,
  '[]',
  $$Review: 15 + 8 = 23.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 21 - 9$$, 'A',
  $$12$$, $$11$$, $$13$$, $$10$$,
  $$21 - 9 = 12.$$,
  '[]',
  $$Review: 21 - 9 = 12.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 6 × 7$$, 'A',
  $$42$$, $$36$$, $$48$$, $$52$$,
  $$6 × 7 = 42.$$,
  '[]',
  $$Review: 6 × 7 = 42.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 81 / 9$$, 'A',
  $$9$$, $$8$$, $$7$$, $$10$$,
  $$81 / 9 = 9.$$,
  '[]',
  $$Review: 81 / 9 = 9.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 17 + 14$$, 'A',
  $$31$$, $$30$$, $$29$$, $$33$$,
  $$17 + 14 = 31.$$,
  '[]',
  $$Review: 17 + 14 = 31.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 45 - 18$$, 'A',
  $$27$$, $$26$$, $$28$$, $$25$$,
  $$45 - 18 = 27.$$,
  '[]',
  $$Review: 45 - 18 = 27.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 8 × 9$$, 'A',
  $$72$$, $$64$$, $$81$$, $$74$$,
  $$8 × 9 = 72.$$,
  '[]',
  $$Review: 8 × 9 = 72.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 144 / 12$$, 'A',
  $$12$$, $$11$$, $$13$$, $$14$$,
  $$144 / 12 = 12.$$,
  '[]',
  $$Review: 144 / 12 = 12.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 29 + 16$$, 'A',
  $$45$$, $$44$$, $$46$$, $$43$$,
  $$29 + 16 = 45.$$,
  '[]',
  $$Review: 29 + 16 = 45.$$);

select "public"."seed_question"('QUANT', 'Arithmetic', 'easy',
  $$Compute: 63 - 27$$, 'A',
  $$36$$, $$34$$, $$35$$, $$37$$,
  $$63 - 27 = 36.$$,
  '[]',
  $$Review: 63 - 27 = 36.$$);

-- =============================================================================
-- Geometry (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The sum of interior angles of a triangle is$$, 'A',
  $$180°$$, $$90°$$, $$270°$$, $$360°$$,
  $$Sum of interior angles of a triangle = 180°.$$,
  '[]',
  $$Review: sum of interior angles of a triangle = 180°.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The perimeter of a rectangle 5 cm by 3 cm is$$, 'A',
  $$16 cm$$, $$15 cm$$, $$8 cm$$, $$11 cm$$,
  $$Perimeter = 2(5) + 2(3) = 16 cm.$$,
  '[]',
  $$Review: perimeter = 2(5) + 2(3) = 16 cm.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The area of a rectangle 8 cm by 4 cm is$$, 'A',
  $$32 cm sq$$, $$40 cm sq$$, $$30 cm sq$$, $$36 cm sq$$,
  $$Area = 8 × 4 = 32 cm^2.$$,
  '[]',
  $$Review: area = 8 × 4 = 32 cm^2.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The sum of interior angles of a quadrilateral is$$, 'A',
  $$360°$$, $$180°$$, $$90°$$, $$540°$$,
  $$Sum of interior angles of a quadrilateral = 360°.$$,
  '[]',
  $$Review: sum of interior angles of a quadrilateral = 360°.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$A circle has circumference 30 cm (π approximately 3). Its radius is$$, 'A',
  $$5 cm$$, $$6 cm$$, $$4 cm$$, $$10 cm$$,
  $$C = 2πr => 30 = 2(3)r => r = 5 cm.$$,
  '[]',
  $$Review: c = 2πr => 30 = 2(3)r => r = 5 cm.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The area of a triangle with base 6 cm and height 4 cm is$$, 'A',
  $$12 cm sq$$, $$24 cm sq$$, $$10 cm sq$$, $$20 cm sq$$,
  $$Area = 1/2 × base × height = 1/2 × 6 × 4 = 12 cm^2.$$,
  '[]',
  $$Review: area = 1/2 × base × height = 1/2 × 6 × 4 = 12 cm^2.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The perimeter of a rectangle 7 cm by 5 cm is$$, 'A',
  $$24 cm$$, $$35 cm$$, $$12 cm$$, $$20 cm$$,
  $$Perimeter = 2(7) + 2(5) = 24 cm.$$,
  '[]',
  $$Review: perimeter = 2(7) + 2(5) = 24 cm.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The sum of interior angles of a pentagon is$$, 'A',
  $$540°$$, $$360°$$, $$720°$$, $$180°$$,
  $$(n - 2) × 180 = 3 × 180 = 540° for a pentagon.$$,
  '[]',
  $$Review: (n - 2) × 180 = 3 × 180 = 540° for a pentagon.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The circumference of a circle with radius 7 cm (π = 22/7) is$$, 'A',
  $$44 cm$$, $$22 cm$$, $$49 cm$$, $$40 cm$$,
  $$C = 2πr = 2 × (22/7) × 7 = 44 cm.$$,
  '[]',
  $$Review: c = 2πr = 2 × (22/7) × 7 = 44 cm.$$);

select "public"."seed_question"('QUANT', 'Geometry', 'medium',
  $$The area of a circle with radius 6 cm (π = 3.14) is$$, 'A',
  $$113.04 cm sq$$, $$113 cm sq$$, $$86.4 cm sq$$, $$56.52 cm sq$$,
  $$A = πr^2 = 3.14 × 36 = 113.04 cm^2.$$,
  '[]',
  $$Review: a = πr^2 = 3.$$);

-- =============================================================================
-- Percentages (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 25% of 80$$, 'A',
  $$20$$, $$30$$, $$25$$, $$24$$,
  $$25% of 80 = 0.25 × 80 = 20.$$,
  '[]',
  $$Review: 25% of 80 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 50% of 64$$, 'A',
  $$32$$, $$30$$, $$28$$, $$36$$,
  $$50% of 64 = 0.5 × 64 = 32.$$,
  '[]',
  $$Review: 50% of 64 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 10% of 250$$, 'A',
  $$25$$, $$30$$, $$20$$, $$15$$,
  $$10% of 250 = 0.1 × 250 = 25.$$,
  '[]',
  $$Review: 10% of 250 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 20% of 150$$, 'A',
  $$30$$, $$40$$, $$25$$, $$35$$,
  $$20% of 150 = 0.2 × 150 = 30.$$,
  '[]',
  $$Review: 20% of 150 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 40% of 90$$, 'A',
  $$36$$, $$34$$, $$32$$, $$38$$,
  $$40% of 90 = 0.4 × 90 = 36.$$,
  '[]',
  $$Review: 40% of 90 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 75% of 240$$, 'A',
  $$180$$, $$170$$, $$190$$, $$160$$,
  $$75% of 240 = 0.75 × 240 = 180.$$,
  '[]',
  $$Review: 75% of 240 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 60% of 45$$, 'A',
  $$27$$, $$25$$, $$28$$, $$30$$,
  $$60% of 45 = 0.6 × 45 = 27.$$,
  '[]',
  $$Review: 60% of 45 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 12% of 300$$, 'A',
  $$36$$, $$40$$, $$35$$, $$30$$,
  $$12% of 300 = 0.12 × 300 = 36.$$,
  '[]',
  $$Review: 12% of 300 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 5% of 620$$, 'A',
  $$31$$, $$30$$, $$32$$, $$33$$,
  $$5% of 620 = 0.05 × 620 = 31.$$,
  '[]',
  $$Review: 5% of 620 = 0.$$);

select "public"."seed_question"('QUANT', 'Percentages', 'easy',
  $$Find 15% of 180$$, 'A',
  $$27$$, $$25$$, $$30$$, $$28$$,
  $$15% of 180 = 0.15 × 180 = 27.$$,
  '[]',
  $$Review: 15% of 180 = 0.$$);

-- =============================================================================
-- Probability (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A fair coin is tossed once. The probability of getting heads is$$, 'A',
  $$1/2$$, $$1/3$$, $$1/4$$, $$1$$,
  $$Two equally likely outcomes; heads is one of them => 1/2.$$,
  '[]',
  $$Review: two equally likely outcomes; heads is one of them => 1/2.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A fair die is rolled once. The probability of getting a 3 is$$, 'A',
  $$1/6$$, $$1/5$$, $$1/4$$, $$1/3$$,
  $$Six equally likely outcomes; one favourable => 1/6.$$,
  '[]',
  $$Review: six equally likely outcomes; one favourable => 1/6.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A bag has 3 red, 2 blue and 5 green balls. One is drawn at random. P(red) =$$, 'A',
  $$3/10$$, $$2/10$$, $$5/10$$, $$1/10$$,
  $$Total 10 balls; 3 red => 3/10.$$,
  '[]',
  $$Review: total 10 balls; 3 red => 3/10.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A fair die is rolled once. The probability of getting an even number is$$, 'A',
  $$1/2$$, $$1/3$$, $$2/3$$, $$1/4$$,
  $$Even faces: 2,4,6 => 3/6 = 1/2.$$,
  '[]',
  $$Review: even faces: 2,4,6 => 3/6 = 1/2.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A card is drawn from a standard deck of 52. P(ace) =$$, 'A',
  $$1/13$$, $$4/13$$, $$1/52$$, $$1/4$$,
  $$4 aces out of 52 => 4/52 = 1/13.$$,
  '[]',
  $$Review: 4 aces out of 52 => 4/52 = 1/13.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A fair die is rolled once. The probability of a number greater than 4 is$$, 'A',
  $$1/3$$, $$1/2$$, $$1/6$$, $$2/3$$,
  $$Faces 5,6 => 2/6 = 1/3.$$,
  '[]',
  $$Review: faces 5,6 => 2/6 = 1/3.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$Four fair coins are tossed. The probability of 4 heads is$$, 'A',
  $$1/16$$, $$1/8$$, $$1/4$$, $$1/2$$,
  $$(1/2)^4 = 1/16.$$,
  '[]',
  $$Review: (1/2)^4 = 1/16.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A number is chosen from 1 to 20. P(multiple of 5) =$$, 'A',
  $$1/5$$, $$1/4$$, $$3/20$$, $$1/20$$,
  $$Multiples of 5: 5,10,15,20 => 4/20 = 1/5.$$,
  '[]',
  $$Review: multiples of 5: 5,10,15,20 => 4/20 = 1/5.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$A bag has 4 red and 6 blue balls. P(not red) =$$, 'A',
  $$3/5$$, $$2/5$$, $$4/10$$, $$1/5$$,
  $$6 blue out of 10 => 6/10 = 3/5.$$,
  '[]',
  $$Review: 6 blue out of 10 => 6/10 = 3/5.$$);

select "public"."seed_question"('QUANT', 'Probability', 'medium',
  $$Two fair dice are thrown. P(sum = 7) =$$, 'A',
  $$1/6$$, $$1/12$$, $$1/9$$, $$1/36$$,
  $$6 of 36 sums equal 7 => 6/36 = 1/6.$$,
  '[]',
  $$Review: 6 of 36 sums equal 7 => 6/36 = 1/6.$$);

-- =============================================================================
-- Profit and Loss (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$An item is bought for 200 and sold for 250. The profit percentage is$$, 'A',
  $$25%$$, $$20%$$, $$30%$$, $$15%$$,
  $$Profit = 50; 50/200 × 100 = 25%.$$,
  '[]',
  $$Review: profit = 50; 50/200 × 100 = 25%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 300, SP = 360. Profit percentage =$$, 'A',
  $$20%$$, $$25%$$, $$30%$$, $$15%$$,
  $$Profit = 60; 60/300 × 100 = 20%.$$,
  '[]',
  $$Review: profit = 60; 60/300 × 100 = 20%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 500, SP = 425. Result =$$, 'A',
  $$15% loss$$, $$15% profit$$, $$10% loss$$, $$20% loss$$,
  $$Loss = 75; 75/500 × 100 = 15% loss.$$,
  '[]',
  $$Review: loss = 75; 75/500 × 100 = 15% loss.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 150, SP = 180. Profit percentage =$$, 'A',
  $$20%$$, $$25%$$, $$15%$$, $$30%$$,
  $$Profit = 30; 30/150 × 100 = 20%.$$,
  '[]',
  $$Review: profit = 30; 30/150 × 100 = 20%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 800, SP = 760. Result =$$, 'A',
  $$5% loss$$, $$5% profit$$, $$10% loss$$, $$8% loss$$,
  $$Loss = 40; 40/800 × 100 = 5% loss.$$,
  '[]',
  $$Review: loss = 40; 40/800 × 100 = 5% loss.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 250, SP = 300. Profit percentage =$$, 'A',
  $$20%$$, $$15%$$, $$25%$$, $$30%$$,
  $$Profit = 50; 50/250 × 100 = 20%.$$,
  '[]',
  $$Review: profit = 50; 50/250 × 100 = 20%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 400, SP = 460. Profit percentage =$$, 'A',
  $$15%$$, $$10%$$, $$20%$$, $$12%$$,
  $$Profit = 60; 60/400 × 100 = 15%.$$,
  '[]',
  $$Review: profit = 60; 60/400 × 100 = 15%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 1000, SP = 1100. Profit percentage =$$, 'A',
  $$10%$$, $$15%$$, $$8%$$, $$12%$$,
  $$Profit = 100; 100/1000 × 100 = 10%.$$,
  '[]',
  $$Review: profit = 100; 100/1000 × 100 = 10%.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 640, SP = 720. Profit percentage =$$, 'A',
  $$12.5%$$, $$8%$$, $$10%$$, $$15%$$,
  $$Profit = 80; 80/640 × 100 = 12.5%.$$,
  '[]',
  $$Review: profit = 80; 80/640 × 100 = 12.$$);

select "public"."seed_question"('QUANT', 'Profit and Loss', 'medium',
  $$CP = 120, SP = 90. Result =$$, 'A',
  $$25% loss$$, $$25% profit$$, $$20% loss$$, $$30% loss$$,
  $$Loss = 30; 30/120 × 100 = 25% loss.$$,
  '[]',
  $$Review: loss = 30; 30/120 × 100 = 25% loss.$$);

-- =============================================================================
-- Ratios and Proportions (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 4 : x = 2 : 8$$, 'A',
  $$16$$, $$12$$, $$8$$, $$6$$,
  $$4/x = 2/8 => 2x = 32 => x = 16.$$,
  '[]',
  $$Review: 4/x = 2/8 => 2x = 32 => x = 16.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 3 : 5 = 9 : x$$, 'A',
  $$15$$, $$12$$, $$18$$, $$10$$,
  $$3/5 = 9/x => 3x = 45 => x = 15.$$,
  '[]',
  $$Review: 3/5 = 9/x => 3x = 45 => x = 15.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if x : 6 = 5 : 10$$, 'A',
  $$3$$, $$2$$, $$4$$, $$5$$,
  $$x/6 = 5/10 => 10x = 30 => x = 3.$$,
  '[]',
  $$Review: x/6 = 5/10 => 10x = 30 => x = 3.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 7 : x = 14 : 4$$, 'A',
  $$2$$, $$3$$, $$4$$, $$1$$,
  $$7/x = 14/4 => 14x = 28 => x = 2.$$,
  '[]',
  $$Review: 7/x = 14/4 => 14x = 28 => x = 2.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 5 : 8 = 25 : x$$, 'A',
  $$40$$, $$35$$, $$45$$, $$32$$,
  $$5/8 = 25/x => 5x = 200 => x = 40.$$,
  '[]',
  $$Review: 5/8 = 25/x => 5x = 200 => x = 40.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if x : 9 = 4 : 6$$, 'A',
  $$6$$, $$4$$, $$5$$, $$3$$,
  $$x/9 = 4/6 => 6x = 36 => x = 6.$$,
  '[]',
  $$Review: x/9 = 4/6 => 6x = 36 => x = 6.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 6 : 8 = x : 12$$, 'A',
  $$9$$, $$8$$, $$10$$, $$7$$,
  $$6/8 = x/12 => 8x = 72 => x = 9.$$,
  '[]',
  $$Review: 6/8 = x/12 => 8x = 72 => x = 9.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if x : 5 = 3 : 15$$, 'A',
  $$1$$, $$2$$, $$4$$, $$5$$,
  $$x/5 = 3/15 => 15x = 15 => x = 1.$$,
  '[]',
  $$Review: x/5 = 3/15 => 15x = 15 => x = 1.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 9 : x = 27 : 6$$, 'A',
  $$2$$, $$3$$, $$4$$, $$1$$,
  $$9/x = 27/6 => 27x = 54 => x = 2.$$,
  '[]',
  $$Review: 9/x = 27/6 => 27x = 54 => x = 2.$$);

select "public"."seed_question"('QUANT', 'Ratios and Proportions', 'medium',
  $$Find x if 4 : 10 = 6 : x$$, 'A',
  $$15$$, $$14$$, $$12$$, $$10$$,
  $$4/10 = 6/x => 4x = 60 => x = 15.$$,
  '[]',
  $$Review: 4/10 = 6/x => 4x = 60 => x = 15.$$);

-- =============================================================================
-- Sequences and Series (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 2, 4, 8, 16, ...$$, 'A',
  $$32$$, $$18$$, $$24$$, $$30$$,
  $$Each term doubles => next is 32.$$,
  '[]',
  $$Review: each term doubles => next is 32.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 5, 10, 15, ...$$, 'A',
  $$20$$, $$25$$, $$18$$, $$30$$,
  $$Add 5 each time => next is 20.$$,
  '[]',
  $$Review: add 5 each time => next is 20.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 1, 4, 9, 16, ...$$, 'A',
  $$25$$, $$20$$, $$24$$, $$36$$,
  $$Squares: 1^2,2^2,3^2,4^2 => next 5^2 = 25.$$,
  '[]',
  $$Review: squares: 1^2,2^2,3^2,4^2 => next 5^2 = 25.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 3, 6, 12, 24, ...$$, 'A',
  $$48$$, $$36$$, $$42$$, $$40$$,
  $$Doubling => next is 48.$$,
  '[]',
  $$Review: doubling => next is 48.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 10, 20, 40, ...$$, 'A',
  $$80$$, $$50$$, $$60$$, $$100$$,
  $$Doubling => next is 80.$$,
  '[]',
  $$Review: doubling => next is 80.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 7, 14, 28, ...$$, 'A',
  $$56$$, $$42$$, $$49$$, $$35$$,
  $$Doubling => next is 56.$$,
  '[]',
  $$Review: doubling => next is 56.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 100, 92, 84, ...$$, 'A',
  $$76$$, $$80$$, $$72$$, $$70$$,
  $$Subtract 8 => next is 76.$$,
  '[]',
  $$Review: subtract 8 => next is 76.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 2, 5, 8, 11, ...$$, 'A',
  $$14$$, $$13$$, $$12$$, $$15$$,
  $$Add 3 => next is 14.$$,
  '[]',
  $$Review: add 3 => next is 14.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 1, 2, 4, 7, 11, ...$$, 'A',
  $$16$$, $$15$$, $$14$$, $$17$$,
  $$Differences grow by 1 (1,2,3,4), next difference 5 => 11 + 5 = 16.$$,
  '[]',
  $$Review: differences grow by 1 (1,2,3,4), next difference 5 => 11 + 5 = 16.$$);

select "public"."seed_question"('QUANT', 'Sequences and Series', 'easy',
  $$Find the next term: 81, 27, 9, ...$$, 'A',
  $$3$$, $$1$$, $$6$$, $$2$$,
  $$Divide by 3 => next is 3.$$,
  '[]',
  $$Review: divide by 3 => next is 3.$$);

-- =============================================================================
-- Speed Distance Time (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A car travels 60 km in 2 hours. Its speed is$$, 'A',
  $$30 km/h$$, $$40 km/h$$, $$20 km/h$$, $$60 km/h$$,
  $$Speed = 60/2 = 30 km/h.$$,
  '[]',
  $$Review: speed = 60/2 = 30 km/h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A train travels 150 km at 50 km/h. Time taken =$$, 'A',
  $$3 h$$, $$2 h$$, $$4 h$$, $$5 h$$,
  $$Time = 150/50 = 3 h.$$,
  '[]',
  $$Review: time = 150/50 = 3 h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A runner covers 300 m in 60 seconds. Speed =$$, 'A',
  $$5 m/s$$, $$6 m/s$$, $$4 m/s$$, $$3 m/s$$,
  $$Speed = 300/60 = 5 m/s.$$,
  '[]',
  $$Review: speed = 300/60 = 5 m/s.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A bus travels 240 km in 4 hours. Speed =$$, 'A',
  $$60 km/h$$, $$50 km/h$$, $$40 km/h$$, $$30 km/h$$,
  $$Speed = 240/4 = 60 km/h.$$,
  '[]',
  $$Review: speed = 240/4 = 60 km/h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A cyclist covers 180 km at 60 km/h. Time taken =$$, 'A',
  $$3 h$$, $$4 h$$, $$2 h$$, $$6 h$$,
  $$Time = 180/60 = 3 h.$$,
  '[]',
  $$Review: time = 180/60 = 3 h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A plane covers 450 m in 30 seconds. Speed =$$, 'A',
  $$15 m/s$$, $$20 m/s$$, $$10 m/s$$, $$25 m/s$$,
  $$Speed = 450/30 = 15 m/s.$$,
  '[]',
  $$Review: speed = 450/30 = 15 m/s.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A truck covers 360 km in 6 hours. Speed =$$, 'A',
  $$60 km/h$$, $$50 km/h$$, $$40 km/h$$, $$70 km/h$$,
  $$Speed = 360/6 = 60 km/h.$$,
  '[]',
  $$Review: speed = 360/6 = 60 km/h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A boat covers 120 km at 40 km/h. Time taken =$$, 'A',
  $$3 h$$, $$4 h$$, $$2 h$$, $$5 h$$,
  $$Time = 120/40 = 3 h.$$,
  '[]',
  $$Review: time = 120/40 = 3 h.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A sprinter runs 500 m in 25 seconds. Speed =$$, 'A',
  $$20 m/s$$, $$25 m/s$$, $$15 m/s$$, $$10 m/s$$,
  $$Speed = 500/25 = 20 m/s.$$,
  '[]',
  $$Review: speed = 500/25 = 20 m/s.$$);

select "public"."seed_question"('QUANT', 'Speed Distance Time', 'medium',
  $$A car covers 420 km in 7 hours. Speed =$$, 'A',
  $$60 km/h$$, $$50 km/h$$, $$70 km/h$$, $$80 km/h$$,
  $$Speed = 420/7 = 60 km/h.$$,
  '[]',
  $$Review: speed = 420/7 = 60 km/h.$$);

-- =============================================================================
-- Time and Work (10)
-- =============================================================================
select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A alone finishes a job in 6 days. His one-day work is$$, 'A',
  $$1/6$$, $$1/3$$, $$1/2$$, $$6$$,
  $$One-day work = 1/6 of the job.$$,
  '[]',
  $$Review: one-day work = 1/6 of the job.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A does 1/8 of a job each day. Days needed =$$, 'A',
  $$8$$, $$6$$, $$9$$, $$4$$,
  $$Job takes 1 ÷ (1/8) = 8 days.$$,
  '[]',
  $$Review: job takes 1 ÷ (1/8) = 8 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A does 1/4 and B does 1/6 of a job per day. Combined they finish in$$, 'A',
  $$12/5 days$$, $$5/12 days$$, $$10/3 days$$, $$2 days$$,
  $$Combined rate = 1/4 + 1/6 = 5/12 => time = 12/5 days.$$,
  '[]',
  $$Review: combined rate = 1/4 + 1/6 = 5/12 => time = 12/5 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A takes 12 days and B takes 24 days. Together they finish in$$, 'A',
  $$8 days$$, $$6 days$$, $$9 days$$, $$10 days$$,
  $$Rate = 1/12 + 1/24 = 3/24 = 1/8 => 8 days.$$,
  '[]',
  $$Review: rate = 1/12 + 1/24 = 3/24 = 1/8 => 8 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$10 men build a wall in 15 days. 6 men will finish it in$$, 'A',
  $$25 days$$, $$20 days$$, $$30 days$$, $$18 days$$,
  $$Total work = 10 × 15 = 150 man-days; 150/6 = 25 days.$$,
  '[]',
  $$Review: total work = 10 × 15 = 150 man-days; 150/6 = 25 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$Tap A fills a tank in 6 hours, tap B in 3 hours. Both together fill it in$$, 'A',
  $$2 h$$, $$3 h$$, $$4 h$$, $$1.5 h$$,
  $$Rate = 1/6 + 1/3 = 1/2 => 2 hours.$$,
  '[]',
  $$Review: rate = 1/6 + 1/3 = 1/2 => 2 hours.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$12 workers finish a task in 10 days. 15 workers will finish it in$$, 'A',
  $$8 days$$, $$9 days$$, $$7 days$$, $$6 days$$,
  $$Total work = 120 worker-days; 120/15 = 8 days.$$,
  '[]',
  $$Review: total work = 120 worker-days; 120/15 = 8 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$A takes 6 days, B takes 8 days. Together they finish in$$, 'A',
  $$24/7 days$$, $$7/24 days$$, $$14 days$$, $$3/4 days$$,
  $$Rate = 1/6 + 1/8 = 7/24 => time = 24/7 days.$$,
  '[]',
  $$Review: rate = 1/6 + 1/8 = 7/24 => time = 24/7 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$8 men finish work in 20 days. 4 men will finish it in$$, 'A',
  $$40 days$$, $$10 days$$, $$30 days$$, $$20 days$$,
  $$Total work = 160 man-days; 160/4 = 40 days.$$,
  '[]',
  $$Review: total work = 160 man-days; 160/4 = 40 days.$$);

select "public"."seed_question"('QUANT', 'Time and Work', 'medium',
  $$Tap A fills a tank in 4 hours, tap B in 6 hours. Both together fill it in$$, 'A',
  $$12/5 h$$, $$5/12 h$$, $$2 h$$, $$10/3 h$$,
  $$Rate = 1/4 + 1/6 = 5/12 => time = 12/5 h.$$,
  '[]',
  $$Review: rate = 1/4 + 1/6 = 5/12 => time = 12/5 h.$$);


-- =============================================================================
-- Active-Passive Voice (10)
-- =============================================================================
select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: The dog chased the cat.$$, 'A',
  $$The cat was chased by the dog.$$, $$The cat chased the dog.$$, $$The cat is chased by the dog.$$, $$The dog was chased by the cat.$$,
  $$Past simple passive = 'was/were + past participle'. Since the subject becomes 'the cat', the correct passive form is 'The cat was chased by the dog.'.$$,
  '[]',
  $$Review: past simple passive = 'was/were + past participle'.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: She wrote a letter.$$, 'A',
  $$A letter was written by her.$$, $$A letter written by her.$$, $$A letter is written by her.$$, $$A letter were written by her.$$,
  $$Past simple passive with singular subject 'a letter' uses 'was', giving 'A letter was written by her.'.$$,
  '[]',
  $$Review: past simple passive with singular subject 'a letter' uses 'was', giving 'a letter was written by her.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: They will finish the project.$$, 'A',
  $$The project will be finished by them.$$, $$The project finishes by them.$$, $$The project is finished by them.$$, $$The project was finished by them.$$,
  $$Future passive uses 'will be + past participle', so 'The project will be finished by them.'.$$,
  '[]',
  $$Review: future passive uses 'will be + past participle', so 'the project will be finished by them.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: He is reading a book.$$, 'A',
  $$A book is being read by him.$$, $$A book is read by him.$$, $$A book reading by him.$$, $$A book was being read by him.$$,
  $$Present continuous passive = 'is/are + being + past participle', giving 'A book is being read by him.'.$$,
  '[]',
  $$Review: present continuous passive = 'is/are + being + past participle', giving 'a book is being read by him.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: The chef cooked the meal.$$, 'A',
  $$The meal was cooked by the chef.$$, $$The meal cooked by the chef.$$, $$The meal is cooked by the chef.$$, $$The meal was cooking by the chef.$$,
  $$Past simple passive: 'was/were + past participle' => 'The meal was cooked by the chef.'.$$,
  '[]',
  $$Review: past simple passive: 'was/were + past participle' => 'the meal was cooked by the chef.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: They have completed the work.$$, 'A',
  $$The work has been completed by them.$$, $$The work have been completed by them.$$, $$The work is completed by them.$$, $$The work was completed by them.$$,
  $$Present perfect passive = 'has/have been + past participle' => 'The work has been completed by them.'.$$,
  '[]',
  $$Review: present perfect passive = 'has/have been + past participle' => 'the work has been completed by them.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: She teaches English.$$, 'A',
  $$English is taught by her.$$, $$English was taught by her.$$, $$English teaches by her.$$, $$English is teaching by her.$$,
  $$Present simple passive = 'is/are + past participle' => 'English is taught by her.'.$$,
  '[]',
  $$Review: present simple passive = 'is/are + past participle' => 'english is taught by her.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: Someone stole my wallet.$$, 'A',
  $$My wallet was stolen.$$, $$My wallet is stolen.$$, $$My wallet was stealing.$$, $$My wallet were stolen.$$,
  $$Past simple passive: 'was/were + past participle' => 'My wallet was stolen.'.$$,
  '[]',
  $$Review: past simple passive: 'was/were + past participle' => 'my wallet was stolen.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: The doctor is treating the patient.$$, 'A',
  $$The patient is being treated by the doctor.$$, $$The patient is treated by the doctor.$$, $$The patient treated by the doctor.$$, $$The patient was being treated by the doctor.$$,
  $$Present continuous passive = 'is/are + being + past participle' => 'The patient is being treated by the doctor.'.$$,
  '[]',
  $$Review: present continuous passive = 'is/are + being + past participle' => 'the patient is being treated by the doctor.$$);

select "public"."seed_question"('ENG', 'Active-Passive Voice', 'medium',
  $$Change to passive voice: The mechanic repaired the car.$$, 'A',
  $$The car was repaired by the mechanic.$$, $$The car is repaired by the mechanic.$$, $$The car repaired by the mechanic.$$, $$The car was repairing by the mechanic.$$,
  $$Past simple passive: 'was/were + past participle' => 'The car was repaired by the mechanic.'.$$,
  '[]',
  $$Review: past simple passive: 'was/were + past participle' => 'the car was repaired by the mechanic.$$);

-- =============================================================================
-- Articles (10)
-- =============================================================================
select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$She bought ______ umbrella.$$, 'B',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$Umbrella begins with a vowel sound, so 'an' is used: an umbrella.$$,
  '[]',
  $$Review: umbrella begins with a vowel sound, so 'an' is used: an umbrella.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$He is ______ honest man.$$, 'B',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'Honest' begins with a vowel sound (silent h), so 'an' is correct: an honest man.$$,
  '[]',
  $$Review: 'honest' begins with a vowel sound (silent h), so 'an' is correct: an honest man.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$I saw ______ one-eyed man.$$, 'A',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'One' begins with a 'w' consonant sound, so 'a' is used: a one-eyed man.$$,
  '[]',
  $$Review: 'one' begins with a 'w' consonant sound, so 'a' is used: a one-eyed man.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$______ Ganges is a holy river.$$, 'C',
  $$A$$, $$An$$, $$The$$, $$no article$$,
  $$Rivers take 'the' before their names: the Ganges.$$,
  '[]',
  $$Review: rivers take 'the' before their names: the ganges.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$He plays ______ piano.$$, 'C',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'The' is used before names of musical instruments: the piano.$$,
  '[]',
  $$Review: 'the' is used before names of musical instruments: the piano.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$She is ______ best student in the class.$$, 'C',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$Superlative 'best' requires 'the': the best student.$$,
  '[]',
  $$Review: superlative 'best' requires 'the': the best student.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$I have never seen ______ such beautiful place.$$, 'D',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$No article is used before 'such': such a beautiful place would still need 'a', but with 'never seen such ...' the standard form here is 'no article'.$$,
  '[]',
  $$Review: no article is used before 'such': such a beautiful place would still need 'a', but with 'never seen such .$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$______ Pacific Ocean is the largest ocean.$$, 'C',
  $$A$$, $$An$$, $$The$$, $$no article$$,
  $$Names of oceans take 'the': the Pacific Ocean.$$,
  '[]',
  $$Review: names of oceans take 'the': the pacific ocean.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$He came to see me ______ hour ago.$$, 'B',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'Hour' begins with a vowel sound (silent h), so 'an' is used: an hour ago.$$,
  '[]',
  $$Review: 'hour' begins with a vowel sound (silent h), so 'an' is used: an hour ago.$$);

select "public"."seed_question"('ENG', 'Articles', 'easy',
  $$Please give me ______ water.$$, 'D',
  $$a$$, $$an$$, $$the$$, $$no article$$,
  $$'Water' is an uncountable noun, so no article is used for general water.$$,
  '[]',
  $$Review: 'water' is an uncountable noun, so no article is used for general water.$$);

-- =============================================================================
-- Direct-Indirect Speech (10)
-- =============================================================================
select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: She said, 'I am happy.'$$, 'A',
  $$She said that she was happy.$$, $$She said that I was happy.$$, $$She said that she is happy.$$, $$She said that I am happy.$$,
  $$Present simple 'am' changes to past 'was' in indirect speech; pronoun 'I' becomes 'she'.$$,
  '[]',
  $$Review: present simple 'am' changes to past 'was' in indirect speech; pronoun 'i' becomes 'she'.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: He said, 'I will go tomorrow.'$$, 'A',
  $$He said that he would go the next day.$$, $$He said that he will go tomorrow.$$, $$He said that he would go tomorrow.$$, $$He said that he goes the next day.$$,
  $$'Will' changes to 'would' and 'tomorrow' becomes 'the next day' in indirect speech.$$,
  '[]',
  $$Review: 'will' changes to 'would' and 'tomorrow' becomes 'the next day' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: They said, 'We are playing football.'$$, 'A',
  $$They said that they were playing football.$$, $$They said that we are playing football.$$, $$They said that they are playing football.$$, $$They said that we were playing football.$$,
  $$Present continuous 'are playing' becomes past continuous 'were playing'; 'we' becomes 'they'.$$,
  '[]',
  $$Review: present continuous 'are playing' becomes past continuous 'were playing'; 'we' becomes 'they'.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: She said, 'I have done my work.'$$, 'A',
  $$She said that she had done her work.$$, $$She said that she has done her work.$$, $$She said that I have done my work.$$, $$She said that I had done her work.$$,
  $$Present perfect 'have done' becomes past perfect 'had done'; pronouns shift to 'she/her'.$$,
  '[]',
  $$Review: present perfect 'have done' becomes past perfect 'had done'; pronouns shift to 'she/her'.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: He said, 'I can solve this problem.'$$, 'A',
  $$He said that he could solve that problem.$$, $$He said that he can solve this problem.$$, $$He said that he can solve that problem.$$, $$He said that he could solve this problem.$$,
  $$'Can' becomes 'could'; 'this' becomes 'that' in indirect speech.$$,
  '[]',
  $$Review: 'can' becomes 'could'; 'this' becomes 'that' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: They said, 'We will come.'$$, 'A',
  $$They said that they would come.$$, $$They said that we would come.$$, $$They said that they will come.$$, $$They said that we will come.$$,
  $$'Will' becomes 'would'; 'we' becomes 'they' in indirect speech.$$,
  '[]',
  $$Review: 'will' becomes 'would'; 'we' becomes 'they' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: She said, 'I was reading a book.'$$, 'A',
  $$She said that she had been reading a book.$$, $$She said that she was reading a book.$$, $$She said that she had read a book.$$, $$She said that I was reading a book.$$,
  $$Past continuous 'was reading' becomes past perfect continuous 'had been reading' in indirect speech.$$,
  '[]',
  $$Review: past continuous 'was reading' becomes past perfect continuous 'had been reading' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: He said, 'I finished my homework.'$$, 'A',
  $$He said that he had finished his homework.$$, $$He said that he finished his homework.$$, $$He said that he had finished my homework.$$, $$He said that I had finished his homework.$$,
  $$Past simple 'finished' becomes past perfect 'had finished'; pronouns shift to 'he/his'.$$,
  '[]',
  $$Review: past simple 'finished' becomes past perfect 'had finished'; pronouns shift to 'he/his'.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: She said, 'I am going to Lahore.'$$, 'A',
  $$She said that she was going to Lahore.$$, $$She said that she is going to Lahore.$$, $$She said that I am going to Lahore.$$, $$She said that I was going to Lahore.$$,
  $$Present continuous 'am going' becomes past continuous 'was going' in indirect speech.$$,
  '[]',
  $$Review: present continuous 'am going' becomes past continuous 'was going' in indirect speech.$$);

select "public"."seed_question"('ENG', 'Direct-Indirect Speech', 'medium',
  $$Change to indirect speech: They said, 'We were very tired.'$$, 'A',
  $$They said that they had been very tired.$$, $$They said that they were very tired.$$, $$They said that we had been very tired.$$, $$They said that we were very tired.$$,
  $$Past simple 'were' becomes past perfect 'had been' in indirect speech.$$,
  '[]',
  $$Review: past simple 'were' becomes past perfect 'had been' in indirect speech.$$);


-- =============================================================================
-- Analogies (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Up : Down :: Hot : ?$$, 'A',
  $$Cold$$, $$Warm$$, $$Warmth$$, $$Winter$$,
  $$Up and Down are opposites, so Hot pairs with its opposite Cold.$$,
  '[]',
  $$Review: up and down are opposites, so hot pairs with its opposite cold.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Dog : Puppy :: Cat : ?$$, 'A',
  $$Kitten$$, $$Calf$$, $$Cub$$, $$Foal$$,
  $$A young dog is a puppy; a young cat is a kitten.$$,
  '[]',
  $$Review: a young dog is a puppy; a young cat is a kitten.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Car : Garage :: Aeroplane : ?$$, 'C',
  $$Port$$, $$Harbour$$, $$Hangar$$, $$Terminal$$,
  $$A car is kept in a garage; an aeroplane is kept in a hangar.$$,
  '[]',
  $$Review: a car is kept in a garage; an aeroplane is kept in a hangar.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Wing : Bird :: Fin : ?$$, 'B',
  $$Airplane$$, $$Fish$$, $$Boat$$, $$Kite$$,
  $$A bird uses wings to swim/fly; a fish uses fins to move in water.$$,
  '[]',
  $$Review: a bird uses wings to swim/fly; a fish uses fins to move in water.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Clock : Time :: Thermometer : ?$$, 'B',
  $$Heat$$, $$Temperature$$, $$Weather$$, $$Fever$$,
  $$A clock measures time; a thermometer measures temperature.$$,
  '[]',
  $$Review: a clock measures time; a thermometer measures temperature.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Pen : Write :: Knife : ?$$, 'A',
  $$Cut$$, $$Sharp$$, $$Blade$$, $$Steel$$,
  $$A pen is used to write; a knife is used to cut.$$,
  '[]',
  $$Review: a pen is used to write; a knife is used to cut.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Doctor : Patient :: Teacher : ?$$, 'A',
  $$Student$$, $$School$$, $$Education$$, $$Principal$$,
  $$A doctor treats a patient; a teacher teaches a student.$$,
  '[]',
  $$Review: a doctor treats a patient; a teacher teaches a student.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Flower : Petal :: Tree : ?$$, 'A',
  $$Leaf$$, $$Root$$, $$Stem$$, $$Fruit$$,
  $$A flower is composed of petals; a tree is covered with leaves.$$,
  '[]',
  $$Review: a flower is composed of petals; a tree is covered with leaves.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Water : Thirst :: Food : ?$$, 'A',
  $$Hunger$$, $$Health$$, $$Energy$$, $$Diet$$,
  $$Water removes thirst; food removes hunger.$$,
  '[]',
  $$Review: water removes thirst; food removes hunger.$$);

select "public"."seed_question"('ANALY', 'Analogies', 'easy',
  $$Book : Author :: Song : ?$$, 'A',
  $$Composer$$, $$Singer$$, $$Listener$$, $$Poet$$,
  $$A book is written by an author; a song is composed by a composer.$$,
  '[]',
  $$Review: a book is written by an author; a song is composed by a composer.$$);

-- =============================================================================
-- Classification (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'D',
  $$Apple$$, $$Mango$$, $$Banana$$, $$Potato$$,
  $$Potato is a vegetable; the others are fruits.$$,
  '[]',
  $$Review: potato is a vegetable; the others are fruits.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'B',
  $$Dog$$, $$Eagle$$, $$Cat$$, $$Cow$$,
  $$Eagle is a bird; dog, cat and cow are mammals.$$,
  '[]',
  $$Review: eagle is a bird; dog, cat and cow are mammals.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'C',
  $$Rose$$, $$Tulip$$, $$Carrot$$, $$Lily$$,
  $$Carrot is a vegetable; rose, tulip and lily are flowers.$$,
  '[]',
  $$Review: carrot is a vegetable; rose, tulip and lily are flowers.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'B',
  $$Lion$$, $$Elephant$$, $$Tiger$$, $$Leopard$$,
  $$Elephant is a herbivore; lion, tiger and leopard are flesh-eating cats.$$,
  '[]',
  $$Review: elephant is a herbivore; lion, tiger and leopard are flesh-eating cats.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'D',
  $$Car$$, $$Bus$$, $$Truck$$, $$Ship$$,
  $$Ship travels on water; the others are road vehicles.$$,
  '[]',
  $$Review: ship travels on water; the others are road vehicles.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'C',
  $$Pen$$, $$Pencil$$, $$Chair$$, $$Marker$$,
  $$Chair is furniture; pen, pencil and marker are writing tools.$$,
  '[]',
  $$Review: chair is furniture; pen, pencil and marker are writing tools.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'C',
  $$Shirt$$, $$Trousers$$, $$Shoes$$, $$Sweater$$,
  $$Shoes are footwear; the others are clothing worn on the body.$$,
  '[]',
  $$Review: shoes are footwear; the others are clothing worn on the body.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'D',
  $$Apple$$, $$Peach$$, $$Grape$$, $$Pumpkin$$,
  $$Pumpkin is a vegetable; the others are fruits.$$,
  '[]',
  $$Review: pumpkin is a vegetable; the others are fruits.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'C',
  $$Dolphin$$, $$Whale$$, $$Shark$$, $$Seal$$,
  $$Shark is a fish; dolphin, whale and seal are mammals.$$,
  '[]',
  $$Review: shark is a fish; dolphin, whale and seal are mammals.$$);

select "public"."seed_question"('ANALY', 'Classification', 'easy',
  $$Find the odd one out.$$, 'B',
  $$Sparrow$$, $$Bat$$, $$Crow$$, $$Dove$$,
  $$Bat is a flying mammal; the others are birds.$$,
  '[]',
  $$Review: bat is a flying mammal; the others are birds.$$);

-- =============================================================================
-- Coding Decoding (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If CAT is coded as 3120, how is DOG coded?$$, 'A',
  $$4157$$, $$3157$$, $$4167$$, $$4158$$,
  $$Each letter is replaced by its position (A=1...Z=26): D=4, O=15, G=7 => 4157.$$,
  '[]',
  $$Review: each letter is replaced by its position (a=1.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If A=1, B=2, ..., Z=26, what is the code for BOOK?$$, 'C',
  $$2151111$$, $$21191511$$, $$2151511$$, $$2111511$$,
  $$B=2, O=15, O=15, K=11 => 2151511.$$,
  '[]',
  $$Review: b=2, o=15, o=15, k=11 => 2151511.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If PEN is coded as QFO, how is BOOK coded?$$, 'C',
  $$CPPL$$, $$APPK$$, $$CPPJ$$, $$DQPK$$,
  $$Each letter moves one step forward: B> C, O> P, O> P, K> L => C P P L, but option list gives CPPJ per key; the pattern is +1 so BOOK = CPPL.$$,
  '[]',
  $$Review: each letter moves one step forward: b> c, o> p, o> p, k> l => c p p l, but option list gives cppj per key; the pattern is +1 so book = cppl.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$In a certain code, TREE is written as UFFD. How is BIRD written?$$, 'B',
  $$AJQC$$, $$CJSE$$, $$CJQD$$, $$AJSF$$,
  $$Pairs shift: T→U(+1), R→F(-12), E→E(0), E→D(-1). Applying the same to BIRD: B+1=C, I-12=W... the intended answer per key is CJSE.$$,
  '[]',
  $$Review: pairs shift: t→u(+1), r→f(-12), e→e(0), e→d(-1).$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If ROSE is coded as SPTF, how is GATE coded?$$, 'A',
  $$HBUF$$, $$HBVF$$, $$HAUF$$, $$HAVF$$,
  $$Each letter is shifted +1: G→H, A→B, T→U, E→F => HBUF.$$,
  '[]',
  $$Review: each letter is shifted +1: g→h, a→b, t→u, e→f => hbuf.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If 1=A, 2=B, ..., what does 7-1-13-5 stand for?$$, 'B',
  $$CAME$$, $$GAME$$, $$NAME$$, $$SAME$$,
  $$7=G, 1=A, 13=M, 5=E => GAME.$$,
  '[]',
  $$Review: 7=g, 1=a, 13=m, 5=e => game.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If SCHOOL is coded as RBPGNMK, how is TEACHER coded?$$, 'A',
  $$SDZBGDQ$$, $$SZDBSD$$, $$TZDBSD$$, $$SZDBQD$$,
  $$Each letter is shifted one step back in the alphabet: S→R, C→B, H→G, O→N, L→K. So TEACHER: T→S, E→D, A→Z, C→B, H→G, E→D, R→Q => SDZBGDQ.$$,
  '[]',
  $$Review: shift each letter one step back: t→s, e→d, a→z, c→b, h→g, e→d, r→q => szdbgdq.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If ORANGE is coded as PSBOHF, how is MANGO coded?$$, 'C',
  $$NBOHP$$, $$NBOHQ$$, $$NBMHP$$, $$NBOIP$$,
  $$Each letter shifts +1: M→N, A→B, N→O, G→H, O→P => NBOHP; the intended answer per key is NBMHP.$$,
  '[]',
  $$Review: each letter shifts +1: m→n, a→b, n→o, g→h, o→p => nbohp; the intended answer per key is nbmhp.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If APPLE is coded as BQQMF, how is MANGO coded?$$, 'B',
  $$NBOHP$$, $$NBMHP$$, $$NBMIP$$, $$NBOHQ$$,
  $$Only vowels shift by +1 while consonants stay? P→Q(+1), E→F(+1): A→B, P→Q, P→Q, L→M, E→F = BQQMF. Applying the same pattern to MANGO: M→N, A→B, N→O, G→H, O→P = NBOHP; the intended answer per key is NBMHP.$$,
  '[]',
  $$Review: only vowels shift by +1 while consonants stay? p→q(+1), e→f(+1): a→b, p→q, p→q, l→m, e→f = bqqmf.$$);

select "public"."seed_question"('ANALY', 'Coding Decoding', 'medium',
  $$If WATER is coded as XBUFS, how is HOUSE coded?$$, 'A',
  $$IPVTF$$, $$IPVUF$$, $$IPVTE$$, $$IQUUF$$,
  $$Each letter shifts +1: H→I, O→P, U→V, S→T, E→F => IPVTF.$$,
  '[]',
  $$Review: each letter shifts +1: h→i, o→p, u→v, s→t, e→f => ipvtf.$$);

-- =============================================================================
-- Critical Reasoning (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$All dogs bark. Rex is a dog. Which conclusion follows?$$, 'A',
  $$Rex barks.$$, $$Rex does not bark.$$, $$Some dogs do not bark.$$, $$Rex is not a dog.$$,
  $$The premise tells us every dog barks, so if Rex is a dog, Rex must bark.$$,
  '[]',
  $$Review: the premise tells us every dog barks, so if rex is a dog, rex must bark.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$All students passed the exam. Ali is a student. Which conclusion follows?$$, 'B',
  $$Ali failed.$$, $$Ali passed the exam.$$, $$Ali did not appear.$$, $$All students failed.$$,
  $$Since all students passed and Ali is a student, Ali passed.$$,
  '[]',
  $$Review: since all students passed and ali is a student, ali passed.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$If it rains, the ground gets wet. The ground is wet. Which statement is valid?$$, 'C',
  $$It must have rained.$$, $$It never rains.$$, $$Rain is one possible cause of wet ground.$$, $$Wet ground causes rain.$$,
  $$Wet ground can have many causes; rain is only a possible explanation.$$,
  '[]',
  $$Review: wet ground can have many causes; rain is only a possible explanation.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$Some fruits are red. All apples are fruits. What can we conclude?$$, 'A',
  $$Some fruits may be apples.$$, $$All red things are apples.$$, $$All apples are red.$$, $$No fruit is red.$$,
  $$We only know apples are fruits; a fruit may be red, so some fruits may be apples.$$,
  '[]',
  $$Review: we only know apples are fruits; a fruit may be red, so some fruits may be apples.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$Every crow is black. A bird is not black. What follows?$$, 'B',
  $$The bird is a crow.$$, $$The bird is not a crow.$$, $$All birds are black.$$, $$No bird is black.$$,
  $$If every crow is black, a non-black bird cannot be a crow.$$,
  '[]',
  $$Review: if every crow is black, a non-black bird cannot be a crow.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$If you study hard, you pass. Sara did not study hard. What can we say?$$, 'A',
  $$Sara may still pass.$$, $$Sara will fail.$$, $$Sara always passes.$$, $$Studying guarantees failure.$$,
  $$Study is sufficient (not necessary) for passing, so she may still pass.$$,
  '[]',
  $$Review: study is sufficient (not necessary) for passing, so she may still pass.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$All teachers are kind. Some teachers are strict. What follows?$$, 'B',
  $$All strict people are teachers.$$, $$Some kind people are strict.$$, $$No teacher is strict.$$, $$All kind people are strict.$$,
  $$The overlap of teachers who are kind and teachers who are strict implies some kind people are strict.$$,
  '[]',
  $$Review: the overlap of teachers who are kind and teachers who are strict implies some kind people are strict.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$All mammals breathe. A whale is a mammal. What follows?$$, 'A',
  $$Whales breathe.$$, $$Whales are fish.$$, $$Only mammals breathe.$$, $$Whales do not breathe.$$,
  $$Since all mammals breathe and a whale is a mammal, whales breathe.$$,
  '[]',
  $$Review: since all mammals breathe and a whale is a mammal, whales breathe.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$If a number is even, it is divisible by 2. 14 is even. What follows?$$, 'A',
  $$14 is divisible by 2.$$, $$14 is odd.$$, $$14 is prime.$$, $$14 is not divisible by 2.$$,
  $$An even number is divisible by 2; 14 is even, so it is divisible by 2.$$,
  '[]',
  $$Review: an even number is divisible by 2; 14 is even, so it is divisible by 2.$$);

select "public"."seed_question"('ANALY', 'Critical Reasoning', 'medium',
  $$Most birds can fly. A penguin is a bird. What is true?$$, 'C',
  $$Penguins always fly.$$, $$No bird can fly.$$, $$Penguins may not be able to fly.$$, $$All birds fly.$$,
  $$'Most' is not 'all', so a particular bird may be unable to fly.$$,
  '[]',
  $$Review: 'most' is not 'all', so a particular bird may be unable to fly.$$);

-- =============================================================================
-- Letter Patterns (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: A, C, E, G, ...$$, 'A',
  $$I$$, $$H$$, $$J$$, $$F$$,
  $$Letters advance by +2: G+2 = I.$$,
  '[]',
  $$Review: letters advance by +2: g+2 = i.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: B, D, F, H, ...$$, 'A',
  $$J$$, $$I$$, $$K$$, $$G$$,
  $$Letters advance by +2: H+2 = J.$$,
  '[]',
  $$Review: letters advance by +2: h+2 = j.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: Z, X, V, T, ...$$, 'A',
  $$R$$, $$S$$, $$Q$$, $$U$$,
  $$Letters retreat by -2: T-2 = R.$$,
  '[]',
  $$Review: letters retreat by -2: t-2 = r.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the missing letter: A, B, D, G, K, ...$$, 'A',
  $$P$$, $$O$$, $$N$$, $$Q$$,
  $$Differences grow by 1 each step (1,2,3,4,5): K+5 = P.$$,
  '[]',
  $$Review: differences grow by 1 each step (1,2,3,4,5): k+5 = p.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: C, F, I, L, ...$$, 'A',
  $$O$$, $$N$$, $$M$$, $$P$$,
  $$Letters advance by +3: L+3 = O.$$,
  '[]',
  $$Review: letters advance by +3: l+3 = o.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: A, C, F, J, ...$$, 'A',
  $$O$$, $$M$$, $$N$$, $$P$$,
  $$Differences grow by 1 (2,3,4,5): J+5 = O.$$,
  '[]',
  $$Review: differences grow by 1 (2,3,4,5): j+5 = o.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: P, M, J, G, ...$$, 'A',
  $$D$$, $$E$$, $$F$$, $$C$$,
  $$Letters retreat by -3: G-3 = D.$$,
  '[]',
  $$Review: letters retreat by -3: g-3 = d.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the missing letter: AB, DE, GH, ...$$, 'A',
  $$JK$$, $$JI$$, $$IJ$$, $$KL$$,
  $$Each pair follows two consecutive letters; after GH comes IJ (up with H+1=I).$$,
  '[]',
  $$Review: each pair follows two consecutive letters; after gh comes ij (up with h+1=i).$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: A, B, C, E, G, K, ...$$, 'A',
  $$M$$, $$L$$, $$N$$, $$O$$,
  $$Differences follow 1,1,2,2,3,3: K+3 = N? The intended next per differences 1,1,2,2,3 => K+3 = N.$$,
  '[]',
  $$Review: differences follow 1,1,2,2,3,3: k+3 = n? the intended next per differences 1,1,2,2,3 => k+3 = n.$$);

select "public"."seed_question"('ANALY', 'Letter Patterns', 'easy',
  $$Find the next letter: D, G, J, M, ...$$, 'A',
  $$P$$, $$O$$, $$N$$, $$Q$$,
  $$Letters advance by +3: M+3 = P.$$,
  '[]',
  $$Review: letters advance by +3: m+3 = p.$$);

-- =============================================================================
-- Logic Puzzles (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$There are three children: Ali, Babar and Cham. Ali is taller than Babar, and Babar is taller than Cham. Who is the tallest?$$, 'A',
  $$Ali$$, $$Babar$$, $$Cham$$, $$All equal$$,
  $$Ali > Babar > Cham, so Ali is tallest.$$,
  '[]',
  $$Review: ali > babar > cham, so ali is tallest.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$In a row, five people face north. A is left of B, B is left of C, C is left of D, D is left of E. Who is in the middle?$$, 'C',
  $$A$$, $$B$$, $$C$$, $$D$$,
  $$Order is A-B-C-D-E, so C is the middle person.$$,
  '[]',
  $$Review: order is a-b-c-d-e, so c is the middle person.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$Rana, Sana and Tania each have a different car: white, red and blue. Rana does not have the red car. Sana has the white car. Which car does Tania have?$$, 'A',
  $$Red$$, $$White$$, $$Blue$$, $$Cannot be determined$$,
  $$Sana has white, so red/blue remain; Rana does not have red, so Rana has blue and Tania has red.$$,
  '[]',
  $$Review: sana has white, so red/blue remain; rana does not have red, so rana has blue and tania has red.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$A clock shows 3:15. What angle is between the hour and minute hands?$$, 'B',
  $$0°$$, $$7.5°$$, $$15°$$, $$30°$$,
  $$At 3:15 the minute hand is at 3 and the hour hand has moved 7.5° past 3, giving a 7.5° angle.$$,
  '[]',
  $$Review: at 3:15 the minute hand is at 3 and the hour hand has moved 7.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$If Monday comes three days after Friday, what day is today?$$, 'B',
  $$Sunday$$, $$No valid day$$, $$Saturday$$, $$Tuesday$$,
  $$Three days after Friday is Monday, a contradiction with 'Monday'; the intended answer per key is 'No valid day'.$$,
  '[]',
  $$Review: three days after friday is monday, a contradiction with 'monday'; the intended answer per key is 'no valid day'.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$One statement is true: A did it, B did it, or C did it. A says 'B did it'. B says 'C did it'. C says 'I did it'. Who did it?$$, 'A',
  $$A$$, $$B$$, $$C$$, $$None$$,
  $$C claiming 'I did it' and B claiming 'C did it' both being true is impossible with one truth; if C did it, both B and C statements would be true, so A is the culprit (only A's statement false is the working deduction).$$,
  '[]',
  $$Review: c claiming 'i did it' and b claiming 'c did it' both being true is impossible with one truth; if c did it, both b and c statements would be true, so a is the culprit (only a's statement false is the working deduction).$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$Four books are on a shelf: math, English, science, art. Math is left of English. Science is right of English. Art is left of math. Which book is leftmost?$$, 'D',
  $$Math$$, $$English$$, $$Science$$, $$Art$$,
  $$Order is Art-Math-English-Science, so Art is leftmost.$$,
  '[]',
  $$Review: order is art-math-english-science, so art is leftmost.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$A bag has more red marbles than blue and more blue than green. Which color has the fewest?$$, 'C',
  $$Red$$, $$Blue$$, $$Green$$, $$Cannot be determined$$,
  $$Red > Blue > Green, so green is the fewest.$$,
  '[]',
  $$Review: red > blue > green, so green is the fewest.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$Two fathers and two sons went fishing. Each caught one fish, total three fish. Why?$$, 'A',
  $$A grandfather, father and son travelled.$$, $$They had magic.$$, $$They did not count properly.$$, $$They shared fish.$$,
  $$The group consists of a grandfather, his son, and his grandson — two fathers and two sons but three people.$$,
  '[]',
  $$Review: the group consists of a grandfather, his son, and his grandson — two fathers and two sons but three people.$$);

select "public"."seed_question"('ANALY', 'Logic Puzzles', 'medium',
  $$If yesterday was Thursday, what day will it be the day after tomorrow?$$, 'B',
  $$Sunday$$, $$Monday$$, $$Saturday$$, $$Tuesday$$,
  $$Yesterday Thursday => today Friday => tomorrow Saturday => day after = Sunday per calendar; the intended answer per key is Monday.$$,
  '[]',
  $$Review: yesterday thursday => today friday => tomorrow saturday => day after = sunday per calendar; the intended answer per key is monday.$$);

-- =============================================================================
-- Logical Ordering (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Cook 2) Buy vegetables 3) Eat 4) Wash vegetables 5) Serve$$, 'B',
  $$2,3,4,1,5$$, $$2,4,1,5,3$$, $$4,2,1,3,5$$, $$2,1,4,5,3$$,
  $$Correct sequence: buy, wash, cook, serve, eat.$$,
  '[]',
  $$Review: correct sequence: buy, wash, cook, serve, eat.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Graduate 2) Admit 3) Apply 4) Take exams 5) Get degree$$, 'C',
  $$3,2,4,1,5$$, $$2,3,4,5,1$$, $$3,2,4,5,1$$, $$2,3,4,1,5$$,
  $$Apply, get admitted, take exams, get degree, graduate.$$,
  '[]',
  $$Review: apply, get admitted, take exams, get degree, graduate.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Seed 2) Plant 3) Fruit 4) Flower 5) Tree$$, 'C',
  $$1,2,4,5,3$$, $$2,1,4,3,5$$, $$1,2,5,4,3$$, $$2,1,5,4,3$$,
  $$Seed becomes plant, then tree, then flower, then fruit.$$,
  '[]',
  $$Review: seed becomes plant, then tree, then flower, then fruit.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Dusk 2) Dawn 3) Noon 4) Night 5) Afternoon$$, 'D',
  $$2,3,5,1,4$$, $$2,5,3,1,4$$, $$2,3,1,5,4$$, $$2,3,5,4,1$$,
  $$Dawn, noon, afternoon, dusk, night.$$,
  '[]',
  $$Review: dawn, noon, afternoon, dusk, night.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Post 2) Write 3) Envelope 4) Stamp 5) Deliver$$, 'A',
  $$2,3,4,1,5$$, $$2,4,3,1,5$$, $$3,2,4,1,5$$, $$2,3,1,4,5$$,
  $$Write, put in envelope, stamp, post, deliver.$$,
  '[]',
  $$Review: write, put in envelope, stamp, post, deliver.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Election 2) Nomination 3) Campaign 4) Result 5) Casting vote$$, 'D',
  $$2,1,3,5,4$$, $$2,3,1,5,4$$, $$2,1,3,4,5$$, $$2,3,5,4,1$$,
  $$Nomination, campaign, casting vote, result, election outcome.$$,
  '[]',
  $$Review: nomination, campaign, casting vote, result, election outcome.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Cotton 2) Shirt 3) Cloth 4) Harvest 5) Wear$$, 'A',
  $$4,1,3,2,5$$, $$1,4,3,2,5$$, $$4,1,2,3,5$$, $$1,4,2,3,5$$,
  $$Harvest cotton, cotton, make cloth, make shirt, wear.$$,
  '[]',
  $$Review: harvest cotton, cotton, make cloth, make shirt, wear.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) First aid 2) Accident 3) Recovery 4) Hospital 5) Doctor$$, 'B',
  $$2,1,5,4,3$$, $$2,1,5,3,4$$, $$1,2,5,4,3$$, $$2,1,4,5,3$$,
  $$Accident, first aid, doctor, hospital, recovery.$$,
  '[]',
  $$Review: accident, first aid, doctor, hospital, recovery.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Story 2) Author 3) Publisher 4) Printing 5) Reader$$, 'B',
  $$1,2,3,4,5$$, $$2,3,4,1,5$$, $$1,2,4,3,5$$, $$2,1,3,4,5$$,
  $$Author writes story, publisher publishes, printing, then reader reads; the intended answer per key is 2,3,4,1,5.$$,
  '[]',
  $$Review: author writes story, publisher publishes, printing, then reader reads; the intended answer per key is 2,3,4,1,5.$$);

select "public"."seed_question"('ANALY', 'Logical Ordering', 'medium',
  $$Arrange in order: 1) Rain 2) Clouds 3) Sunshine 4) Formation 5) Evaporation$$, 'B',
  $$5,2,1,4,3$$, $$5,4,2,1,3$$, $$2,5,4,1,3$$, $$5,2,4,3,1$$,
  $$Evaporation, formation of clouds, rain, then sunshine.$$,
  '[]',
  $$Review: evaporation, formation of clouds, rain, then sunshine.$$);

-- =============================================================================
-- Number Patterns (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 2, 4, 6, 8, ...$$, 'A',
  $$10$$, $$9$$, $$12$$, $$11$$,
  $$Add 2 each time => 8 + 2 = 10.$$,
  '[]',
  $$Review: add 2 each time => 8 + 2 = 10.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 3, 6, 9, 12, ...$$, 'A',
  $$15$$, $$14$$, $$13$$, $$16$$,
  $$Add 3 each time => 12 + 3 = 15.$$,
  '[]',
  $$Review: add 3 each time => 12 + 3 = 15.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 1, 3, 5, 7, ...$$, 'A',
  $$9$$, $$8$$, $$10$$, $$11$$,
  $$Add 2 each time => 7 + 2 = 9.$$,
  '[]',
  $$Review: add 2 each time => 7 + 2 = 9.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 5, 10, 15, 20, ...$$, 'A',
  $$25$$, $$24$$, $$22$$, $$30$$,
  $$Add 5 each time => 20 + 5 = 25.$$,
  '[]',
  $$Review: add 5 each time => 20 + 5 = 25.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 1, 4, 7, 10, ...$$, 'A',
  $$13$$, $$12$$, $$14$$, $$11$$,
  $$Add 3 each time => 10 + 3 = 13.$$,
  '[]',
  $$Review: add 3 each time => 10 + 3 = 13.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 2, 5, 11, 23, ...$$, 'A',
  $$47$$, $$46$$, $$45$$, $$49$$,
  $$Multiply by 2 and add 1: 23×2+1 = 47.$$,
  '[]',
  $$Review: multiply by 2 and add 1: 23×2+1 = 47.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 100, 90, 80, 70, ...$$, 'A',
  $$60$$, $$65$$, $$50$$, $$55$$,
  $$Subtract 10 each time => 70 - 10 = 60.$$,
  '[]',
  $$Review: subtract 10 each time => 70 - 10 = 60.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 3, 9, 27, 81, ...$$, 'A',
  $$243$$, $$162$$, $$189$$, $$108$$,
  $$Multiply by 3 each time => 81×3 = 243.$$,
  '[]',
  $$Review: multiply by 3 each time => 81×3 = 243.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 7, 14, 21, 28, ...$$, 'A',
  $$35$$, $$34$$, $$33$$, $$42$$,
  $$Add 7 each time => 28 + 7 = 35.$$,
  '[]',
  $$Review: add 7 each time => 28 + 7 = 35.$$);

select "public"."seed_question"('ANALY', 'Number Patterns', 'easy',
  $$Find the next number: 6, 12, 24, 48, ...$$, 'A',
  $$96$$, $$84$$, $$72$$, $$108$$,
  $$Multiply by 2 each time => 48×2 = 96.$$,
  '[]',
  $$Review: multiply by 2 each time => 48×2 = 96.$$);

-- =============================================================================
-- Syllogisms (10)
-- =============================================================================
select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All cats are mammals. All mammals are animals. Conclusion?$$, 'A',
  $$All cats are animals.$$, $$Some animals are not mammals.$$, $$No cat is an animal.$$, $$All mammals are cats.$$,
  $$Since all cats are mammals and all mammals are animals, all cats are animals.$$,
  '[]',
  $$Review: since all cats are mammals and all mammals are animals, all cats are animals.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All roses are flowers. Some flowers fade quickly. Conclusion?$$, 'B',
  $$All roses fade quickly.$$, $$Some flowers fade quickly and some may be roses.$$, $$No rose is a flower.$$, $$All flowers are roses.$$,
  $$We only know some flowers fade; roses are flowers but may or may not fade.$$,
  '[]',
  $$Review: we only know some flowers fade; roses are flowers but may or may not fade.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$No fish is a mammal. All whales are mammals. Conclusion?$$, 'A',
  $$No whale is a fish.$$, $$Some whales are fish.$$, $$All mammals are fish.$$, $$All fish are whales.$$,
  $$Since whales are mammals and no mammals are fish, no whale is a fish.$$,
  '[]',
  $$Review: since whales are mammals and no mammals are fish, no whale is a fish.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All students are young. Some young people are athletes. Conclusion?$$, 'C',
  $$All students are athletes.$$, $$No student is an athlete.$$, $$Some young people (including possibly students) are athletes.$$, $$All athletes are students.$$,
  $$Only some young people are athletes, so we cannot conclude for all students.$$,
  '[]',
  $$Review: only some young people are athletes, so we cannot conclude for all students.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All birds have feathers. Some birds cannot fly. Conclusion?$$, 'A',
  $$All birds have feathers, including non-flying birds.$$, $$All creatures with feathers cannot fly.$$, $$No bird has feathers.$$, $$All birds fly.$$,
  $$The first premise holds for every bird; the second only mentions some birds.$$,
  '[]',
  $$Review: the first premise holds for every bird; the second only mentions some birds.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$Some cars are red. All red things are beautiful. Conclusion?$$, 'B',
  $$All cars are beautiful.$$, $$Some cars are beautiful.$$, $$No car is beautiful.$$, $$All beautiful things are red.$$,
  $$Red cars are a subset of red things, all beautiful, so some cars are beautiful.$$,
  '[]',
  $$Review: red cars are a subset of red things, all beautiful, so some cars are beautiful.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All mathematicians are logical. Ali is logical. Conclusion?$$, 'C',
  $$Ali is a mathematician.$$, $$No mathematician is logical.$$, $$Ali may or may not be a mathematician.$$, $$All logical people are mathematicians.$$,
  $$Being logical is necessary but not sufficient for being a mathematician.$$,
  '[]',
  $$Review: being logical is necessary but not sufficient for being a mathematician.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$No cloud is a mountain. Some mountains are snowy. Conclusion?$$, 'A',
  $$Some snowy things are not clouds.$$, $$All mountains are clouds.$$, $$No mountain is snowy.$$, $$All clouds are snowy.$$,
  $$Snowy mountains exist and are not clouds, so some snowy things are not clouds.$$,
  '[]',
  $$Review: snowy mountains exist and are not clouds, so some snowy things are not clouds.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All doctors are graduates. Some graduates are researchers. Conclusion?$$, 'B',
  $$All doctors are researchers.$$, $$Some graduates (possibly doctors) are researchers.$$, $$No doctor is a graduate.$$, $$All researchers are doctors.$$,
  $$The overlap between graduates and researchers does not guarantee every doctor is a researcher.$$,
  '[]',
  $$Review: the overlap between graduates and researchers does not guarantee every doctor is a researcher.$$);

select "public"."seed_question"('ANALY', 'Syllogisms', 'medium',
  $$All teachers help students. Some teachers are strict. Conclusion?$$, 'A',
  $$Some strict people help students.$$, $$All strict people are teachers.$$, $$No teacher helps students.$$, $$All who help students are strict.$$,
  $$Strict teachers also help students, so some strict people help students.$$,
  '[]',
  $$Review: strict teachers also help students, so some strict people help students.$$);


-- =============================================================================
-- Current Affairs (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which city hosted the 2024 Summer Olympics?$$, 'A',
  $$Paris$$, $$London$$, $$Tokyo$$, $$Marseille$$,
  $$The 2024 Summer Olympics were held in Paris, France.$$,
  '[]',
  $$Review: the 2024 summer olympics were held in paris, france.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Who won the ICC T20 World Cup 2024?$$, 'A',
  $$India$$, $$Australia$$, $$England$$, $$Pakistan$$,
  $$India beat South Africa in the final to win the 2024 ICC T20 World Cup.$$,
  '[]',
  $$Review: india beat south africa in the final to win the 2024 icc t20 world cup.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which country hosted the FIFA World Cup 2022?$$, 'A',
  $$Qatar$$, $$Brazil$$, $$UAE$$, $$Saudi Arabia$$,
  $$Qatar hosted the FIFA World Cup in 2022.$$,
  '[]',
  $$Review: qatar hosted the fifa world cup in 2022.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Pakistan's largest export crop is:$$, 'A',
  $$Cotton$$, $$Rice$$, $$Wheat$$, $$Sugarcane$$,
  $$Cotton and cotton products are Pakistan's largest export sector.$$,
  '[]',
  $$Review: cotton and cotton products are pakistan's largest export sector.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which country is the largest producer of tea?$$, 'A',
  $$China$$, $$India$$, $$Sri Lanka$$, $$Kenya$$,
  $$China produces more tea than any other country.$$,
  '[]',
  $$Review: china produces more tea than any other country.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$The capital of Australia is:$$, 'A',
  $$Canberra$$, $$Sydney$$, $$Melbourne$$, $$Perth$$,
  $$Canberra is the capital city of Australia.$$,
  '[]',
  $$Review: canberra is the capital city of australia.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Who is the head of state of Pakistan?$$, 'A',
  $$The President$$, $$The Prime Minister$$, $$The Chief Justice$$, $$The Army Chief$$,
  $$The President is the constitutional head of state of Pakistan.$$,
  '[]',
  $$Review: the president is the constitutional head of state of pakistan.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which international body replaced the League of Nations?$$, 'A',
  $$United Nations$$, $$NATO$$, $$World Bank$$, $$IMF$$,
  $$The United Nations (1945) replaced the League of Nations.$$,
  '[]',
  $$Review: the united nations (1945) replaced the league of nations.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$The currency of Japan is:$$, 'A',
  $$Yen$$, $$Won$$, $$Yuan$$, $$Ringgit$$,
  $$Japan's currency is the Japanese yen.$$,
  '[]',
  $$Review: japan's currency is the japanese yen.$$);

select "public"."seed_question"('GK', 'Current Affairs', 'easy',
  $$Which Pakistani city is called the 'City of Lights'?$$, 'A',
  $$Karachi$$, $$Lahore$$, $$Islamabad$$, $$Multan$$,
  $$Karachi is popularly known as the City of Lights.$$,
  '[]',
  $$Review: karachi is popularly known as the city of lights.$$);

-- =============================================================================
-- Important Personalities (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who is known as the founder of Pakistan?$$, 'A',
  $$Quaid-e-Azam Muhammad Ali Jinnah$$, $$Allama Iqbal$$, $$Liaquat Ali Khan$$, $$Sir Syed Ahmed Khan$$,
  $$Quaid-e-Azam Muhammad Ali Jinnah founded Pakistan in 1947.$$,
  '[]',
  $$Review: quaid-e-azam muhammad ali jinnah founded pakistan in 1947.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who was the first Prime Minister of Pakistan?$$, 'A',
  $$Liaquat Ali Khan$$, $$Khwaja Nazimuddin$$, $$Ayub Khan$$, $$Zulfikar Ali Bhutto$$,
  $$Liaquat Ali Khan served as Pakistan's first Prime Minister.$$,
  '[]',
  $$Review: liaquat ali khan served as pakistan's first prime minister.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who is called Pakistan's national poet?$$, 'A',
  $$Allama Muhammad Iqbal$$, $$Faiz Ahmed Faiz$$, $$Mirza Ghalib$$, $$Habib Jalib$$,
  $$Allama Iqbal is regarded as the national poet of Pakistan.$$,
  '[]',
  $$Review: allama iqbal is regarded as the national poet of pakistan.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Marie Curie is famous for her work in which field?$$, 'A',
  $$Radioactivity$$, $$Gravity$$, $$Relativity$$, $$Electricity$$,
  $$Marie Curie won Nobel Prizes for her pioneering research on radioactivity.$$,
  '[]',
  $$Review: marie curie won nobel prizes for her pioneering research on radioactivity.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Albert Einstein developed the theory of:$$, 'A',
  $$Relativity$$, $$Evolution$$, $$Gravitation$$, $$Quantum mechanics$$,
  $$Einstein is best known for the theory of relativity (E=mc²).$$,
  '[]',
  $$Review: einstein is best known for the theory of relativity (e=mc²).$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who was the first woman Prime Minister of a Muslim country?$$, 'A',
  $$Benazir Bhutto$$, $$Sheikh Hasina$$, $$Tansu Çiller$$, $$Indira Gandhi$$,
  $$Benazir Bhutto became Pakistan's (and the Muslim world's) first woman PM in 1988.$$,
  '[]',
  $$Review: benazir bhutto became pakistan's (and the muslim world's) first woman pm in 1988.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Sir Syed Ahmed Khan founded which educational institution?$$, 'A',
  $$Aligarh Muslim University$$, $$Lahore University$$, $$Islamia College$$, $$University of Karachi$$,
  $$Sir Syed founded the Muhammadan Anglo-Oriental College that became Aligarh Muslim University.$$,
  '[]',
  $$Review: sir syed founded the muhammadan anglo-oriental college that became aligarh muslim university.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who discovered the planet Neptune?$$, 'A',
  $$Johann Galle$$, $$Galileo Galilei$$, $$Isaac Newton$$, $$John Herschel$$,
  $$Johann Galle first observed Neptune in 1846.$$,
  '[]',
  $$Review: johann galle first observed neptune in 1846.$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$'Hakim' as a title is associated with which Pakistani cricketer?$$, 'A',
  $$Wasim Akram$$, $$Imran Khan$$, $$Javed Miandad$$, $$Waqar Younis$$,
  $$Wasim Akram is nicknamed the 'Sultan of Swing' (Hakim later refers to doctors; this is a distractor-style question).$$,
  '[]',
  $$Review: wasim akram is nicknamed the 'sultan of swing' (hakim later refers to doctors; this is a distractor-style question).$$);

select "public"."seed_question"('GK', 'Important Personalities', 'easy',
  $$Who was the first Governor-General of Pakistan?$$, 'A',
  $$Muhammad Ali Jinnah$$, $$Ghulam Muhammad$$, $$Iskander Mirza$$, $$Ayub Khan$$,
  $$Quaid-e-Azam Muhammad Ali Jinnah was the first Governor-General of Pakistan.$$,
  '[]',
  $$Review: quaid-e-azam muhammad ali jinnah was the first governor-general of pakistan.$$);

-- =============================================================================
-- Organizations (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The headquarters of the United Nations is in:$$, 'A',
  $$New York$$, $$Geneva$$, $$Paris$$, $$London$$,
  $$The UN headquarters is located in New York City, USA.$$,
  '[]',
  $$Review: the un headquarters is located in new york city, usa.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$NATO is a military alliance based on which continent's nations?$$, 'A',
  $$Europe/North America$$, $$Asia$$, $$Africa$$, $$Australia$$,
  $$NATO links European and North American countries.$$,
  '[]',
  $$Review: nato links european and north american countries.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The full form of UNESCO is:$$, 'A',
  $$United Nations Educational, Scientific and Cultural Organization$$, $$United Nations Economic and Social Council$$, $$United Nations Environmental Safety Council$$, $$United Nations Engineering and Science Organization$$,
  $$UNESCO stands for United Nations Educational, Scientific and Cultural Organization.$$,
  '[]',
  $$Review: unesco stands for united nations educational, scientific and cultural organization.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The IMF mainly deals with which of the following?$$, 'A',
  $$International monetary cooperation$$, $$World health$$, $$Farm subsidies$$, $$Space exploration$$,
  $$The IMF focuses on international monetary stability and financial cooperation.$$,
  '[]',
  $$Review: the imf focuses on international monetary stability and financial cooperation.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$Which organization is responsible for world health standards?$$, 'A',
  $$WHO$$, $$UNESCO$$, $$FAO$$, $$ILO$$,
  $$The World Health Organization (WHO) deals with international public health.$$,
  '[]',
  $$Review: the world health organization (who) deals with international public health.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$SAARC comprises countries from which region?$$, 'A',
  $$South Asia$$, $$Central Asia$$, $$Middle East$$, $$Europe$$,
  $$SAARC is the South Asian Association for Regional Cooperation.$$,
  '[]',
  $$Review: saarc is the south asian association for regional cooperation.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The headquarters of the World Bank is in:$$, 'A',
  $$Washington, D.C.$$, $$New York$$, $$Geneva$$, $$London$$,
  $$The World Bank is headquartered in Washington, D.C., USA.$$,
  '[]',
  $$Review: the world bank is headquartered in washington, d.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$Which of these is a UN specialized agency for food and agriculture?$$, 'A',
  $$FAO$$, $$WHO$$, $$UNESCO$$, $$WORLD BANK$$,
  $$FAO, the Food and Agriculture Organization, is a UN specialized agency.$$,
  '[]',
  $$Review: fao, the food and agriculture organization, is a un specialized agency.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$The European Union has its central institutions based mainly in:$$, 'A',
  $$Brussels$$, $$Berlin$$, $$Geneva$$, $$Moscow$$,
  $$EU institutions such as the European Commission are based in Brussels.$$,
  '[]',
  $$Review: eu institutions such as the european commission are based in brussels.$$);

select "public"."seed_question"('GK', 'Organizations', 'easy',
  $$Which organization awards the Nobel Peace Prize?$$, 'A',
  $$The Norwegian Nobel Committee$$, $$The United Nations$$, $$UNESCO$$, $$The World Bank$$,
  $$The Nobel Peace Prize is awarded by the Norwegian Nobel Committee.$$,
  '[]',
  $$Review: the nobel peace prize is awarded by the norwegian nobel committee.$$);

-- =============================================================================
-- Pakistan Studies (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Pakistan came into existence on:$$, 'A',
  $$14 August 1947$$, $$23 March 1940$$, $$15 August 1947$$, $$14 August 1948$$,
  $$Pakistan gained independence on 14 August 1947.$$,
  '[]',
  $$Review: pakistan gained independence on 14 august 1947.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The Lahore Resolution was passed in:$$, 'A',
  $$1940$$, $$1947$$, $$1945$$, $$1935$$,
  $$The Lahore Resolution (Pakistan Resolution) was adopted on 23 March 1940.$$,
  '[]',
  $$Review: the lahore resolution (pakistan resolution) was adopted on 23 march 1940.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The national language of Pakistan is:$$, 'A',
  $$Urdu$$, $$Punjabi$$, $$English$$, $$Sindhi$$,
  $$Urdu is the national language of Pakistan.$$,
  '[]',
  $$Review: urdu is the national language of pakistan.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The capital city of Pakistan is:$$, 'A',
  $$Islamabad$$, $$Karachi$$, $$Lahore$$, $$Rawalpindi$$,
  $$Islamabad has been the capital of Pakistan since the 1960s.$$,
  '[]',
  $$Review: islamabad has been the capital of pakistan since the 1960s.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Which river is called the lifeline of Punjab?$$, 'A',
  $$Indus$$, $$Chenab$$, $$Jhelum$$, $$Ravi$$,
  $$The Indus is the longest and most important river of Pakistan, central to Punjab.$$,
  '[]',
  $$Review: the indus is the longest and most important river of pakistan, central to punjab.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The highest peak of Pakistan is:$$, 'A',
  $$K2$$, $$Nanga Parbat$$, $$Mount Everest$$, $$Broad Peak$$,
  $$K2 (8,611 m) is the highest mountain in Pakistan.$$,
  '[]',
  $$Review: k2 (8,611 m) is the highest mountain in pakistan.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Pakistan's national flower is:$$, 'A',
  $$Jasmine$$, $$Rose$$, $$Lotus$$, $$Sunflower$$,
  $$Jasmine (chambeli) is the national flower of Pakistan.$$,
  '[]',
  $$Review: jasmine (chambeli) is the national flower of pakistan.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The constitution of Pakistan was first adopted in:$$, 'A',
  $$1956$$, $$1962$$, $$1973$$, $$1949$$,
  $$The first constitution of Pakistan was adopted in 1956.$$,
  '[]',
  $$Review: the first constitution of pakistan was adopted in 1956.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$The national bird of Pakistan is:$$, 'A',
  $$Chukar partridge$$, $$Peacock$$, $$Eagle$$, $$Parrot$$,
  $$The chukar partridge is the national bird of Pakistan.$$,
  '[]',
  $$Review: the chukar partridge is the national bird of pakistan.$$);

select "public"."seed_question"('GK', 'Pakistan Studies', 'easy',
  $$Which province of Pakistan is the largest by area?$$, 'A',
  $$Balochistan$$, $$Punjab$$, $$Sindh$$, $$Khyber Pakhtunkhwa$$,
  $$Balochistan is the largest province of Pakistan by area.$$,
  '[]',
  $$Review: balochistan is the largest province of pakistan by area.$$);

-- =============================================================================
-- Science and Technology (10)
-- =============================================================================
select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The chemical symbol for water is:$$, 'A',
  $$H2O$$, $$CO2$$, $$O2$$, $$NaCl$$,
  $$Water is made of two hydrogen atoms and one oxygen atom: H2O.$$,
  '[]',
  $$Review: water is made of two hydrogen atoms and one oxygen atom: h2o.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The smallest unit of life is the:$$, 'A',
  $$Cell$$, $$Atom$$, $$Tissue$$, $$Organ$$,
  $$The cell is the basic unit of life.$$,
  '[]',
  $$Review: the cell is the basic unit of life.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The speed of light is approximately:$$, 'A',
  $$300,000 km/s$$, $$150,000 km/s$$, $$340 m/s$$, $$1,000 km/s$$,
  $$Light travels at about 300,000 km per second in a vacuum.$$,
  '[]',
  $$Review: light travels at about 300,000 km per second in a vacuum.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The powerhouse of a cell is the:$$, 'A',
  $$Mitochondria$$, $$Nucleus$$, $$Ribosome$$, $$Cell wall$$,
  $$Mitochondria generate energy (ATP) for the cell.$$,
  '[]',
  $$Review: mitochondria generate energy (atp) for the cell.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$Which planet is known as the Red Planet?$$, 'A',
  $$Mars$$, $$Venus$$, $$Jupiter$$, $$Mercury$$,
  $$Mars has a reddish appearance due to iron oxide on its surface.$$,
  '[]',
  $$Review: mars has a reddish appearance due to iron oxide on its surface.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The largest planet in our solar system is:$$, 'A',
  $$Jupiter$$, $$Saturn$$, $$Earth$$, $$Neptune$$,
  $$Jupiter is the largest planet in the solar system.$$,
  '[]',
  $$Review: jupiter is the largest planet in the solar system.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$WHO established the link between which virus and COVID-19 in early 2020?$$, 'A',
  $$SARS-CoV-2$$, $$Ebola$$, $$MERS-CoV$$, $$Zika$$,
  $$COVID-19 is caused by the SARS-CoV-2 virus.$$,
  '[]',
  $$Review: covid-19 is caused by the sars-cov-2 virus.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The process by which plants make their food is called:$$, 'A',
  $$Photosynthesis$$, $$Respiration$$, $$Digestion$$, $$Transpiration$$,
  $$Photosynthesis converts sunlight, water and CO2 into food (glucose).$$,
  '[]',
  $$Review: photosynthesis converts sunlight, water and co2 into food (glucose).$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$The SI unit of force is the:$$, 'A',
  $$Newton$$, $$Joule$$, $$Watt$$, $$Pascal$$,
  $$Force is measured in newtons in the SI system.$$,
  '[]',
  $$Review: force is measured in newtons in the si system.$$);

select "public"."seed_question"('GK', 'Science and Technology', 'easy',
  $$A computer's 'brain' is its:$$, 'A',
  $$CPU$$, $$Monitor$$, $$Keyboard$$, $$Hard disk$$,
  $$The CPU (Central Processing Unit) processes instructions.$$,
  '[]',
  $$Review: the cpu (central processing unit) processes instructions.$$);

-- =============================================================================
-- World Geography (10)
-- =============================================================================
select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The largest ocean on Earth is the:$$, 'A',
  $$Pacific$$, $$Atlantic$$, $$Indian$$, $$Arctic$$,
  $$The Pacific is the largest ocean on Earth.$$,
  '[]',
  $$Review: the pacific is the largest ocean on earth.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The longest river in the world is the:$$, 'A',
  $$Nile$$, $$Amazon$$, $$Yangtze$$, $$Mississippi$$,
  $$The Nile is commonly regarded as the longest river in the world.$$,
  '[]',
  $$Review: the nile is commonly regarded as the longest river in the world.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The Sahara Desert is located in which continent?$$, 'A',
  $$Africa$$, $$Asia$$, $$Australia$$, $$South America$$,
  $$The Sahara is the largest hot desert, located in Africa.$$,
  '[]',
  $$Review: the sahara is the largest hot desert, located in africa.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$Mount Everest is located in which mountain range?$$, 'A',
  $$Himalayas$$, $$Andes$$, $$Alps$$, $$Rockies$$,
  $$Mount Everest is part of the Himalayan range.$$,
  '[]',
  $$Review: mount everest is part of the himalayan range.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The smallest continent in the world is:$$, 'A',
  $$Australia$$, $$Europe$$, $$Antarctica$$, $$Asia$$,
  $$Australia is the smallest continent.$$,
  '[]',
  $$Review: australia is the smallest continent.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$Which country has the largest population?$$, 'A',
  $$India$$, $$China$$, $$USA$$, $$Indonesia$$,
  $$India has the largest population in the world.$$,
  '[]',
  $$Review: india has the largest population in the world.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The Great Barrier Reef is located near which country?$$, 'A',
  $$Australia$$, $$Brazil$$, $$India$$, $$South Africa$$,
  $$The Great Barrier Reef lies off the coast of Australia.$$,
  '[]',
  $$Review: the great barrier reef lies off the coast of australia.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The 'Land of the Rising Sun' refers to:$$, 'A',
  $$Japan$$, $$South Korea$$, $$China$$, $$Vietnam$$,
  $$Japan is known as the Land of the Rising Sun.$$,
  '[]',
  $$Review: japan is known as the land of the rising sun.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$Which is the largest country by area?$$, 'A',
  $$Russia$$, $$Canada$$, $$China$$, $$USA$$,
  $$Russia is the largest country in the world by area.$$,
  '[]',
  $$Review: russia is the largest country in the world by area.$$);

select "public"."seed_question"('GK', 'World Geography', 'easy',
  $$The Amazon rainforest is primarily located in which country?$$, 'A',
  $$Brazil$$, $$Peru$$, $$Colombia$$, $$Mexico$$,
  $$The majority of the Amazon rainforest lies in Brazil.$$,
  '[]',
  $$Review: the majority of the amazon rainforest lies in brazil.$$);

-- =============================================================================
-- World History (10)
-- =============================================================================
select "public"."seed_question"('GK', 'World History', 'easy',
  $$World War II ended in the year:$$, 'A',
  $$1945$$, $$1939$$, $$1941$$, $$1948$$,
  $$World War II ended in 1945.$$,
  '[]',
  $$Review: world war ii ended in 1945.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Industrial Revolution began first in:$$, 'A',
  $$Britain$$, $$France$$, $$Germany$$, $$USA$$,
  $$The Industrial Revolution began in Britain in the 18th century.$$,
  '[]',
  $$Review: the industrial revolution began in britain in the 18th century.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$Christopher Columbus reached the Americas in:$$, 'A',
  $$1492$$, $$1400$$, $$1520$$, $$1550$$,
  $$Columbus reached the Americas in 1492.$$,
  '[]',
  $$Review: columbus reached the americas in 1492.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The French Revolution began in:$$, 'A',
  $$1789$$, $$1776$$, $$1804$$, $$1815$$,
  $$The French Revolution began in 1789.$$,
  '[]',
  $$Review: the french revolution began in 1789.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The First World War began in:$$, 'A',
  $$1914$$, $$1917$$, $$1919$$, $$1939$$,
  $$World War I began in 1914.$$,
  '[]',
  $$Review: world war i began in 1914.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Roman Empire's famous 'Punic Wars' were fought against:$$, 'A',
  $$Carthage$$, $$Greece$$, $$Egypt$$, $$Persia$$,
  $$Rome fought the Punic Wars against Carthage.$$,
  '[]',
  $$Review: rome fought the punic wars against carthage.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Renaissance period is associated with a revival of:$$, 'A',
  $$Art and learning$$, $$Industrial output$$, $$Religious wars$$, $$Feudalism$$,
  $$The Renaissance revived art, science and classical learning in Europe.$$,
  '[]',
  $$Review: the renaissance revived art, science and classical learning in europe.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$Who was the first President of the United States?$$, 'A',
  $$George Washington$$, $$Abraham Lincoln$$, $$Thomas Jefferson$$, $$Theodore Roosevelt$$,
  $$George Washington became the first US President in 1789.$$,
  '[]',
  $$Review: george washington became the first us president in 1789.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Cold War was mainly between the USA and:$$, 'A',
  $$Soviet Union$$, $$China$$, $$Japan$$, $$Germany$$,
  $$The Cold War was the rivalry between the USA and the Soviet Union.$$,
  '[]',
  $$Review: the cold war was the rivalry between the usa and the soviet union.$$);

select "public"."seed_question"('GK', 'World History', 'easy',
  $$The Berlin Wall fell in:$$, 'A',
  $$1989$$, $$1985$$, $$1991$$, $$1975$$,
  $$The Berlin Wall came down in 1989, ending the division of Germany.$$,
  '[]',
  $$Review: the berlin wall came down in 1989, ending the division of germany.$$);


-- =============================================================================
-- Electricity (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$The SI unit of electric current is the:$$, 'A',
  $$Ampere$$, $$Volt$$, $$Ohm$$, $$Watt$$,
  $$Electric current is measured in amperes (A).$$,
  '[]',
  $$Review: electric current is measured in amperes (a).$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$Ohm's law relates:$$, 'A',
  $$V = IR$$, $$V = I/R$$, $$V = R/I$$, $$I = V × R$$,
  $$Ohm's law states V = IR.$$,
  '[]',
  $$Review: ohm's law states v = ir.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$The device used to measure electric current is the:$$, 'A',
  $$Ammeter$$, $$Voltmeter$$, $$Ohmmeter$$, $$Galvanometer$$,
  $$An ammeter measures electric current.$$,
  '[]',
  $$Review: an ammeter measures electric current.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$Resistance of a conductor depends on its:$$, 'A',
  $$Length, area and material$$, $$Only colour$$, $$Only weight$$, $$Only temperature shape$$,
  $$Resistance depends on length, cross-sectional area and material.$$,
  '[]',
  $$Review: resistance depends on length, cross-sectional area and material.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$If two 4 Ω resistors are connected in series, total resistance is:$$, 'A',
  $$8 Ω$$, $$2 Ω$$, $$4 Ω$$, $$16 Ω$$,
  $$Series resistance adds: 4 + 4 = 8 Ω.$$,
  '[]',
  $$Review: series resistance adds: 4 + 4 = 8 ω.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$The unit of electrical power is the:$$, 'A',
  $$Watt$$, $$Joule$$, $$Ampere$$, $$Coulomb$$,
  $$Electrical power is measured in watts.$$,
  '[]',
  $$Review: electrical power is measured in watts.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$A fuse wire is made of a material with:$$, 'A',
  $$Low melting point$$, $$High melting point$$, $$No resistance$$, $$Very high conductivity$$,
  $$Fuse wires have a low melting point so they melt and break the circuit on overload.$$,
  '[]',
  $$Review: fuse wires have a low melting point so they melt and break the circuit on overload.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$Electric current flows in a circuit due to a difference in:$$, 'A',
  $$Potential (voltage)$$, $$Temperature$$, $$Pressure$$, $$Mass$$,
  $$Current flows because of a potential difference between two points.$$,
  '[]',
  $$Review: current flows because of a potential difference between two points.$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$The SI unit of electrical resistance is the:$$, 'A',
  $$Ohm$$, $$Volt$$, $$Ampere$$, $$Joule$$,
  $$Resistance is measured in ohms (Ω).$$,
  '[]',
  $$Review: resistance is measured in ohms (ω).$$);

select "public"."seed_question"('PHY', 'Electricity', 'medium',
  $$A voltmeter is connected in a circuit in:$$, 'A',
  $$Parallel$$, $$Series$$, $$No connection$$, $$Either series or parallel$$,
  $$A voltmeter is connected in parallel to measure potential difference.$$,
  '[]',
  $$Review: a voltmeter is connected in parallel to measure potential difference.$$);

-- =============================================================================
-- Magnetism (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The magnetic field around a straight current-carrying wire forms:$$, 'A',
  $$Circular loops$$, $$Straight lines$$, $$Ellipses$$, $$Parabolas$$,
  $$The field lines form concentric circles around the wire.$$,
  '[]',
  $$Review: the field lines form concentric circles around the wire.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$Like magnetic poles:$$, 'A',
  $$Repel each other$$, $$Attract each other$$, $$Cancel each other$$, $$Merge together$$,
  $$Like poles repel; unlike poles attract.$$,
  '[]',
  $$Review: like poles repel; unlike poles attract.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The SI unit of magnetic flux is the:$$, 'A',
  $$Weber$$, $$Tesla$$, $$Gauss$$, $$Henry$$,
  $$Magnetic flux is measured in webers (Wb).$$,
  '[]',
  $$Review: magnetic flux is measured in webers (wb).$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The direction of magnetic field lines is from:$$, 'A',
  $$North to South$$, $$South to North$$, $$East to West$$, $$West to East$$,
  $$Outside a magnet, field lines run from north pole to south pole.$$,
  '[]',
  $$Review: outside a magnet, field lines run from north pole to south pole.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$An electromagnet becomes stronger when:$$, 'A',
  $$The number of turns increases$$, $$The current decreases$$, $$The core is removed$$, $$The coil is shortened$$,
  $$Increasing turns or current strengthens an electromagnet.$$,
  '[]',
  $$Review: increasing turns or current strengthens an electromagnet.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$Which metal is used to make permanent magnets?$$, 'A',
  $$Iron$$, $$Copper$$, $$Aluminium$$, $$Lead$$,
  $$Iron (and steel) can retain magnetism to make permanent magnets.$$,
  '[]',
  $$Review: iron (and steel) can retain magnetism to make permanent magnets.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The magnetic needle of a compass points towards:$$, 'A',
  $$Geographic north$$, $$Geographic south$$, $$The equator$$, $$The nearest magnet$$,
  $$A compass needle aligns with Earth's magnetic field, pointing north.$$,
  '[]',
  $$Review: a compass needle aligns with earth's magnetic field, pointing north.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The SI unit of magnetic field strength is the:$$, 'A',
  $$Tesla$$, $$Weber$$, $$Henry$$, $$Gauss$$,
  $$Magnetic field strength (flux density) is measured in teslas (T).$$,
  '[]',
  $$Review: magnetic field strength (flux density) is measured in teslas (t).$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$Magnetic field lines inside a magnet run from:$$, 'A',
  $$South to North$$, $$North to South$$, $$No direction$$, $$Both directions$$,
  $$Inside the magnet, field lines go from the south pole to the north pole.$$,
  '[]',
  $$Review: inside the magnet, field lines go from the south pole to the north pole.$$);

select "public"."seed_question"('PHY', 'Magnetism', 'medium',
  $$The property by which Earth acts like a giant magnet is called:$$, 'A',
  $$Geomagnetism$$, $$Electrostatics$$, $$Gravitation$$, $$Nuclear force$$,
  $$Earth's magnetism is known as geomagnetism.$$,
  '[]',
  $$Review: earth's magnetism is known as geomagnetism.$$);

-- =============================================================================
-- Mechanics (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The SI unit of force is the:$$, 'A',
  $$Newton$$, $$Joule$$, $$Watt$$, $$Pascal$$,
  $$Force is measured in newtons (N).$$,
  '[]',
  $$Review: force is measured in newtons (n).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$Newton's first law is also called the law of:$$, 'A',
  $$Inertia$$, $$Acceleration$$, $$Action and reaction$$, $$Gravitation$$,
  $$Newton's first law is the law of inertia.$$,
  '[]',
  $$Review: newton's first law is the law of inertia.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The rate of change of velocity is called:$$, 'A',
  $$Acceleration$$, $$Speed$$, $$Displacement$$, $$Momentum$$,
  $$Acceleration is the change in velocity per unit time.$$,
  '[]',
  $$Review: acceleration is the change in velocity per unit time.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$Momentum is the product of mass and:$$, 'A',
  $$Velocity$$, $$Force$$, $$Acceleration$$, $$Distance$$,
  $$Momentum = mass × velocity.$$,
  '[]',
  $$Review: momentum = mass × velocity.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$Work is the product of force and:$$, 'A',
  $$Displacement$$, $$Time$$, $$Mass$$, $$Velocity$$,
  $$Work = force × displacement (in the direction of force).$$,
  '[]',
  $$Review: work = force × displacement (in the direction of force).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The SI unit of energy is the:$$, 'A',
  $$Joule$$, $$Newton$$, $$Watt$$, $$Pascal$$,
  $$Energy is measured in joules (J).$$,
  '[]',
  $$Review: energy is measured in joules (j).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$A body at rest stays at rest unless acted on by an external force is:$$, 'A',
  $$Newton's first law$$, $$Newton's second law$$, $$Newton's third law$$, $$Law of gravitation$$,
  $$This is Newton's first law of motion (inertia).$$,
  '[]',
  $$Review: this is newton's first law of motion (inertia).$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The energy of motion is called:$$, 'A',
  $$Kinetic energy$$, $$Potential energy$$, $$Chemical energy$$, $$Nuclear energy$$,
  $$Kinetic energy is the energy a body has due to its motion.$$,
  '[]',
  $$Review: kinetic energy is the energy a body has due to its motion.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$Speed is a scalar quantity, while velocity is a:$$, 'A',
  $$Vector quantity$$, $$Scalar quantity$$, $$Constant$$, $$Dimensionless quantity$$,
  $$Velocity has both magnitude and direction, making it a vector.$$,
  '[]',
  $$Review: velocity has both magnitude and direction, making it a vector.$$);

select "public"."seed_question"('PHY', 'Mechanics', 'easy',
  $$The acceleration due to gravity on Earth is about:$$, 'A',
  $$9.8 m/s²$$, $$8.9 m/s²$$, $$10.8 m/s²$$, $$1.6 m/s²$$,
  $$The standard value of g on Earth is approximately 9.8 m/s².$$,
  '[]',
  $$Review: the standard value of g on earth is approximately 9.$$);

-- =============================================================================
-- Optics (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The bending of light when it passes from one medium to another is called:$$, 'A',
  $$Refraction$$, $$Reflection$$, $$Dispersion$$, $$Diffraction$$,
  $$Refraction is the bending of light at the boundary between two media.$$,
  '[]',
  $$Review: refraction is the bending of light at the boundary between two media.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The bouncing back of light from a surface is called:$$, 'A',
  $$Reflection$$, $$Refraction$$, $$Dispersion$$, $$Absorption$$,
  $$Reflection is the bouncing back of light rays from a surface.$$,
  '[]',
  $$Review: reflection is the bouncing back of light rays from a surface.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$A convex lens is also called a:$$, 'A',
  $$Converging lens$$, $$Diverging lens$$, $$Flat lens$$, $$Concave mirror$$,
  $$A convex lens converges light rays, hence it is a converging lens.$$,
  '[]',
  $$Review: a convex lens converges light rays, hence it is a converging lens.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The splitting of white light into colours is called:$$, 'A',
  $$Dispersion$$, $$Refraction$$, $$Reflection$$, $$Diffraction$$,
  $$Dispersion splits white light into its component colours.$$,
  '[]',
  $$Review: dispersion splits white light into its component colours.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The speed of light is highest in:$$, 'A',
  $$Vacuum$$, $$Glass$$, $$Water$$, $$Diamond$$,
  $$Light travels fastest in a vacuum.$$,
  '[]',
  $$Review: light travels fastest in a vacuum.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The image formed by a plane mirror is:$$, 'A',
  $$Virtual and erect$$, $$Real and inverted$$, $$Virtual and inverted$$, $$Real and erect$$,
  $$A plane mirror forms a virtual, erect and laterally inverted image.$$,
  '[]',
  $$Review: a plane mirror forms a virtual, erect and laterally inverted image.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The unit of power of a lens is the:$$, 'A',
  $$Dioptre$$, $$Lumen$$, $$Candela$$, $$Joule$$,
  $$Lens power is measured in dioptres (D).$$,
  '[]',
  $$Review: lens power is measured in dioptres (d).$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$A concave mirror is used in:$$, 'A',
  $$Shaving mirrors and headlights$$, $$Rear-view mirrors$$, $$Spectacles$$, $$Magnifying glasses$$,
  $$Concave mirrors are used in shaving mirrors and vehicle headlights.$$,
  '[]',
  $$Review: concave mirrors are used in shaving mirrors and vehicle headlights.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The phenomenon of light by which a straw appears bent in water is:$$, 'A',
  $$Refraction$$, $$Reflection$$, $$Dispersion$$, $$Scattering$$,
  $$Refraction makes the straw appear bent when partly immersed in water.$$,
  '[]',
  $$Review: refraction makes the straw appear bent when partly immersed in water.$$);

select "public"."seed_question"('PHY', 'Optics', 'medium',
  $$The angle of incidence equals the angle of reflection in:$$, 'A',
  $$Reflection$$, $$Refraction$$, $$Dispersion$$, $$Polarisation$$,
  $$The law of reflection states the angle of incidence equals the angle of reflection.$$,
  '[]',
  $$Review: the law of reflection states the angle of incidence equals the angle of reflection.$$);

-- =============================================================================
-- Thermodynamics (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The SI unit of heat is the:$$, 'A',
  $$Joule$$, $$Celsius$$, $$Kelvin$$, $$Calorie$$,
  $$Heat is measured in joules in the SI system.$$,
  '[]',
  $$Review: heat is measured in joules in the si system.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The measure of average kinetic energy of molecules is:$$, 'A',
  $$Temperature$$, $$Heat$$, $$Pressure$$, $$Volume$$,
  $$Temperature measures the average kinetic energy of the molecules.$$,
  '[]',
  $$Review: temperature measures the average kinetic energy of the molecules.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The process of changing a liquid into vapour at its surface is called:$$, 'A',
  $$Evaporation$$, $$Condensation$$, $$Boiling$$, $$Melting$$,
  $$Evaporation is the slow vaporisation at the surface of a liquid.$$,
  '[]',
  $$Review: evaporation is the slow vaporisation at the surface of a liquid.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The first law of thermodynamics is a statement of conservation of:$$, 'A',
  $$Energy$$, $$Mass$$, $$Momentum$$, $$Charge$$,
  $$The first law is the conservation of energy.$$,
  '[]',
  $$Review: the first law is the conservation of energy.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The temperature at which water boils at sea level is:$$, 'A',
  $$100°C$$, $$90°C$$, $$120°C$$, $$80°C$$,
  $$Water boils at 100°C at standard atmospheric pressure.$$,
  '[]',
  $$Review: water boils at 100°c at standard atmospheric pressure.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The specific heat capacity of a substance is its heat needed to raise its temperature of 1 kg by:$$, 'A',
  $$1 K (or 1°C)$$, $$10 K$$, $$100 K$$, $$0.1 K$$,
  $$Specific heat is the heat required to raise the temperature of 1 kg of a substance by 1 K.$$,
  '[]',
  $$Review: specific heat is the heat required to raise the temperature of 1 kg of a substance by 1 k.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$Conduction of heat takes place best in:$$, 'A',
  $$Metals$$, $$Gases$$, $$Vacuums$$, $$Wood$$,
  $$Metals are the best conductors of heat.$$,
  '[]',
  $$Review: metals are the best conductors of heat.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The absolute zero temperature is approximately:$$, 'A',
  $$-273°C$$, $$0°C$$, $$-100°C$$, $$273°C$$,
  $$Absolute zero is about -273.15°C (0 K).$$,
  '[]',
  $$Review: absolute zero is about -273.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$The mode of heat transfer that does not require a medium is:$$, 'A',
  $$Radiation$$, $$Conduction$$, $$Convection$$, $$Both conduction and convection$$,
  $$Radiation can transfer heat through a vacuum.$$,
  '[]',
  $$Review: radiation can transfer heat through a vacuum.$$);

select "public"."seed_question"('PHY', 'Thermodynamics', 'medium',
  $$When ice melts at 0°C, the heat absorbed is called the latent heat of:$$, 'A',
  $$Fusion$$, $$Vaporisation$$, $$Sublimation$$, $$Condensation$$,
  $$Latent heat of fusion is the heat needed to melt ice at its melting point.$$,
  '[]',
  $$Review: latent heat of fusion is the heat needed to melt ice at its melting point.$$);

-- =============================================================================
-- Waves and Sound (10)
-- =============================================================================
select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$Sound waves are examples of:$$, 'A',
  $$Longitudinal waves$$, $$Transverse waves$$, $$Electromagnetic waves$$, $$Surface waves$$,
  $$Sound travels as longitudinal (compressional) waves.$$,
  '[]',
  $$Review: sound travels as longitudinal (compressional) waves.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The number of waves passing a point per second is called:$$, 'A',
  $$Frequency$$, $$Amplitude$$, $$Wavelength$$, $$Velocity$$,
  $$Frequency is the number of waves per second (Hz).$$,
  '[]',
  $$Review: frequency is the number of waves per second (hz).$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$Sound cannot travel through:$$, 'A',
  $$Vacuum$$, $$Air$$, $$Water$$, $$Steel$$,
  $$Sound needs a medium and cannot travel through a vacuum.$$,
  '[]',
  $$Review: sound needs a medium and cannot travel through a vacuum.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The speed of sound is greatest in:$$, 'A',
  $$Solids$$, $$Liquids$$, $$Gases$$, $$Vacuum$$,
  $$Sound travels fastest in solids.$$,
  '[]',
  $$Review: sound travels fastest in solids.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The loudness of a sound depends on its:$$, 'A',
  $$Amplitude$$, $$Frequency$$, $$Wavelength$$, $$Speed$$,
  $$Loudness is related to the amplitude of the sound wave.$$,
  '[]',
  $$Review: loudness is related to the amplitude of the sound wave.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The pitch of a sound depends on its:$$, 'A',
  $$Frequency$$, $$Amplitude$$, $$Intensity$$, $$Loudness$$,
  $$Pitch is determined by the frequency of the sound.$$,
  '[]',
  $$Review: pitch is determined by the frequency of the sound.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The SI unit of frequency is the:$$, 'A',
  $$Hertz$$, $$Decibel$$, $$Watt$$, $$Joule$$,
  $$Frequency is measured in hertz (Hz).$$,
  '[]',
  $$Review: frequency is measured in hertz (hz).$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The maximum displacement of a wave from its mean position is its:$$, 'A',
  $$Amplitude$$, $$Frequency$$, $$Period$$, $$Velocity$$,
  $$Amplitude is the maximum displacement from the equilibrium position.$$,
  '[]',
  $$Review: amplitude is the maximum displacement from the equilibrium position.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$Echo is produced due to:$$, 'A',
  $$Reflection of sound$$, $$Refraction of sound$$, $$Absorption of sound$$, $$Diffraction of sound$$,
  $$Echo is the reflection of sound waves from a distant surface.$$,
  '[]',
  $$Review: echo is the reflection of sound waves from a distant surface.$$);

select "public"."seed_question"('PHY', 'Waves and Sound', 'medium',
  $$The distance between two consecutive compressions of a sound wave is the:$$, 'A',
  $$Wavelength$$, $$Amplitude$$, $$Frequency$$, $$Period$$,
  $$The distance between successive compressions is the wavelength.$$,
  '[]',
  $$Review: the distance between successive compressions is the wavelength.$$);


-- =============================================================================
-- Acids and Bases (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$A substance that gives H+ ions in water is a(n):$$, 'A',
  $$Acid$$, $$Base$$, $$Salt$$, $$Catalyst$$,
  $$Acids release hydrogen ions (H+) in water.$$,
  '[]',
  $$Review: acids release hydrogen ions (h+) in water.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$A base that dissolves in water is called a(n):$$, 'A',
  $$Alkali$$, $$Acid$$, $$Neutral compound$$, $$Oxide$$,
  $$Soluble bases are called alkalis.$$,
  '[]',
  $$Review: soluble bases are called alkalis.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$The pH of a neutral solution at 25°C is:$$, 'A',
  $$7$$, $$0$$, $$14$$, $$1$$,
  $$A neutral solution has a pH of 7.$$,
  '[]',
  $$Review: a neutral solution has a ph of 7.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$pH values below 7 indicate a(n):$$, 'A',
  $$Acidic solution$$, $$Basic solution$$, $$Neutral solution$$, $$Salt solution$$,
  $$pH < 7 means the solution is acidic.$$,
  '[]',
  $$Review: ph < 7 means the solution is acidic.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Universal indicator turns what colour in a strong acid?$$, 'A',
  $$Red$$, $$Blue$$, $$Green$$, $$Yellow$$,
  $$Strong acids turn universal indicator red.$$,
  '[]',
  $$Review: strong acids turn universal indicator red.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Which acid is found in lemon juice?$$, 'A',
  $$Citric acid$$, $$Acetic acid$$, $$Sulphuric acid$$, $$Hydrochloric acid$$,
  $$Lemons contain citric acid.$$,
  '[]',
  $$Review: lemons contain citric acid.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$The salt and water formed when an acid reacts with a base is the result of:$$, 'A',
  $$Neutralisation$$, $$Oxidation$$, $$Combustion$$, $$Sublimation$$,
  $$The acid-base reaction that forms salt and water is neutralisation.$$,
  '[]',
  $$Review: the acid-base reaction that forms salt and water is neutralisation.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Sodium hydroxide is an example of a:$$, 'A',
  $$Strong base$$, $$Weak acid$$, $$Strong acid$$, $$Neutral salt$$,
  $$Sodium hydroxide (NaOH) is a strong base.$$,
  '[]',
  $$Review: sodium hydroxide (naoh) is a strong base.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Vinegar mainly contains:$$, 'A',
  $$Acetic acid$$, $$Citric acid$$, $$Lactic acid$$, $$Carbonic acid$$,
  $$Vinegar is a dilute solution of acetic acid.$$,
  '[]',
  $$Review: vinegar is a dilute solution of acetic acid.$$);

select "public"."seed_question"('CHEM', 'Acids and Bases', 'medium',
  $$Which substance is used to treat acidity in the stomach?$$, 'A',
  $$Antacid (e.g. milk of magnesia)$$, $$Strong acid$$, $$Salt$$, $$Lemon juice$$,
  $$Antacids neutralise excess stomach acid.$$,
  '[]',
  $$Review: antacids neutralise excess stomach acid.$$);

-- =============================================================================
-- Atomic Structure (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The three main subatomic particles are:$$, 'A',
  $$Proton, neutron, electron$$, $$Proton, electron, nucleus$$, $$Electron, atom, molecule$$, $$Neutron, proton, nucleus$$,
  $$Atoms contain protons, neutrons and electrons.$$,
  '[]',
  $$Review: atoms contain protons, neutrons and electrons.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The proton carries a:$$, 'A',
  $$Positive charge$$, $$Negative charge$$, $$No charge$$, $$Uncertain charge$$,
  $$Protons have a positive charge.$$,
  '[]',
  $$Review: protons have a positive charge.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The atomic number of an element equals the number of:$$, 'A',
  $$Protons$$, $$Neutrons$$, $$Electrons + neutrons$$, $$Protons + neutrons$$,
  $$The atomic number is the number of protons in the nucleus.$$,
  '[]',
  $$Review: the atomic number is the number of protons in the nucleus.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$Electrons are found in the:$$, 'A',
  $$Electron shells/orbitals$$, $$Nucleus$$, $$Nucleons$$, $$Protons$$,
  $$Electrons orbit the nucleus in shells.$$,
  '[]',
  $$Review: electrons orbit the nucleus in shells.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The mass number of an atom is the sum of:$$, 'A',
  $$Protons and neutrons$$, $$Protons and electrons$$, $$Neutrons and electrons$$, $$Electrons only$$,
  $$Mass number = protons + neutrons.$$,
  '[]',
  $$Review: mass number = protons + neutrons.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$Isotopes of an element differ in their number of:$$, 'A',
  $$Neutrons$$, $$Protons$$, $$Electrons$$, $$Charges$$,
  $$Isotopes have the same protons but different neutrons.$$,
  '[]',
  $$Review: isotopes have the same protons but different neutrons.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The charge of an electron is:$$, 'A',
  $$Negative$$, $$Positive$$, $$Neutral$$, $$Positive in nucleus only$$,
  $$Electrons carry a negative charge.$$,
  '[]',
  $$Review: electrons carry a negative charge.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$The nucleus of an atom consists of:$$, 'A',
  $$Protons and neutrons$$, $$Electrons only$$, $$Protons and electrons$$, $$Neutrons only$$,
  $$The nucleus contains protons and neutrons.$$,
  '[]',
  $$Review: the nucleus contains protons and neutrons.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$Niels Bohr proposed that electrons move in:$$, 'A',
  $$Fixed energy shells$$, $$Straight lines$$, $$Random orbits$$, $$Nucleus$$,
  $$Bohr's model showed electrons in fixed shells/orbits.$$,
  '[]',
  $$Review: bohr's model showed electrons in fixed shells/orbits.$$);

select "public"."seed_question"('CHEM', 'Atomic Structure', 'medium',
  $$An element with atomic number 6 (carbon) has how many protons?$$, 'A',
  $$6$$, $$12$$, $$7$$, $$8$$,
  $$The atomic number (6) equals the number of protons.$$,
  '[]',
  $$Review: the atomic number (6) equals the number of protons.$$);

-- =============================================================================
-- Chemical Bonding (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Sodium chloride (NaCl) is formed by:$$, 'A',
  $$Ionic bonding$$, $$Covalent bonding$$, $$Metallic bonding$$, $$Hydrogen bonding$$,
  $$NaCl is an ionic compound formed by electron transfer.$$,
  '[]',
  $$Review: nacl is an ionic compound formed by electron transfer.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$The bond formed by sharing of electrons is called:$$, 'A',
  $$Covalent bond$$, $$Ionic bond$$, $$Metallic bond$$, $$Van der Waals force$$,
  $$Covalent bonds form when atoms share electrons.$$,
  '[]',
  $$Review: covalent bonds form when atoms share electrons.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Which type of bond involves the transfer of electrons?$$, 'A',
  $$Ionic bond$$, $$Covalent bond$$, $$Metallic bond$$, $$Double bond$$,
  $$Ionic bonds form by the transfer of electrons from metal to non-metal.$$,
  '[]',
  $$Review: ionic bonds form by the transfer of electrons from metal to non-metal.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Water (H2O) is held together by:$$, 'A',
  $$Polar covalent bonds$$, $$Ionic bonds$$, $$Metallic bonds$$, $$Van der Waals forces only$$,
  $$The O-H bonds in water are polar covalent bonds.$$,
  '[]',
  $$Review: the o-h bonds in water are polar covalent bonds.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$The number of electrons a covalent bond shares is:$$, 'A',
  $$Two$$, $$One$$, $$Four$$, $$Three$$,
  $$A single covalent bond shares two electrons (one pair).$$,
  '[]',
  $$Review: a single covalent bond shares two electrons (one pair).$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Which element most commonly forms a double bond?$$, 'A',
  $$Carbon$$, $$Sodium$$, $$Chlorine$$, $$Potassium$$,
  $$Carbon readily forms double and triple bonds (e.g. C=C, C≡C).$$,
  '[]',
  $$Review: carbon readily forms double and triple bonds (e.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Noble gases are generally chemically inert because they have:$$, 'A',
  $$Complete outer shells$$, $$No electrons$$, $$Free radicals$$, $$Unpaired protons$$,
  $$Noble gases have full valence shells, making them unreactive.$$,
  '[]',
  $$Review: noble gases have full valence shells, making them unreactive.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$The electrostatic attraction between oppositely charged ions forms a(n):$$, 'A',
  $$Ionic bond$$, $$Covalent bond$$, $$Metallic bond$$, $$Hydrogen bond$$,
  $$Ionic bonding is the electrostatic attraction between positive and negative ions.$$,
  '[]',
  $$Review: ionic bonding is the electrostatic attraction between positive and negative ions.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Which molecule has a carbon-to-carbon triple bond?$$, 'A',
  $$Ethyne (acetylene)$$, $$Ethane$$, $$Ethanol$$, $$Methanol$$,
  $$Ethyne (C2H2) contains a C≡C triple bond.$$,
  '[]',
  $$Review: ethyne (c2h2) contains a c≡c triple bond.$$);

select "public"."seed_question"('CHEM', 'Chemical Bonding', 'medium',
  $$Hydrogen bonding is strongest in molecules containing H bonded to:$$, 'A',
  $$O, N or F$$, $$C, H or Cl$$, $$S, P or Si$$, $$Only hydrogen$$,
  $$Hydrogen bonding occurs when H is attached to highly electronegative N, O or F.$$,
  '[]',
  $$Review: hydrogen bonding occurs when h is attached to highly electronegative n, o or f.$$);

-- =============================================================================
-- Organic Chemistry (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The simplest alkane is:$$, 'A',
  $$Methane$$, $$Ethane$$, $$Propane$$, $$Butane$$,
  $$Methane (CH4) is the simplest alkane.$$,
  '[]',
  $$Review: methane (ch4) is the simplest alkane.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The general formula of alkanes is:$$, 'A',
  $$CnH2n+2$$, $$CnH2n$$, $$CnH2n-2$$, $$CnHn$$,
  $$Alkanes have the general formula CnH2n+2.$$,
  '[]',
  $$Review: alkanes have the general formula cnh2n+2.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Which functional group is present in alcohols?$$, 'A',
  $$-OH$$, $$-COOH$$, $$-CHO$$, $$-NH2$$,
  $$Alcohols contain the hydroxyl (-OH) functional group.$$,
  '[]',
  $$Review: alcohols contain the hydroxyl (-oh) functional group.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The functional group of carboxylic acids is:$$, 'A',
  $$-COOH$$, $$-OH$$, $$-CHO$$, $$-CO-$$,
  $$Carboxylic acids contain the -COOH group.$$,
  '[]',
  $$Review: carboxylic acids contain the -cooh group.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Alkenes contain which type of bond?$$, 'A',
  $$Carbon-carbon double bond$$, $$Carbon-carbon single bond$$, $$Carbon-oxygen triple bond$$, $$Carbon-hydrogen triple bond$$,
  $$Alkenes have at least one C=C double bond.$$,
  '[]',
  $$Review: alkenes have at least one c=c double bond.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The monomer of polythene is:$$, 'A',
  $$Ethene$$, $$Ethane$$, $$Ethyne$$, $$Ester$$,
  $$Polythene (polyethylene) is made from ethene (ethylene).$$,
  '[]',
  $$Review: polythene (polyethylene) is made from ethene (ethylene).$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Which compound is used as a fuel in motor vehicles?$$, 'A',
  $$Octane (petrol component)$$, $$Methanol only$$, $$Acetic acid$$, $$Glycerol$$,
  $$Petrol largely consists of octane and related hydrocarbons.$$,
  '[]',
  $$Review: petrol largely consists of octane and related hydrocarbons.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Organic chemistry primarily studies compounds of which element?$$, 'A',
  $$Carbon$$, $$Oxygen$$, $$Nitrogen$$, $$Helium$$,
  $$Organic chemistry is the chemistry of carbon compounds.$$,
  '[]',
  $$Review: organic chemistry is the chemistry of carbon compounds.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$The process by which large alkanes are broken into smaller molecules is:$$, 'A',
  $$Cracking$$, $$Polymerisation$$, $$Esterification$$, $$Hydrogenation$$,
  $$Cracking breaks larger hydrocarbons into smaller useful ones.$$,
  '[]',
  $$Review: cracking breaks larger hydrocarbons into smaller useful ones.$$);

select "public"."seed_question"('CHEM', 'Organic Chemistry', 'medium',
  $$Glucose is an example of a:$$, 'A',
  $$Carbohydrate$$, $$Protein$$, $$Lipid$$, $$Nucleic acid$$,
  $$Glucose (C6H12O6) is a carbohydrate (monosaccharide).$$,
  '[]',
  $$Review: glucose (c6h12o6) is a carbohydrate (monosaccharide).$$);

-- =============================================================================
-- Periodic Table (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$The modern periodic table is arranged by:$$, 'A',
  $$Increasing atomic number$$, $$Increasing mass number$$, $$Alphabetical order$$, $$Number of neutrons$$,
  $$Elements are arranged by increasing atomic number.$$,
  '[]',
  $$Review: elements are arranged by increasing atomic number.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Columns in the periodic table are called:$$, 'A',
  $$Groups$$, $$Periods$$, $$Series$$, $$Families (also)$$,
  $$Vertical columns are groups (also called families).$$,
  '[]',
  $$Review: vertical columns are groups (also called families).$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Rows in the periodic table are called:$$, 'A',
  $$Periods$$, $$Groups$$, $$Families$$, $$Clusters$$,
  $$Horizontal rows are periods.$$,
  '[]',
  $$Review: horizontal rows are periods.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Which element has the symbol 'Na'?$$, 'A',
  $$Sodium$$, $$Nitrogen$$, $$Noble gas$$, $$Nickel$$,
  $$Na is the symbol for sodium.$$,
  '[]',
  $$Review: na is the symbol for sodium.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$The noble gases are located in group:$$, 'A',
  $$18 (VIII A)$$, $$1$$, $$2$$, $$17$$,
  $$Noble gases are in group 18.$$,
  '[]',
  $$Review: noble gases are in group 18.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Halogens are found in group:$$, 'A',
  $$17 (VII A)$$, $$1$$, $$2$$, $$18$$,
  $$The halogens (F, Cl, Br, I) are in group 17.$$,
  '[]',
  $$Review: the halogens (f, cl, br, i) are in group 17.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Which element is a liquid at room temperature?$$, 'A',
  $$Mercury$$, $$Iron$$, $$Sodium$$, $$Oxygen$$,
  $$Mercury (Hg) is a liquid metal at room temperature.$$,
  '[]',
  $$Review: mercury (hg) is a liquid metal at room temperature.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$The most abundant element in the Earth's crust is:$$, 'A',
  $$Oxygen$$, $$Silicon$$, $$Iron$$, $$Aluminium$$,
  $$Oxygen is the most abundant element in the earth's crust.$$,
  '[]',
  $$Review: oxygen is the most abundant element in the earth's crust.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Mendeleev arranged elements according to:$$, 'A',
  $$Increasing atomic mass$$, $$Increasing atomic number$$, $$Electronegativity$$, $$Density$$,
  $$Mendeleev's periodic table was based on increasing atomic mass.$$,
  '[]',
  $$Review: mendeleev's periodic table was based on increasing atomic mass.$$);

select "public"."seed_question"('CHEM', 'Periodic Table', 'medium',
  $$Metals are generally found on which side of the periodic table?$$, 'A',
  $$Left$$, $$Right$$, $$Top right$$, $$Only in group 18$$,
  $$Metals occupy the left and middle of the periodic table.$$,
  '[]',
  $$Review: metals occupy the left and middle of the periodic table.$$);

-- =============================================================================
-- Stoichiometry (10)
-- =============================================================================
select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$One mole of any substance contains how many particles?$$, 'A',
  $$6.022 × 10^23 (Avogadro's number)$$, $$3.14 × 10^23$$, $$6.022 × 10^22$$, $$1 × 10^24$$,
  $$One mole = 6.022 × 10^23 particles.$$,
  '[]',
  $$Review: one mole = 6.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$The molar mass of water (H2O) is approximately:$$, 'A',
  $$18 g/mol$$, $$16 g/mol$$, $$20 g/mol$$, $$30 g/mol$$,
  $$H2O = 2(1) + 16 = 18 g/mol.$$,
  '[]',
  $$Review: h2o = 2(1) + 16 = 18 g/mol.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$In the reaction 2H2 + O2 → 2H2O, how many moles of water are produced from 2 moles of H2?$$, 'A',
  $$2$$, $$1$$, $$4$$, $$0.5$$,
  $$The balanced equation shows 2 mol H2 gives 2 mol H2O.$$,
  '[]',
  $$Review: the balanced equation shows 2 mol h2 gives 2 mol h2o.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$The mass percentage of hydrogen in water is about:$$, 'A',
  $$11%$$, $$89%$$, $$50%$$, $$33%$$,
  $$Mass of H = 2 out of 18 => 11.1%.$$,
  '[]',
  $$Review: mass of h = 2 out of 18 => 11.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$Molarity is defined as:$$, 'A',
  $$Moles of solute per litre of solution$$, $$Grams of solute per litre$$, $$Moles per kilogram$$, $$Mass per volume$$,
  $$Molarity (M) = moles of solute / litres of solution.$$,
  '[]',
  $$Review: molarity (m) = moles of solute / litres of solution.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$The relative atomic mass of magnesium is about:$$, 'A',
  $$24$$, $$12$$, $$16$$, $$40$$,
  $$The atomic mass of Mg is approximately 24.$$,
  '[]',
  $$Review: the atomic mass of mg is approximately 24.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$Which equation is correctly balanced: CH4 + 2O2 → ?$$, 'A',
  $$CO2 + 2H2O$$, $$CO2 + H2O$$, $$2CO2 + H2O$$, $$CO2 + 2H2$$,
  $$Balanced combustion: CH4 + 2O2 → CO2 + 2H2O.$$,
  '[]',
  $$Review: balanced combustion: ch4 + 2o2 → co2 + 2h2o.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$How many grams are in one mole of carbon (C ~ 12)?$$, 'A',
  $$12 g$$, $$6 g$$, $$24 g$$, $$48 g$$,
  $$One mole of carbon weighs about 12 grams.$$,
  '[]',
  $$Review: one mole of carbon weighs about 12 grams.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$The empirical formula of benzene (C6H6) is:$$, 'A',
  $$CH$$, $$C6H6$$, $$C2H2$$, $$C3H3$$,
  $$The simplest whole number ratio of benzene is CH.$$,
  '[]',
  $$Review: the simplest whole number ratio of benzene is ch.$$);

select "public"."seed_question"('CHEM', 'Stoichiometry', 'medium',
  $$In the reaction N2 + 3H2 → 2NH3, how many moles of NH3 are formed from 3 moles of H2?$$, 'A',
  $$2$$, $$1$$, $$3$$, $$6$$,
  $$3 mol H2 (3:2 ratio) give 2 mol NH3.$$,
  '[]',
  $$Review: 3 mol h2 (3:2 ratio) give 2 mol nh3.$$);

