import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIJSONResponse, AIProvider, AIRequestOptions, AIResponse } from './ai-provider.interface';

/** Google Gemini provider (Interactions API). */
@Injectable()
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string {
    return this.config.get<string>('GEMINI_API_KEY') ?? '';
  }

  private get defaultModel(): string {
    return this.config.get<string>('GEMINI_MODEL') ?? 'gemini-flash-latest';
  }

  private async generate(messages: { role: string; content: string }[], opts: AIRequestOptions): Promise<AIResponse> {
    const model = opts.model ?? this.defaultModel;
    const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';

    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
    const input = messages
      .filter((m) => m.role !== 'system')
      .map((m) => m.content)
      .join('\n');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        model,
        input,
        system_instruction: system || undefined,
        generation_config: {
          temperature: opts.temperature ?? 0.3,
          max_output_tokens: opts.maxTokens ?? 3000,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini provider error ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
      usage?: { total_input_tokens?: number; total_output_tokens?: number };
      model?: string;
    };

    const modelOutput = json.steps?.find((s) => s.type === 'model_output');

    return {
      text: modelOutput?.content?.find((p) => p.type === 'text')?.text ?? '',
      model: json.model ?? model,
      usage: {
        promptTokens: json.usage?.total_input_tokens,
        completionTokens: json.usage?.total_output_tokens,
      },
    };
  }

  async generateText(prompt: string, opts: AIRequestOptions = {}): Promise<AIResponse> {
    const messages = [{ role: 'system', content: opts.system ?? 'You are a helpful assistant.' }];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: prompt });
    return this.generate(messages, opts);
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
