import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as net from 'net';

// Função auxiliar para verificar se a porta está disponível
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.listen(port);
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configura timeout para requisições longas (importação de planilhas grandes)
  app.use((req, res, next) => {
    // Aumenta timeout para 10 minutos (600000ms) para rotas de importação
    if (req.path.includes('/import')) {
      req.setTimeout(600000); // 10 minutos
      res.setTimeout(600000); // 10 minutos
    }
    next();
  });
  
  // Define prefixo global para todas as rotas
  app.setGlobalPrefix('api');
  
  // Middleware global para adicionar headers Cache-Control em todas as rotas da API
  app.use((req, res, next) => {
    // Apenas para rotas da API (que começam com /api)
    if (req.path.startsWith('/api')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
  
  // Habilita CORS para o frontend
  // Permite acesso de qualquer origem em desenvolvimento (ajuste para produção)
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000'];
  
  // CORS Configuration
  // Em produção, permite qualquer origem temporariamente para resolver problemas de acesso mobile
  // TODO: Restringir depois para apenas domínios permitidos por segurança
  app.enableCors({
    origin: (origin, callback) => {
      // Permite qualquer origem (temporário para resolver problemas mobile)
      // Se quiser restringir depois, use a lógica comentada abaixo
      callback(null, true);
      
      // Lógica original (comentada para permitir qualquer origem):
      // if (!origin || allowedOrigins.includes(origin) || origin.includes('192.168.') || origin.includes('10.') || origin.includes('172.')) {
      //   callback(null, true);
      // } else {
      //   callback(new Error('Not allowed by CORS'));
      // }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
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

  // Serve arquivos estáticos do frontend (DEPOIS de todas as configurações)
  // Tenta diferentes caminhos possíveis para o frontend/dist
  const fs = require('fs');
  const path = require('path');
  
  const possibleFrontendPaths = [
    // Caminho absoluto se definido em variável de ambiente (PRIORIDADE MÁXIMA)
    process.env.FRONTEND_DIST_PATH,
    // Caminhos específicos da estrutura apps_nodejs/crm (PRIORIDADE ALTA)
    '/apps_nodejs/crm/frontend/dist',
    '/home/crmcc/apps_nodejs/crm/frontend/dist',
    '/apps_nodejs/crm/frontend',  // Sem dist/ também
    '/home/crmcc/apps_nodejs/crm/frontend',  // Sem dist/ também
    // Caminhos padrão da KingHost (PRIORIDADE BAIXA - pode ter versão antiga)
    '/www',
    '/home/crmcc/www',
    // Caminhos relativos ao diretório do servidor compilado
    path.join(__dirname, '..', '..', 'frontend', 'dist'),
    path.join(__dirname, '..', 'frontend', 'dist'),
    path.join(__dirname, 'frontend', 'dist'),
    // Caminhos relativos ao diretório de trabalho atual
    path.join(process.cwd(), 'frontend', 'dist'),
    path.join(process.cwd(), '..', 'frontend', 'dist'),
    path.join(process.cwd(), 'frontend'),  // Sem dist/ também
    path.join(process.cwd(), '..', 'frontend'),  // Sem dist/ também
  ].filter(Boolean); // Remove valores undefined/null
  
  let frontendPath = null;
  for (const possiblePath of possibleFrontendPaths) {
    try {
      const indexPath = path.join(possiblePath, 'index.html');
      if (fs.existsSync(possiblePath) && fs.existsSync(indexPath)) {
        frontendPath = possiblePath;
        console.log(`✅ Frontend encontrado em: ${frontendPath}`);
        break;
      }
    } catch (e) {
      // Continua tentando outros caminhos
    }
  }
  
  if (frontendPath) {
    // Serve arquivos estáticos (sem prefixo, serve na raiz)
    app.useStaticAssets(frontendPath, {
      index: false,
      prefix: '/',
    });
    
    // Serve assets explicitamente (garante que /assets/* funcione)
    const assetsPath = path.join(frontendPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      app.useStaticAssets(assetsPath, {
        index: false,
        prefix: '/assets',
      });
      console.log(`✅ Assets configurados em: ${assetsPath}`);
    }
    
    // Fallback para index.html (necessário para React Router)
    // Esta rota deve ser a ÚLTIMA, depois de todas as rotas da API
    app.use((req, res, next) => {
      // Se não for uma rota da API, serve o index.html
      if (!req.path.startsWith('/api')) {
        const indexPath = path.join(frontendPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          // Adiciona headers para evitar cache do index.html
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.sendFile(path.resolve(indexPath));
        } else {
          next();
        }
      } else {
        next();
      }
    });
  } else {
    console.warn('⚠️ Frontend não encontrado. Apenas a API estará disponível.');
    console.warn('💡 Caminhos verificados:');
    possibleFrontendPaths.forEach(p => console.warn(`   - ${p}`));
    console.warn('💡 Defina FRONTEND_DIST_PATH no .env com o caminho absoluto do frontend/dist');
  }
  
  // Usa PORT_SERVER (KingHost) ou PORT (padrão) ou 3001 como fallback
  const port = parseInt(process.env.PORT_SERVER || process.env.PORT || '3001', 10);
  const host = process.env.HOST || '0.0.0.0'; // 0.0.0.0 permite acesso de qualquer IP na rede
  
  // Verifica se a porta está disponível antes de tentar iniciar
  const portAvailable = await isPortAvailable(port);
  if (!portAvailable) {
    console.error(`\n❌ ERRO: A porta ${port} já está em uso!`);
    console.error(`\n💡 Soluções:`);
    console.error(`   1. Execute: npm run kill-port (no diretório backend)`);
    console.error(`   2. Ou encerre manualmente o processo:`);
    console.error(`      Windows: netstat -ano | findstr :${port}`);
    console.error(`      Depois: taskkill /PID <PID> /F`);
    console.error(`   3. Ou use outra porta definindo PORT=3002 no .env\n`);
    process.exit(1);
  }
  
  try {
    await app.listen(port, host);
    console.log(`🚀 Backend rodando na porta ${port}`);
    console.log(`📡 API disponível em http://localhost:${port}/api`);
    console.log(`🌐 Acessível na rede em http://[SEU_IP]:${port}/api`);
    if (frontendPath) {
      console.log(`🌐 Frontend disponível em http://localhost:${port}/`);
    }
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ ERRO: A porta ${port} já está em uso!`);
      console.error(`\n💡 Execute: npm run kill-port (no diretório backend)\n`);
      process.exit(1);
    } else {
      throw error;
    }
  }
}

bootstrap();




