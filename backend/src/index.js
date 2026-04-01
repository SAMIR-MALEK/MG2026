require('dotenv').config();
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ─── ROUTES ──────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/assets',      require('./routes/assets'));
app.use('/api/categories',  require('./routes/categories'));
app.use('/api/offices',     require('./routes/offices'));
app.use('/api/movements',   require('./routes/movements'));
app.use('/api/inventory',   require('./routes/inventory'));
app.use('/api/requests',    require('./routes/requests'));
app.use('/api/suppliers',   require('./routes/suppliers'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/reports',     require('./routes/reports'));

// ─── HEALTH CHECK ────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ ok: true, message: 'نظام الوسائل العامة - يعمل بشكل صحيح', timestamp: new Date() });
});


app.get('/api/setup', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('admin', 10);
  await prisma.user.deleteMany();
  await prisma.user.create({
    data: { id: 'usr1', name: 'مدير النظام', email: 'admin@univ-bba.dz', password: hash, role: 'ADMIN', officeId: 'off9' }
  });
  res.json({ ok: true, message: 'تم إنشاء المستخدم', email: 'admin@univ-bba.dz', password: 'admin' });
});

// ─── 404 ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'المسار غير موجود' });
});




// ─── ERROR HANDLER ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ خطأ:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'خطأ داخلي في الخادم'
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📡 البيئة: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS مفعّل لـ: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});
