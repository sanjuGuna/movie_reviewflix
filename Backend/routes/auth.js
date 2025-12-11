// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');

const router = express.Router();

// helper to sign access token
const signToken = (user) => {
    return jwt.sign(
        { 
            userId: user._id.toString(),
            role: user.role               // <-- add this
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '1h' }
    );
};



// REGISTER
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      passwordHash,
      role: role === 'owner' ? 'owner' : 'user'
    });

    await user.save();

    // SIGN TOKEN (defensive)
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET missing at signToken time');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    let token;
    try {
      token = signToken(user);
    } catch (err) {
      console.error('Error while signing token:', err);
      return res.status(500).json({ message: 'Token generation failed', error: err.message });
    }

    // return token and basic user info
    res.status(201).json({
      message: 'User registered',
      accessToken: token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    // Log full error and stack to console
    console.error('Register error (full):', err);
    if (err && err.stack) console.error(err.stack);

    // If in development, return err.message to client for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      message: 'Server error',
      ...(isDev ? { error: err.message } : {})
    });
  }
});



// LOGIN
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user);

    // Option A: return token in JSON (common for SPA)
    res.json({
        accessToken: token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, isOwner: user.role === 'owner' }
    });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET current user
// GET /api/auth/me
// requires auth middleware (optional: you can call jwt.verify here too)
const auth = require('../middlewares/auth'); // assuming you created auth middleware
router.get('/me', auth, async (req, res) => {
  try {
    // req.user is set by middleware (id, email, role)
    // return user with isOwner flag for frontend convenience
    res.json({ user: req.user, isOwner: req.user.role === 'owner' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGOUT (if using cookie)
// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // If you set token as HttpOnly cookie
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
    res.json({ message: 'Logged out' });
});

module.exports = router;
