export type UUID = string;
export type ISODateString = string;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ReviewStatus = 'draft' | 'ai_generated' | 'needs_review' | 'approved' | 'rejected' | 'archived';

export type SourceType =
  | 'OFFICIAL_BU_SOURCE'
  | 'ORIGINAL_AI'
  | 'HUMAN_CREATED'
  | 'OPEN_EDUCATIONAL_RESOURCE'
  | 'USER_SUBMITTED'
  | 'THIRD_PARTY_REFERENCE';

export type CopyrightStatus = 'original' | 'official_sample' | 'reference_based';

export type UserRole = 'student' | 'admin' | 'content_editor';

export type PreparationLevel = 'beginner' | 'intermediate' | 'advanced';

export type TestMode = 'practice' | 'timed_practice' | 'full_mock';

// ---- Auth / Users ----------------------------------------------------------

export interface Profile {
  id: UUID;
  user_id: UUID;
  full_name: string | null;
  target_university: string | null;
  campus: string | null;
  program_id: UUID | null;
  test_date: ISODateString | null;
  preparation_level: PreparationLevel | null;
  daily_study_minutes: number | null;
  timezone: string | null;
  avatar_url: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ---- Content ---------------------------------------------------------------

export interface Program {
  id: UUID;
  code: string;
  name: string;
  university: string;
  description: string | null;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface TestConfiguration {
  id: UUID;
  program_id: UUID;
  name: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  negative_marking: boolean;
  negative_mark_value: number | null;
  pass_percentage: number | null;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface TestSection {
  id: UUID;
  test_config_id: UUID;
  subject_id: UUID;
  name: string;
  question_count: number;
  marks: number;
  order_index: number;
  created_at: ISODateString;
}

export interface Subject {
  id: UUID;
  code: string;
  name: string;
  category: 'verbal' | 'quantitative' | 'analytical' | 'general_knowledge' | 'science' | 'medical';
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Topic {
  id: UUID;
  subject_id: UUID;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface QuestionOption {
  id: UUID;
  question_id: UUID;
  option_key: 'A' | 'B' | 'C' | 'D';
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuestionSource {
  id: UUID;
  question_id: UUID;
  source_type: SourceType;
  source_reference: string | null;
  copyright_status: CopyrightStatus;
  is_original: boolean;
  is_official_sample: boolean;
  research_url: string | null;
}

export interface QuestionReview {
  id: UUID;
  question_id: UUID;
  reviewer_id: UUID;
  status: ReviewStatus;
  comment: string | null;
  reviewed_at: ISODateString;
}

export interface Question {
  id: UUID;
  subject_id: UUID;
  topic_id: UUID | null;
  difficulty: Difficulty;
  question_text: string;
  options: QuestionOption[];
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  solution_steps: string[] | null;
  hint: string | null;
  learning_objective: string | null;
  question_date: ISODateString | null;
  valid_from: ISODateString | null;
  valid_until: ISODateString | null;
  source: QuestionSource | null;
  review_status: ReviewStatus;
  generated_by: 'AI' | 'HUMAN' | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ---- Tests / Attempts ------------------------------------------------------

export interface MockTest {
  id: UUID;
  program_id: UUID | null;
  test_config_id: UUID;
  name: string;
  description: string | null;
  is_active: boolean;
  question_count: number;
  duration_minutes: number;
  created_at: ISODateString;
}

export interface TestAttempt {
  id: UUID;
  user_id: UUID;
  mock_test_id: UUID | null;
  test_config_id: UUID | null;
  mode: TestMode;
  status: 'in_progress' | 'submitted' | 'expired' | 'abandoned';
  started_at: ISODateString;
  submitted_at: ISODateString | null;
  duration_seconds: number | null;
  score: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  unanswered_count: number | null;
  total_questions: number;
}

export interface TestAnswer {
  id: UUID;
  attempt_id: UUID;
  question_id: UUID;
  selected_option: 'A' | 'B' | 'C' | 'D' | null;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  answered_at: ISODateString | null;
}

// ---- Progress --------------------------------------------------------------

export interface UserProgress {
  id: UUID;
  user_id: UUID;
  question_id: UUID;
  subject_id: UUID;
  topic_id: UUID | null;
  difficulty: Difficulty;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  answered_at: ISODateString;
}

export interface TopicProgress {
  id: UUID;
  user_id: UUID;
  topic_id: UUID;
  attempted: number;
  correct: number;
  last_accuracy: number;
  best_streak: number;
  updated_at: ISODateString;
}

export interface StudyPlan {
  id: UUID;
  user_id: UUID;
  program_id: UUID | null;
  test_date: ISODateString | null;
  daily_study_minutes: number;
  start_date: ISODateString;
  generated_by: 'AI' | 'SYSTEM';
  status: 'active' | 'completed' | 'archived';
  content: unknown;
  created_at: ISODateString;
}

export interface StudySession {
  id: UUID;
  user_id: UUID;
  study_plan_id: UUID | null;
  date: ISODateString;
  target_questions: number;
  completed_questions: number;
  target_minutes: number;
  completed_minutes: number | null;
  completed: boolean;
}

// ---- Engagement ------------------------------------------------------------

export interface Bookmark {
  id: UUID;
  user_id: UUID;
  question_id: UUID;
  created_at: ISODateString;
}

export interface Mistake {
  id: UUID;
  user_id: UUID;
  question_id: UUID;
  topic_id: UUID | null;
  last_wrong_at: ISODateString;
  wrong_count: number;
  last_accuracy: number | null;
  resolved: boolean;
}

export interface Achievement {
  id: UUID;
  user_id: UUID;
  achievement_key: string;
  earned_at: ISODateString;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: ISODateString;
}

// ---- AI --------------------------------------------------------------------

export interface AIConversation {
  id: UUID;
  user_id: UUID;
  context_question_id: UUID | null;
  subject_id: UUID | null;
  title: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface AIMessage {
  id: UUID;
  conversation_id: UUID;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: ISODateString;
}

export interface QuestionReport {
  id: UUID;
  user_id: UUID;
  question_id: UUID;
  reason: string;
  detail: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: ISODateString;
}

// ---- Admin ----------------------------------------------------------------

export interface AdminUser {
  id: UUID;
  user_id: UUID;
  role: UserRole;
  permissions: string[];
  is_active: boolean;
  created_at: ISODateString;
}

export interface AuditLog {
  id: UUID;
  actor_user_id: UUID | null;
  action: string;
  entity_type: string | null;
  entity_id: UUID | null;
  metadata: unknown;
  ip: string | null;
  created_at: ISODateString;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: ISODateString;
}

export interface AIUsageRecord {
  id: UUID;
  user_id: UUID;
  feature: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  model: string | null;
  created_at: ISODateString;
}
