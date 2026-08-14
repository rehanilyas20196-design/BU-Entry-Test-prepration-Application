export interface LessonExample {
  title: string;
  problem: string;
  solution: string;
}

export interface Lesson {
  topicName: string;
  concept: string;
  formula?: string;
  solvedExample?: { problem: string; solution: string };
  examples: LessonExample[];
}

const LESSONS: Record<string, Lesson> = {
  percentages: {
    topicName: 'Percentages',
    concept:
      'A percentage is a number or ratio expressed as a fraction of 100. It is used to compare parts of a whole in a standardised way. Converting between fractions, decimals and percentages is a core skill for entry tests.',
    formula: 'Percentage = (Part ÷ Whole) × 100',
    solvedExample: {
      problem: 'In a class of 40 students, 25% scored an A. How many students scored an A?',
      solution:
        '25% of 40 = (25 ÷ 100) × 40 = 0.25 × 40 = 10. So 10 students scored an A.',
    },
    examples: [
      {
        title: 'Example 1',
        problem: 'What is 15% of 240?',
        solution: '15% of 240 = (15 ÷ 100) × 240 = 0.15 × 240 = 36.',
      },
      {
        title: 'Example 2',
        problem: 'A shirt priced at 800 is sold at 20% discount. What is the sale price?',
        solution:
          'Discount = 20% of 800 = 160. Sale price = 800 − 160 = 640.',
      },
      {
        title: 'Example 3',
        problem: 'After a 10% increase, a salary becomes 55,000. What was the original salary?',
        solution:
          'Let original be x. x × 1.10 = 55,000, so x = 55,000 ÷ 1.10 = 50,000.',
      },
    ],
  },
  ratios: {
    topicName: 'Ratios & Proportions',
    concept:
      'A ratio compares two or more quantities of the same kind, while a proportion states that two ratios are equal. Ratios are a foundation for percentages, mixtures and speed problems.',
    formula: 'a : b = c : d  ⇔  ad = bc',
    solvedExample: {
      problem: 'Divide 120 in the ratio 2 : 3.',
      solution:
        'Total parts = 2 + 3 = 5. One part = 120 ÷ 5 = 24. So 2 parts = 48 and 3 parts = 72.',
    },
    examples: [
      {
        title: 'Example 1',
        problem: 'If x : y = 3 : 4 and y = 20, find x.',
        solution: 'x / 20 = 3 / 4, so x = (3 × 20) / 4 = 15.',
      },
      {
        title: 'Example 2',
        problem: 'A mixture contains acid and water in the ratio 2 : 5. If there are 14 litres of acid, how much water is present?',
        solution:
          '2 parts = 14 litres, so 1 part = 7 litres. Water = 5 parts = 35 litres.',
      },
      {
        title: 'Example 3',
        problem: 'The ratio of boys to girls is 5 : 3 and there are 200 students. How many boys?',
        solution:
          'Total parts = 8. One part = 200 ÷ 8 = 25. Boys = 5 × 25 = 125.',
      },
    ],
  },
  linear_equations: {
    topicName: 'Linear Equations',
    concept:
      'A linear equation is an equation of the first degree. Solving it means isolating the unknown on one side using inverse operations while keeping the equation balanced.',
    formula: 'ax + b = c  ⇒  x = (c − b) ÷ a',
    solvedExample: {
      problem: 'Solve 3x + 5 = 20.',
      solution:
        'Subtract 5: 3x = 15. Divide by 3: x = 5.',
    },
    examples: [
      {
        title: 'Example 1',
        problem: 'Solve 2x − 7 = 13.',
        solution: 'Add 7: 2x = 20. Divide by 2: x = 10.',
      },
      {
        title: 'Example 2',
        problem: 'Solve 4(x + 2) = 28.',
        solution: 'Divide by 4: x + 2 = 7, so x = 5.',
      },
      {
        title: 'Example 3',
        problem: 'The sum of two consecutive numbers is 41. Find the numbers.',
        solution:
          'Let the numbers be n and n + 1. 2n + 1 = 41 ⇒ n = 20. Numbers are 20 and 21.',
      },
    ],
  },
  triangles: {
    topicName: 'Triangles',
    concept:
      'A triangle is a polygon with three sides and three angles summing to 180°. The Pythagorean theorem relates the sides of a right-angled triangle and is heavily tested.',
    formula: 'a² + b² = c²   (right-angled triangle)',
    solvedExample: {
      problem: 'A right triangle has legs of 6 cm and 8 cm. Find the hypotenuse.',
      solution:
        'c² = 6² + 8² = 36 + 64 = 100, so c = 10 cm.',
    },
    examples: [
      {
        title: 'Example 1',
        problem: 'Two angles of a triangle are 45° and 65°. Find the third angle.',
        solution: 'Third angle = 180° − (45° + 65°) = 70°.',
      },
      {
        title: 'Example 2',
        problem: 'Find the area of a triangle with base 12 cm and height 5 cm.',
        solution: 'Area = ½ × base × height = ½ × 12 × 5 = 30 cm².',
      },
      {
        title: 'Example 3',
        problem: 'In a right triangle the hypotenuse is 13 and one leg is 5. Find the other leg.',
        solution: 'b² = 13² − 5² = 169 − 25 = 144, so b = 12.',
      },
    ],
  },
};

export function getLesson(topicName: string): Lesson | null {
  const key = topicName.trim().toLowerCase();
  if (LESSONS[key]) return LESSONS[key];
  return Object.values(LESSONS).find((l) => l.topicName.toLowerCase() === key) ?? null;
}

export function lessonTopicNames(): string[] {
  return Object.values(LESSONS).map((l) => l.topicName);
}