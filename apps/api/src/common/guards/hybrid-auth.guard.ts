import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { fromNodeHeaders } from 'better-auth/node';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';
import { auth } from '../../lib/better-auth';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../decorators/current-user.decorator';

/**
 * Accepts legacy JWT (vendor/admin) and Better Auth bearer sessions (customer).
 */
@Injectable()
export class HybridAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();

    try {
      const activated = await super.canActivate(context);
      if (activated === true) return true;
    } catch {
      // Not a valid legacy JWT — try Better Auth session below.
    }

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.id) {
      throw new UnauthorizedException();
    }

    const appUser = await this.prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!appUser) throw new UnauthorizedException();

    const payload: JwtPayload = {
      sub: appUser.id,
      phone: appUser.phone,
      role: appUser.role,
    };
    req.user = payload;
    return true;
  }

  handleRequest<TUser = JwtPayload>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}
