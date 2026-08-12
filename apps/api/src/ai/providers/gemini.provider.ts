import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIJSONResponse, AIProvider, AIRequestOptions, AIResponse } from './ai-provider.interface';

/** Google Gemini provider (generativelanguage API). */
@Injectable()
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string {
    return this.config.get<string>('GEMINI_API_KEY') ?? '';
  }

  private get defaultModel(): string {
    return this.config.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';
  }

  private async generate(messages: { role: string; content: string }[], opts: AIRequestOptions): Promise<AIResponse> {
    const model = opts.model ?? this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role === 'system' ? 'user' : 'user',
      parts: [{ text: m.content }],
    }));

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: opts.temperature ?? 0.3,
          maxOutputTokens: opts.maxTokens ?? 3000,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini provider error ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    return {
      text: json.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      model,
      usage: {
        promptTokens: json.usageMetadata?.promptTokenCount,
        completionTokens: json.usageMetadata?.candidatesTokenCount,
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
