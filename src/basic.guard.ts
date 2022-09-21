import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Observable } from 'rxjs';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  private logger = new Logger('BasicAuthGuard');

  constructor(private configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const token = this.getBearerToken(request);
    if (!token) {
      this.logger.error('토큰이 없습니다.', request.header);
      throw new UnauthorizedException('인증 토큰이 없습니다.');
    }

    if (token !== this.configService.get<string>('PASSCODE')) {
      this.logger.warn('잘못된 passcode.', request);
      return false;
    }

    return true;
  }

  private getBearerToken(request: Request): string | undefined {
    const value = request.header('Authorization');
    if (!value) return undefined;

    const [tokenType, token] = value.split(' ');
    if (tokenType.toUpperCase() !== 'BEARER') {
      return undefined;
    }

    return token;
  }
}
