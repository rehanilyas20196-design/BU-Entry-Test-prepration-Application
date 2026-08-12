import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIJSONResponse, AIProvider, AIRequestOptions, AIResponse } from './ai-provider.interface';

/**
 * OpenAI-compatible chat completions provider.
 * Works with OpenAI and any OpenAI-compatible gateway (Azure, local models, etc).
 */
@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get<string>('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
  }

  private get apiKey(): string {
    return this.config.get<string>('AI_API_KEY') ?? '';
  }

  private get defaultModel(): string {
    return this.config.get<string>('AI_MODEL') ?? 'gpt-4o-mini';
  }

  private async chat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], opts: AIRequestOptions): Promise<AIResponse> {
    const model = opts.model ?? this.defaultModel;
    const maxTokens = opts.maxTokens ?? this.config.get<number>('AI_MAX_OUTPUT_LENGTH') ?? 3000;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: opts.temperature ?? 0.3,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI provider error ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      text: json.choices[0]?.message?.content ?? '',
      model,
      usage: {
        promptTokens: json.usage?.prompt_tokens,
        completionTokens: json.usage?.completion_tokens,
      },
    };
  }

  async generateText(prompt: string, opts: AIRequestOptions = {}): Promise<AIResponse> {
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: opts.system ?? 'You are a helpful assistant.' },
    ];
    messages.push({ role: 'user', content: prompt });
    return this.chat(messages, opts);
  }

  async generateJSON<T>(prompt: string, opts: AIRequestOptions = {}): Promise<AIJSONResponse<T>> {
    const response = await this.generateText(prompt, {
      ...opts,
      system:
        (opts.system ? opts.system + '\n' : '') +
        'Respond with a single valid JSON object only. Do not wrap in markdown fences. Do not add commentary.',
    });
    const text = response.text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response was not valid JSON');
    return { data: JSON.parse(match[0]) as T, usage: response.usage };
  }
}
