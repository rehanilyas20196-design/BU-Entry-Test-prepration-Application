import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('AppModule', () => {
  it('should compile', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.SUPABASE_ANON_KEY = 'anon';
    process.env.JWT_SECRET = 'secret';
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'sk-test';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
  });
});
