"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const net = require("net");
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            }
            else {
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
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((req, res, next) => {
        if (req.path.includes('/import')) {
            req.setTimeout(600000);
            res.setTimeout(600000);
        }
        next();
    });
    app.setGlobalPrefix('api');
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        next();
    });
    const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')
        : ['http://localhost:3000'];
    app.enableCors({
        origin: (origin, callback) => {
            callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
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
            return new common_1.BadRequestException({
                statusCode: 400,
                message: messages,
                error: 'Bad Request',
            });
        },
    }));
    const fs = require('fs');
    const path = require('path');
    const possibleFrontendPaths = [
        process.env.FRONTEND_DIST_PATH,
        '/apps_nodejs/crm/frontend/dist',
        '/home/crmcc/apps_nodejs/crm/frontend/dist',
        '/apps_nodejs/crm/frontend',
        '/home/crmcc/apps_nodejs/crm/frontend',
        '/www',
        '/home/crmcc/www',
        path.join(__dirname, '..', '..', 'frontend', 'dist'),
        path.join(__dirname, '..', 'frontend', 'dist'),
        path.join(__dirname, 'frontend', 'dist'),
        path.join(process.cwd(), 'frontend', 'dist'),
        path.join(process.cwd(), '..', 'frontend', 'dist'),
        path.join(process.cwd(), 'frontend'),
        path.join(process.cwd(), '..', 'frontend'),
    ].filter(Boolean);
    let frontendPath = null;
    for (const possiblePath of possibleFrontendPaths) {
        try {
            const indexPath = path.join(possiblePath, 'index.html');
            if (fs.existsSync(possiblePath) && fs.existsSync(indexPath)) {
                frontendPath = possiblePath;
                console.log(`✅ Frontend encontrado em: ${frontendPath}`);
                break;
            }
        }
        catch (e) {
        }
    }
    if (frontendPath) {
        app.useStaticAssets(frontendPath, {
            index: false,
            prefix: '/',
        });
        const assetsPath = path.join(frontendPath, 'assets');
        if (fs.existsSync(assetsPath)) {
            app.useStaticAssets(assetsPath, {
                index: false,
                prefix: '/assets',
            });
            console.log(`✅ Assets configurados em: ${assetsPath}`);
        }
        app.use((req, res, next) => {
            if (!req.path.startsWith('/api')) {
                const indexPath = path.join(frontendPath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                    res.sendFile(path.resolve(indexPath));
                }
                else {
                    next();
                }
            }
            else {
                next();
            }
        });
    }
    else {
        console.warn('⚠️ Frontend não encontrado. Apenas a API estará disponível.');
        console.warn('💡 Caminhos verificados:');
        possibleFrontendPaths.forEach(p => console.warn(`   - ${p}`));
        console.warn('💡 Defina FRONTEND_DIST_PATH no .env com o caminho absoluto do frontend/dist');
    }
    const port = parseInt(process.env.PORT_SERVER || process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
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
    }
    catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.error(`\n❌ ERRO: A porta ${port} já está em uso!`);
            console.error(`\n💡 Execute: npm run kill-port (no diretório backend)\n`);
            process.exit(1);
        }
        else {
            throw error;
        }
    }
}
bootstrap();
//# sourceMappingURL=main.js.map