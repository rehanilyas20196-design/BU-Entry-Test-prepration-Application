import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsEmail({}, { message: 'Enter a valid admin email' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6)
  password: string;
}

export class CreateQuestionDto {
  @IsString() @IsNotEmpty() subject_id: string;
  @IsOptional() @IsString() topic_id?: string | null;
  @IsString() @IsNotEmpty() difficulty?: string;
  @IsString() @IsNotEmpty() @MaxLength(4000) question_text: string;
  @IsString() @IsNotEmpty() correct_option: 'A' | 'B' | 'C' | 'D';
  options: { option_key: 'A' | 'B' | 'C' | 'D'; option_text: string }[];
  @IsOptional() @IsString() explanation?: string | null;
  @IsOptional() @IsString() hint?: string | null;
  @IsOptional() @IsString() review_status?: string;
}

export class UpdateQuestionDto {
  @IsOptional() @IsString() subject_id?: string;
  @IsOptional() @IsString() topic_id?: string | null;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsString() @MaxLength(4000) question_text?: string;
  @IsOptional() @IsString() correct_option?: 'A' | 'B' | 'C' | 'D';
  @IsOptional() options?: { option_key: 'A' | 'B' | 'C' | 'D'; option_text: string }[];
  @IsOptional() @IsString() explanation?: string | null;
  @IsOptional() @IsString() hint?: string | null;
  @IsOptional() @IsString() review_status?: string;
}

export class ImportQuestionsDto {
  @IsString() @IsNotEmpty() csv: string;
}

export class CreateCouponDto {
  @IsString() @IsNotEmpty() @MaxLength(40) code: string;
  @IsString() @IsNotEmpty() discount_type: 'full' | 'percent' | 'flat';
  @IsOptional() discount_value?: number;
  @IsOptional() max_uses?: number | null;
  @IsOptional() expires_at?: string | null;
}

export class ToggleDto {
  @IsOptional() is_active?: boolean;
}

export class CreateAnnouncementDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(2000) body?: string;
  @IsOptional() @IsString() type?: string;
}

export class CreateSubjectDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() sort_order?: number;
}

export class CreateTopicDto {
  @IsString() @IsNotEmpty() subject_id: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateProgramDto {
  @IsString() @IsNotEmpty() university_id: string;
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() campus?: string;
}

export class UpdateCatalogDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() sort_order?: number;
  @IsOptional() @IsString() subject_id?: string;
  @IsOptional() @IsString() university_id?: string;
  @IsOptional() @IsString() campus?: string;
}
