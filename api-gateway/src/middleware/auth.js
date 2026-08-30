/**
 * JWT Authentication Middleware & Handlers for the API Gateway.
 *
 * In a production app these would verify against a real user database.
 * Here they use an in-memory store and JWT tokens for demonstration.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'safar-secret-key-2026';
const TOKEN_EXPIRY = '24h';

// ── In-memory user store (demo purposes) ───────────────────────────────
const users = [
  { id: 1, name: 'System Admin', email: 'admin@safar.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Demo Traveler', email: 'traveler@safar.com', password: 'password123', role: 'traveler' },
  { id: 3, name: 'Demo Agency', email: 'agency@safar.com', password: 'password123', role: 'agency' },
];
let nextId = 4;

// ── Middleware: Verify JWT Token ───────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// ── Handler: Login ─────────────────────────────────────────────────────
function loginHandler(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

// ── Handler: Register ──────────────────────────────────────────────────
function registerHandler(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const newUser = { id: nextId++, name, email, password, role: role || 'traveler' };
  users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return res.status(201).json({
    success: true,
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
  });
}

module.exports = { authMiddleware, loginHandler, registerHandler };
