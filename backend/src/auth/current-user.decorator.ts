import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  sub: number;
  user_name: string;
  rol?: string;
  application?: string;
  doctorId?: number;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
