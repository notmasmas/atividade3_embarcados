const httpProxy = require('express-http-proxy');
const express = require('express');
const app = express();
var logger = require('morgan');
const jwt = require('jsonwebtoken');

const authMiddleware = require('./authentication');

app.use(logger('dev'));
app.use(express.json());

// Rota de login simplificada. Só retorna um token válido (não precisa de credenciais)
// Seria a rota de login para um admin
app.post('/login', async (req, res, next) => {
    try {
        const accessToken = jwt.sign(
            { sub: 'Usuário admin' },
            '12345', // JWT SECRET
            { expiresIn: '2d' }
        );

        res.json({ accessToken, tokenType: 'Bearer' });
    } catch (err) {
        next(err);
    }
});

app.use('/pessoas', authMiddleware); // Só o admin cadastra pessoas
app.use('/quartos', authMiddleware); // Só o admin cadastra quartos
app.post('/senhas', authMiddleware); // Só o admin cadastra senhas (a rota de verificar senha não é bloqueada)
app.delete('/senhas/:numeroQuarto', authMiddleware) // Só o admin deleta senhas
app.get('/acessos', authMiddleware); // só o admin visualiza histórico de acessos

function selectProxyHost(req) {
    if (req.path.startsWith('/pessoas'))
        return 'http://localhost:8080/';
    else if (req.path.startsWith('/quartos'))
        return 'http://localhost:8081/';
    else if (req.path.startsWith('/senhas'))
        return 'http://localhost:8082/';
    else if (req.path.startsWith('/acessos'))
        return 'http://localhost:8083/';
    else return null;
}

app.use((req, res, next) => {
    var proxyHost = selectProxyHost(req);
    if (proxyHost == null)
        res.status(404).send('Not found');
    else
        httpProxy(proxyHost)(req, res, next);
});

app.listen(8000, () => {
    console.log('API Gateway iniciado!');
});