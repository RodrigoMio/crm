import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Define prefixo global para todas as rotas
  app.setGlobalPrefix('api');
  
  // Habilita CORS para o frontend
  // Permite acesso de qualquer origem em desenvolvimento (ajuste para produção)
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Em desenvolvimento, permite qualquer origem da rede local
      if (!origin || allowedOrigins.includes(origin) || origin.includes('192.168.') || origin.includes('10.') || origin.includes('172.')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Habilita validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints).join(', ');
          }
          return `${error.property} tem um valor inválido`;
        });
        return new BadRequestException({
          statusCode: 400,
          message: messages,
          error: 'Bad Request',
        });
      },
    }),
  );

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0'; // 0.0.0.0 permite acesso de qualquer IP na rede
  await app.listen(port, host);
  console.log(`🚀 Backend rodando na porta ${port}`);
  console.log(`📡 API disponível em http://localhost:${port}/api`);
  console.log(`🌐 Acessível na rede em http://[SEU_IP]:${port}/api`);
}

bootstrap();




