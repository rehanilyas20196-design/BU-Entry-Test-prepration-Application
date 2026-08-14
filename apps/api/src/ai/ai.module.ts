import { Global, Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { PremiumModule } from '../premium/premium.module';

@Global()
@Module({
  imports: [PremiumModule],
  controllers: [AIController],
  providers: [AIService, OpenAIProvider, GeminiProvider],
  exports: [AIService, OpenAIProvider, GeminiProvider],
})
export class AIModule {}
