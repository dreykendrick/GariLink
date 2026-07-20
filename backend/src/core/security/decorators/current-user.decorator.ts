import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessJwtPayload } from '../token.service';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessJwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: AccessJwtPayload }>();
    return request.user;
  },
);
