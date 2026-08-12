import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../guards/supabase-auth.guard';

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as RequestUser;
    return data ? user?.[data] : user;
  },
);
