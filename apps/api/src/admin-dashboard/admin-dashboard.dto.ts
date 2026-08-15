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
