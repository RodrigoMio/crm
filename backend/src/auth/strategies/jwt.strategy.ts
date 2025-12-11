import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'seu_jwt_secret_super_seguro_aqui',
    });
  }

  async validate(payload: any) {
    // Busca o usuário completo para garantir que está ativo
    const user = await this.usersService.findOne(payload.sub);

    if (!user.ativo) {
      throw new Error('Usuário inativo');
    }

    return {
      id: user.id,
      email: user.email,
      perfil: user.perfil,
    };
  }
}




