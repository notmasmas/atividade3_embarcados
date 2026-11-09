const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'Token não foi enviado' });
  }

  const tokenWithoutBearer = token.split(' ')[1]; // Tirando o 'Bearer: ' do token

  jwt.verify(tokenWithoutBearer, '12345', (err, decoded) => { 
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;