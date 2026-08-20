import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class TokenExchangeDto {
  @IsString()
  @IsNotEmpty()
  access_token: string;
}

export class GoogleAuthDto {
  /** Google ID token (JWT) issued by Google Identity Services. */
  @IsString()
  @IsNotEmpty()
  credential: string;

  /** OAuth nonce echoed back inside the id_token claim; must match what
   * Supabase sees in the token, otherwise it errors with "Passed nonce and
   * nonce in id_token should either both exist or not." */
  @IsOptional()
  @IsString()
  nonce?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(120) full_name?: string;
  @IsOptional() @IsString() @MaxLength(120) target_university?: string;
  @IsOptional() @IsString() @MaxLength(120) campus?: string;
  @IsOptional() @IsString() program_id?: string | null;
  @IsOptional() @IsString() test_date?: string | null;
  @IsOptional() @IsIn(['beginner', 'intermediate', 'advanced']) preparation_level?: string | null;
  @IsOptional() @IsNumber() @Min(5) @Max(600) daily_study_minutes?: number | null;
  @IsOptional() @IsString() timezone?: string | null;
  @IsOptional() onboarded?: boolean;
}

export class RecordAnswerDto {
  @IsString() @IsNotEmpty() question_id: string;
  @IsString() @IsNotEmpty() subject_id: string;
  @IsOptional() @IsString() topic_id?: string | null;
  @IsIn(['easy', 'medium', 'hard', 'expert']) difficulty: string;
  @IsIn(['A', 'B', 'C', 'D']) selected_option: string;
  is_correct: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(3600) time_spent_seconds?: number;
  @IsOptional() @IsString() mode?: string;
}

export class StartTestDto {
  @IsString() @IsNotEmpty() mock_test_id: string;
  @IsOptional() @IsIn(['practice', 'timed_practice', 'full_mock', 'hard_mock']) mode?: string;
}

export class SubmitAnswerDto {
  @IsString() @IsNotEmpty() attempt_id: string;
  @IsString() @IsNotEmpty() question_id: string;
  @IsOptional() @IsIn(['A', 'B', 'C', 'D']) selected_option?: 'A' | 'B' | 'C' | 'D' | null;
  @IsOptional() @IsNumber() time_spent_seconds?: number;
}

export class TutorRequestDto {
  @IsString() @IsNotEmpty() @MaxLength(4000) message: string;
  @IsOptional() @IsString() conversation_id?: string;
  @IsOptional() @IsString() question_id?: string | null;
}

export class HintRequestDto {
  @IsString() @IsNotEmpty() question_id: string;
}

export class StudyPlanDto {
  @IsString() @IsNotEmpty() test_date: string;
  @IsNumber() @Min(5) @Max(600) daily_study_minutes: number;
  @IsOptional() @IsString() program_id?: string;
}

export class GenerateQuestionsDto {
  @IsString() @IsNotEmpty() subject_id: string;
  @IsOptional() @IsString() topic_id?: string;
  @IsIn(['easy', 'medium', 'hard', 'expert']) difficulty: string;
  @IsNumber() @Min(1) @Max(50) count: number;
}

export class ReportQuestionDto {
  @IsString() @IsNotEmpty() question_id: string;
  @IsIn(['wrong_answer', 'incorrect_explanation', 'ambiguous', 'typo', 'duplicate', 'outdated', 'other']) reason: string;
  @IsOptional() @IsString() @MaxLength(1000) detail?: string;
}
