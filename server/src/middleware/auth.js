const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ data: null, error: 'Authentication required' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    if (decoded.email) req.user.email = decoded.email;
    if (decoded.name) req.user.name = decoded.name;
    next();
  } catch {
    return res.status(401).json({ data: null, error: 'Invalid or expired token' });
  }
};

module.exports = auth;
