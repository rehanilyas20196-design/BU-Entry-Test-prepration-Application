import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { AIProvider } from './providers/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { PremiumService } from '../premium/premium.service';
import { HintRequestDto, StudyPlanDto, TutorRequestDto } from '../common/dto';

const TUTOR_SYSTEM = `You are the BUET Prep AI tutor, an expert educational assistant helping students prepare for the Bahria University Entry Test.
Your purpose is TEACHING, not just answering.
For any question or concept, structure your answer as:
1. What the question is asking
2. The relevant concept
3. Step-by-step solution
4. Why the correct answer is correct
5. Why the other options are wrong
6. A similar practice question
Never just reveal an answer without explanation. Use clear, encouraging, professional language.
You are part of an independent preparation platform and are NOT affiliated with Bahria University.`;

const HINT_SYSTEM = `You are a subtle tutor. Give ONLY a small pedagogical hint that guides the student toward the answer WITHOUT revealing it directly or giving the answer away. Keep it to 1-3 sentences.`;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly provider: AIProvider;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly premium: PremiumService,
    openAI: OpenAIProvider,
    gemini: GeminiProvider,
  ) {
    const providerName = this.config.get<string>('AI_PROVIDER') ?? 'openai';
    this.provider = providerName === 'gemini' ? gemini : openAI;
    this.logger.log(`AI provider: ${this.provider.name}`);
  }

  // ============ Quota / safety ============

  private async checkQuota(userId: string): Promise<boolean> {
    const { data } = await this.supabase.admin
      .from('app_settings')
      .select('value')
      .eq('key', 'ai.daily_quota_per_user')
      .maybeSingle();
    const quota = (data?.value as { value?: number })?.value ?? 30;

    const today = new Date().toISOString().slice(0, 10);
    const { count } = await this.supabase.admin
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);
    return (count ?? 0) < quota;
  }

  private async logUsage(userId: string, feature: string, usage?: { promptTokens?: number; completionTokens?: number }, error?: string) {
    await this.supabase.admin.from('ai_usage').insert({
      user_id: userId,
      feature,
      prompt_tokens: usage?.promptTokens ?? null,
      completion_tokens: usage?.completionTokens ?? null,
      status: error ? 'error' : 'ok',
      error: error ?? null,
    });
  }

  private sanitizeInput(input: string): string {
    const maxLen = this.config.get<number>('AI_MAX_INPUT_LENGTH') ?? 4000;
    return input.replace(/[\x00-\x1F\x7F]/g, ' ').slice(0, maxLen); // eslint-disable-line no-control-regex
  }

  // ============ Tutor ============

  async tutor(userId: string, dto: TutorRequestDto) {
    await this.premium.requirePremium(userId);
    if (!(await this.checkQuota(userId))) {
      throw new UnauthorizedException('Daily AI limit reached. Try again tomorrow.');
    }

    const message = this.sanitizeInput(dto.message);
    let questionContext = '';
    if (dto.question_id) {
      const { data: q } = await this.supabase.admin
        .from('questions')
        .select('question_text, correct_option, explanation, options:question_options(option_key, option_text, is_correct)')
        .eq('id', dto.question_id)
        .maybeSingle();
      if (q) {
        questionContext = `\n\nThe student is asking about this question:\nQ: ${q.question_text}\nOptions: ${q.options
          .map((o: { option_key: string; option_text: string }) => `${o.option_key}. ${o.option_text}`)
          .join(' | ')}\nCorrect answer: ${q.correct_option}\nOfficial explanation: ${q.explanation ?? 'n/a'}\n\n`;
      }
    }

    const prompt = `${questionContext}Student message: ${message}`;
    try {
      const response = await this.provider.generateText(prompt, {
        system: TUTOR_SYSTEM,
        temperature: 0.4,
      });
      await this.logUsage(userId, 'tutor', response.usage);
      return { reply: response.text, model: response.model };
    } catch (e) {
      await this.logUsage(userId, 'tutor', undefined, String(e));
      throw e;
    }
  }

  // ============ Hint ============

  async getHint(userId: string, dto: HintRequestDto) {
    await this.premium.requirePremium(userId);
    if (!(await this.checkQuota(userId))) {
      throw new UnauthorizedException('Daily AI limit reached.');
    }
    const { data: q, error } = await this.supabase.admin
      .from('questions')
      .select('question_text, topic:topics(name), hint')
      .eq('id', dto.question_id)
      .maybeSingle();
    if (error || !q) return { hint: 'Hint unavailable.' };
    if (q.hint) {
      return { hint: q.hint, from_cache: true };
    }
    const prompt = `Question: ${q.question_text}\nTopic: ${Array.isArray(q.topic) ? q.topic[0]?.name ?? '' : (q.topic as any)?.name ?? ''}\nGive a small hint without revealing the answer.`;
    try {
      const response = await this.provider.generateText(prompt, { system: HINT_SYSTEM, maxTokens: 150, temperature: 0.3 });
      await this.logUsage(userId, 'hint', response.usage);
      return { hint: response.text.trim() };
    } catch (e) {
      await this.logUsage(userId, 'hint', undefined, String(e));
      throw e;
    }
  }

  // ============ Similar question generation ============

  async generateSimilarQuestion(userId: string, questionId: string) {
    await this.premium.requirePremium(userId);
    const { data: q } = await this.supabase.admin
      .from('questions')
      .select('question_text, topic_id, topic:topics(name), subject:subjects(name), difficulty')
      .eq('id', questionId)
      .maybeSingle();
    if (!q) throw new Error('Question not found');

    const topicName = Array.isArray(q.topic) ? q.topic[0]?.name ?? 'general' : (q.topic as any)?.name ?? 'general';
    const subjectName = Array.isArray(q.subject) ? q.subject[0]?.name ?? 'general' : (q.subject as any)?.name ?? 'general';

    const prompt = `Create ONE original multiple-choice practice question in the SAME concept as the following question, with DIFFERENT wording. Topic: ${topicName}, Subject: ${subjectName}, Difficulty: ${q.difficulty}.
Original question (do not copy): ${q.question_text}

Return JSON: {"question":"...","options":["a","b","c","d"],"correct_index":0,"explanation":"..."}`;

    const response = await this.provider.generateJSON<{
      question: string;
      options: string[];
      correct_index: number;
      explanation: string;
    }>(prompt, { temperature: 0.7, maxTokens: 800 });
    await this.logUsage(userId, 'similar_question', response.usage);

    const data = response.data;
    return {
      question_text: data.question,
      options: data.options,
      correct_index: data.correct_index,
      explanation: data.explanation,
      is_original: true,
      source_label: 'Original AI-generated practice question',
    };
  }

  // ============ Study plan ============

  async generateStudyPlan(userId: string, dto: StudyPlanDto) {
    await this.premium.requirePremium(userId);
    const { data: profile } = await this.supabase.admin
      .from('profiles')
      .select('program:programs(name), preparation_level')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: weakTopics } = await this.supabase.admin
      .from('topic_progress')
      .select('topic:topics(name), last_accuracy')
      .eq('user_id', userId)
      .gt('attempted', 2)
      .order('last_accuracy', { ascending: true })
      .limit(5);

    const daysUntil = Math.max(1, Math.ceil((new Date(dto.test_date).getTime() - Date.now()) / 86400000));

    const programName = Array.isArray(profile?.program)
      ? (profile.program as any[])[0]?.name ?? 'not set'
      : (profile?.program as any)?.name ?? 'not set';

    const prompt = `Create a personalized study plan for the Bahria University Entry Test (BUET).
Days until test: ${daysUntil}
Daily study minutes: ${dto.daily_study_minutes}
Program: ${programName}
Preparation level: ${profile?.preparation_level ?? 'unknown'}
Weak topics (prioritize early): ${(weakTopics ?? []).map((t) => `${Array.isArray(t.topic) ? t.topic[0]?.name : (t.topic as any)?.name} (${t.last_accuracy}%)`).join(', ') || 'none recorded'}

Return JSON: {"days":[{"day":1,"focus_topics":["..."],"question_target":30,"notes":"..."}]}`;

    const response = await this.provider.generateJSON<{ days: { day: number; focus_topics: string[]; question_target: number; notes: string }[] }>(
      prompt,
      { temperature: 0.5, maxTokens: 2000 },
    );
    await this.logUsage(userId, 'study_plan', response.usage);

    const { data: plan, error } = await this.supabase.admin
      .from('study_plans')
      .insert({
        user_id: userId,
        program_id: dto.program_id ?? null,
        test_date: dto.test_date,
        daily_study_minutes: dto.daily_study_minutes,
        start_date: new Date().toISOString().slice(0, 10),
        generated_by: 'AI',
        status: 'active',
        content: response.data,
      })
      .select()
      .single();
    if (error) throw error;
    return plan;
  }
}
