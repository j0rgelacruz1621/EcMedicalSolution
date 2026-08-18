import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  sub: number;
  rol?: string;
  doctorId?: number;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
