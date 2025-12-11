import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Usa email ao invés de username
      passwordField: 'senha', // Usa senha ao invés de password
    });
  }

  async validate(email: string, senha: string): Promise<any> {
    console.log('[LocalStrategy] Validando credenciais:', { email, senhaLength: senha?.length });
    // validateUser já lança exceção se credenciais forem inválidas
    const user = await this.authService.validateUser(email, senha);
    console.log('[LocalStrategy] Usuário validado com sucesso:', user.email);
    return user;
  }
}




