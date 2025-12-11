import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida credenciais do usuário
   */
  async validateUser(email: string, senha: string): Promise<any> {
    console.log('[AuthService] Validando usuário:', email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      console.log('[AuthService] Usuário não encontrado');
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.ativo) {
      console.log('[AuthService] Usuário inativo');
      throw new UnauthorizedException('Usuário inativo');
    }

    console.log('[AuthService] Comparando senha...');
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    console.log('[AuthService] Senha válida:', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Retorna apenas dados necessários (sem senha)
    const { senha: _, ...result } = user;
    return result;
  }

  /**
   * Realiza login e retorna token JWT
   */
  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      perfil: user.perfil,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
      },
    };
  }
}




