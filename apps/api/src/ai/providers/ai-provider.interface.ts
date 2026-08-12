export interface AIProvider {
  readonly name: string;
  generateText(prompt: string, opts?: AIRequestOptions): Promise<AIResponse>;
  generateJSON<T>(prompt: string, opts?: AIRequestOptions): Promise<AIJSONResponse<T>>;
}

export interface AIJSONResponse<T> {
  data: T;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  system?: string;
  model?: string;
}

export interface AIResponse {
  text: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}
