import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

interface TrialMetadata {
  count: number;
  expiresAt: number;
}

@Injectable()
export class BasicAuthGuard implements CanActivate {
  private logger = new Logger('BasicAuthGuard');

  private readonly trialsByIp: Map<string, TrialMetadata> = new Map();
  private readonly trialBanThreshold: number;
  private readonly passcode;

  constructor(private configService: ConfigService) {
    this.passcode = this.configService.get<string>('PASSCODE');
    if (this.passcode.length < 5) {
      throw new Error('보안에 취약한 패스코드입니다.');
    }
    this.trialBanThreshold = configService.get<number>('IP_BAN_THRESHOLD') - 1;
    if (this.trialBanThreshold < 0) {
      throw new Error('차단 시도횟수는 0보다 커야합니다.');
    }
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip;

    this.deleteTrialDataIfExpired(ip, request);

    if (this.isIpBannedBcsOfExceedTrialCount(ip)) {
      this.logger.warn(`ban ip (${ip}, 시도횟수 초과)`, request);
      return false;
    }

    const token = this.getBearerToken(request);
    if (!token) {
      this.logger.error('토큰이 없습니다.', request.header);
      throw new UnauthorizedException('인증 토큰이 없습니다.');
    }

    if (token !== this.passcode) {
      this.logger.warn('잘못된 passcode.', request);
      this.setTrialIfNotExist(ip);
      this.increaseTrialCount(ip);
      return false;
    }

    return true;
  }

  //TODO 나중에 서비스로 떼어내기..
  private isIpBannedBcsOfExceedTrialCount(ip) {
    const trial = this.trialsByIp.get(ip);
    return trial && trial.count > this.trialBanThreshold;
  }

  private deleteTrialDataIfExpired(ip, request) {
    const trial = this.trialsByIp.get(ip);
    if (trial && trial.expiresAt < Date.now()) {
      this.logger.log(`ip(${ip}) ban 해제.)`, request);
      this.trialsByIp.delete(ip);
    }
  }

  private setTrialIfNotExist(ip) {
    if (!this.trialsByIp.has(ip)) {
      this.trialsByIp.set(ip, {
        count: 0,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24,
      });
    }
  }

  private increaseTrialCount(ip) {
    const trial = this.trialsByIp.get(ip);
    trial.count++;
    this.trialsByIp.set(ip, trial);
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
