import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { AIProvider } from '../ai/providers/ai-provider.interface';
import { OpenAIProvider } from '../ai/providers/openai.provider';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import { GenerateQuestionsDto } from '../common/dto';

export interface ValidatedQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  solution_steps?: string[];
  hint?: string;
  learning_objective?: string;
}

const GENERATION_SYSTEM = `You are an expert educational assessment designer for undergraduate university entry-test preparation in Pakistan.
Create ORIGINAL multiple-choice practice questions. Never copy from textbooks, paid courses, or copyrighted material.
Requirements per question:
* Exactly four options.
* Exactly one correct answer.
* Original wording.
* Clear, unambiguous language.
* Appropriate for undergraduate entry-test preparation.
* Include a concise explanation.
* Include step-by-step solution when mathematical or scientific.
* Do NOT claim to be an official Bahria University question.
Return structured JSON matching the requested schema.`;

@Injectable()
export class QuestionGenService {
  private readonly logger = new Logger(QuestionGenService.name);
  private readonly provider: AIProvider;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    openAI: OpenAIProvider,
    gemini: GeminiProvider,
  ) {
    const providerName = this.config.get<string>('AI_PROVIDER') ?? 'openai';
    this.provider = providerName === 'gemini' ? gemini : openAI;
  }

  /** Generate a batch, validate each, insert with needs_review status. */
  async generateBatch(adminUserId: string, dto: GenerateQuestionsDto) {
    const maxBatch = this.config.get<number>('AI_QUESTION_GEN_BATCH_MAX') ?? 50;
    if (dto.count < 1 || dto.count > maxBatch) {
      throw new BadRequestException(`count must be between 1 and ${maxBatch}`);
    }

    const { data: subject } = await this.supabase.admin
      .from('subjects')
      .select('name')
      .eq('id', dto.subject_id)
      .maybeSingle();
    const { data: topic } = dto.topic_id
      ? await this.supabase.admin.from('topics').select('name').eq('id', dto.topic_id).maybeSingle()
      : { data: null };

    if (!subject) throw new BadRequestException('Subject not found');

    const subjectName = subject.name;
    const topicName = Array.isArray(topic) ? topic[0]?.name ?? 'general' : (topic as any)?.name ?? 'general';

    const prompts = Array.from({ length: dto.count }, () => ({
      subject: subjectName,
      topic: topicName,
      difficulty: dto.difficulty,
    }));

    // Generate in small concurrent batches to avoid rate limits and memory spikes.
    const results: { ok: boolean; question?: ValidatedQuestion; error?: string }[] = [];
    const BATCH = 5;
    for (let i = 0; i < prompts.length; i += BATCH) {
      const slice = prompts.slice(i, i + BATCH);
      const settled = await Promise.allSettled(
        slice.map((p) => this.generateOne(p.subject, p.topic, p.difficulty)),
      );
      for (const s of settled) {
        if (s.status === 'fulfilled') results.push(s.value);
        else results.push({ ok: false, error: s.reason?.message ?? 'Generation failed' });
      }
    }

    const inserted: { id: string; question: string; validation: { valid: boolean; errors: string[] } }[] = [];
    let insertedCount = 0;

    for (const r of results) {
      if (!r.ok || !r.question) continue;
      const validation = await this.validateQuestion(r.question);
      if (!validation.valid) continue;

      const duplicate = await this.findDuplicate(r.question.question);
      const questionId = await this.insertQuestion(adminUserId, dto, r.question, duplicate);
      if (questionId) {
        insertedCount++;
        inserted.push({
          id: questionId,
          question: r.question.question,
          validation,
        });
      }
    }

    this.logger.log(`Generated ${insertedCount}/${dto.count} questions for ${subject.name}`);
    return {
      requested: dto.count,
      inserted: insertedCount,
      generated: results,
      inserted_questions: inserted,
    };
  }

  private async generateOne(subject: string, topic: string, difficulty: string) {
    const prompt = `Create 1 original MCQ. Subject: ${subject}. Topic: ${topic}. Difficulty: ${difficulty}.
Return JSON: {"question":"...","options":["a","b","c","d"],"correct_index":N,"explanation":"...","solution_steps":["..."],"hint":"...","learning_objective":"..."}`;

    const response = await this.provider.generateJSON<{
      question: string;
      options: string[];
      correct_index: number;
      explanation: string;
      solution_steps?: string[];
      hint?: string;
      learning_objective?: string;
    }>(prompt, { system: GENERATION_SYSTEM, temperature: 0.7, maxTokens: 900 });

    return { ok: true, question: response.data as ValidatedQuestion };
  }

  private async validateQuestion(q: ValidatedQuestion) {
    const errors: string[] = [];
    if (!q.question || q.question.trim().length < 10) errors.push('Question text too short');
    if (!q.options || q.options.length !== 4) errors.push('Must have exactly 4 options');
    else if (q.options.some((o) => !o?.trim())) errors.push('Option text cannot be empty');
    else if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) errors.push('Duplicate options');
    if (q.correct_index < 0 || q.correct_index > 3) errors.push('correct_index out of range');
    if (!q.explanation || q.explanation.trim().length < 10) errors.push('Explanation too short');

    return { valid: errors.length === 0, errors };
  }

  private async findDuplicate(questionText: string) {
    const { data } = await this.supabase.admin
      .from('questions')
      .select('id, question_text')
      .limit(20);
    if (!data || data.length === 0) return null;

    // Normalized text comparison for fast local duplicate detection.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const target = norm(questionText);
    for (const q of data) {
      if (q.question_text && norm(q.question_text) === target) return q.id;
    }
    return null;
  }

  private async insertQuestion(
    adminUserId: string,
    dto: GenerateQuestionsDto,
    q: ValidatedQuestion,
    duplicateOf: string | null,
  ): Promise<string | null> {
    if (duplicateOf) {
      await this.supabase.admin.from('question_duplicates').insert({
        question_id_a: duplicateOf,
        question_id_b: dto.subject_id, // placeholder; real flow compares stored ids
        method: 'normalized_text',
        status: 'flagged',
      });
      return null;
    }

    const { data: question, error } = await this.supabase.admin
      .from('questions')
      .insert({
        subject_id: dto.subject_id,
        topic_id: dto.topic_id ?? null,
        difficulty: dto.difficulty,
        question_text: q.question,
        correct_option: (['A', 'B', 'C', 'D'] as const)[q.correct_index],
        explanation: q.explanation,
        solution_steps: q.solution_steps ?? null,
        hint: q.hint ?? null,
        learning_objective: q.learning_objective ?? null,
        is_original: true,
        is_official_sample: false,
        review_status: 'needs_review',
        generated_by: 'AI',
        source_type: 'ORIGINAL_AI',
        source_reference: `Generated for ${dto.difficulty} ${dto.topic_id ? 'topic' : 'general'}`,
        copyright_status: 'original',
      })
      .select('id')
      .single();

    if (error) {
      this.logger.error(`Insert failed: ${error.message}`);
      return null;
    }

    const keys = ['A', 'B', 'C', 'D'] as const;
    for (let i = 0; i < 4; i++) {
      await this.supabase.admin.from('question_options').insert({
        question_id: question.id,
        option_key: keys[i],
        option_text: q.options[i],
        is_correct: i === q.correct_index,
        order_index: i,
      });
    }

    await this.supabase.admin.from('question_sources').insert({
      question_id: question.id,
      source_type: 'ORIGINAL_AI',
      source_reference: 'Original AI-generated practice question',
      copyright_status: 'original',
      is_original: true,
      is_official_sample: false,
    });

    return question.id;
  }
}
