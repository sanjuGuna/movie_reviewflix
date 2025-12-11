// middlewares/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header) return res.status(401).json({ message: 'No token provided' });

    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Malformed Authorization header' });

    // Verify and decode token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Token must contain userId + role (Option B requirement)
    req.user = {
      _id: payload.userId,
      role: payload.role
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Invalid Token' });
  }
};

module.exports = auth;
