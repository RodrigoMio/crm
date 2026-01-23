import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserProfile } from '../../users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem realizar esta ação');
    }

    return true;
  }
}















