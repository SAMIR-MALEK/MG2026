require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 تهيئة قاعدة البيانات...\n');

  // ─── CATEGORIES ───────────────────────────────
  const cats = await Promise.all([
    prisma.category.upsert({ where: { name: 'أثاث' }, update: {}, create: { name: 'أثاث', icon: '🪑', description: 'طاولات وكراسي وخزائن' } }),
    prisma.category.upsert({ where: { name: 'أجهزة إلكترونية' }, update: {}, create: { name: 'أجهزة إلكترونية', icon: '💻', description: 'حواسيب وطابعات وشاشات' } }),
    prisma.category.upsert({ where: { name: 'مستلزمات مكتبية' }, update: {}, create: { name: 'مستلزمات مكتبية', icon: '📎', description: 'أقلام وورق وأدوات' } }),
    prisma.category.upsert({ where: { name: 'أجهزة تعليمية' }, update: {}, create: { name: 'أجهزة تعليمية', icon: '📽️', description: 'بروجكتورات وسبورات ذكية' } }),
    prisma.category.upsert({ where: { name: 'معدات أمن' }, update: {}, create: { name: 'معدات أمن', icon: '📷', description: 'كاميرات وأجهزة مراقبة' } }),
    prisma.category.upsert({ where: { name: 'أجهزة كهربائية' }, update: {}, create: { name: 'أجهزة كهربائية', icon: '❄️', description: 'مكيفات وأجهزة تكييف' } }),
  ]);
  console.log('✅ الفئات:', cats.length);

  // ─── OFFICES ──────────────────────────────────
  const offices = await Promise.all([
    prisma.office.create({ data: { name: 'المخزن الرئيسي', type: 'STORAGE', floor: 'الطابق 0', room: 'مستودع رقم 1' } }),
    prisma.office.create({ data: { name: 'مكتب العميد', type: 'BUREAU', floor: 'الطابق 1', room: 'مكتب 101' } }),
    prisma.office.create({ data: { name: 'مكتب نائب العميد', type: 'BUREAU', floor: 'الطابق 1', room: 'مكتب 102' } }),
    prisma.office.create({ data: { name: 'الأمانة العامة', type: 'SERVICE', floor: 'الطابق 0', room: 'مكتب 005' } }),
    prisma.office.create({ data: { name: 'مصلحة التدريس', type: 'SERVICE', floor: 'الطابق 1', room: 'مكتب 110' } }),
    prisma.office.create({ data: { name: 'مصلحة الشؤون الاجتماعية', type: 'SERVICE', floor: 'الطابق 1', room: 'مكتب 115' } }),
    prisma.office.create({ data: { name: 'قاعة المحاضرات 1', type: 'HALL', floor: 'الطابق 0', room: 'مبنى أ' } }),
    prisma.office.create({ data: { name: 'قاعة المحاضرات 2', type: 'HALL', floor: 'الطابق 0', room: 'مبنى أ' } }),
    prisma.office.create({ data: { name: 'قاعة المحاضرات 3', type: 'HALL', floor: 'الطابق 1', room: 'مبنى ب' } }),
    prisma.office.create({ data: { name: 'المكتبة', type: 'LIBRARY', floor: 'الطابق 1', room: 'مبنى ب' } }),
    prisma.office.create({ data: { name: 'قاعة الحاسوب', type: 'LAB', floor: 'الطابق 2', room: 'مبنى ج' } }),
    prisma.office.create({ data: { name: 'مصلحة الوسائل العامة', type: 'SERVICE', floor: 'الطابق 0', room: 'مكتب 001' } }),
  ]);
  console.log('✅ المكاتب:', offices.length);

  // ─── USERS ────────────────────────────────────
  const adminPw = await bcrypt.hash('Admin@2025', 12);
  const bureaupw = await bcrypt.hash('Bureau@2025', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'masoul@univ-bba.dz' }, update: {},
    create: { name: 'أمين بن علي', email: 'masoul@univ-bba.dz', password: adminPw, role: 'ADMIN', phone: '0551234567', officeId: offices[11].id }
  });
  await prisma.user.upsert({
    where: { email: 'doyen@univ-bba.dz' }, update: {},
    create: { name: 'الأستاذ كمال مسعود', email: 'doyen@univ-bba.dz', password: bureaupw, role: 'BUREAU', phone: '0559876543', officeId: offices[1].id }
  });
  await prisma.user.upsert({
    where: { email: 'vice@univ-bba.dz' }, update: {},
    create: { name: 'الأستاذ سليم حمزة', email: 'vice@univ-bba.dz', password: bureaupw, role: 'BUREAU', phone: '0554433221', officeId: offices[2].id }
  });
  await prisma.user.upsert({
    where: { email: 'secretariat@univ-bba.dz' }, update: {},
    create: { name: 'نور الهدى بكاي', email: 'secretariat@univ-bba.dz', password: bureaupw, role: 'BUREAU', phone: '0556677889', officeId: offices[3].id }
  });
  await prisma.user.upsert({
    where: { email: 'teaching@univ-bba.dz' }, update: {},
    create: { name: 'الأستاذة سامية قاسمي', email: 'teaching@univ-bba.dz', password: bureaupw, role: 'BUREAU', phone: '0558899001', officeId: offices[4].id }
  });
  console.log('✅ المستخدمون');

  // ─── SUPPLIER ─────────────────────────────────
  const supplier = await prisma.supplier.create({
    data: { name: 'مؤسسة النور للتوريدات', phone: '0553344556', address: 'برج بوعريريج' }
  });

  // ─── ASSETS ───────────────────────────────────
  const year = new Date().getFullYear();
  const assetDefs = [
    { name: 'حاسوب مكتبي HP ProDesk 400', cat: 1, office: 0, qty: 15, min: 2, price: 65000, cond: 'GOOD', serial: 'SN-HP-PRO-001' },
    { name: 'حاسوب مكتبي Dell OptiPlex', cat: 1, office: 0, qty: 8, min: 2, price: 72000, cond: 'GOOD', serial: 'SN-DELL-001' },
    { name: 'طاولة مكتب خشبية', cat: 0, office: 0, qty: 12, min: 2, price: 12000, cond: 'GOOD', serial: '' },
    { name: 'كرسي مكتب دوار', cat: 0, office: 0, qty: 20, min: 3, price: 8500, cond: 'GOOD', serial: '' },
    { name: 'كرسي زوار', cat: 0, office: 0, qty: 30, min: 5, price: 4500, cond: 'GOOD', serial: '' },
    { name: 'بروجكتور Epson EB-X41', cat: 3, office: 6, qty: 2, min: 1, price: 45000, cond: 'FAIR', serial: 'SN-EPS-003' },
    { name: 'بروجكتور BenQ MH535', cat: 3, office: 7, qty: 1, min: 1, price: 55000, cond: 'GOOD', serial: 'SN-BNQ-001' },
    { name: 'طابعة ليزر HP LaserJet Pro', cat: 1, office: 3, qty: 3, min: 1, price: 28000, cond: 'POOR', serial: 'SN-HP-LJ-07' },
    { name: 'لوح ذكي تفاعلي 75 بوصة', cat: 3, office: 8, qty: 1, min: 1, price: 150000, cond: 'GOOD', serial: 'SN-SM-001' },
    { name: 'مكيف هواء IRIS 18000 BTU', cat: 5, office: 1, qty: 2, min: 1, price: 85000, cond: 'GOOD', serial: '' },
    { name: 'مكيف هواء IRIS 24000 BTU', cat: 5, office: 6, qty: 3, min: 1, price: 110000, cond: 'GOOD', serial: '' },
    { name: 'كاميرا مراقبة IP Hikvision', cat: 4, office: 0, qty: 8, min: 2, price: 15000, cond: 'GOOD', serial: '' },
    { name: 'خزانة ملفات معدنية 4 أدراج', cat: 0, office: 3, qty: 4, min: 1, price: 18000, cond: 'GOOD', serial: '' },
    { name: 'لاب توب Dell Inspiron 15', cat: 1, office: 4, qty: 3, min: 1, price: 95000, cond: 'GOOD', serial: 'SN-DELL-LT-01' },
    { name: 'شاشة حاسوب LG 24 بوصة', cat: 1, office: 0, qty: 10, min: 2, price: 22000, cond: 'GOOD', serial: '' },
    { name: 'ورق A4 (رزمة 500 ورقة)', cat: 2, office: 0, qty: 3, min: 10, price: 400, cond: 'GOOD', serial: '' },
    { name: 'أقلام حبر (علبة 12)', cat: 2, office: 3, qty: 2, min: 5, price: 350, cond: 'GOOD', serial: '' },
    { name: 'حبر طابعة أسود', cat: 2, office: 3, qty: 1, min: 3, price: 1800, cond: 'GOOD', serial: '' },
    { name: 'دباسة مكتبية كبيرة', cat: 2, office: 0, qty: 6, min: 2, price: 800, cond: 'GOOD', serial: '' },
    { name: 'جهاز سكانر HP ScanJet', cat: 1, office: 4, qty: 1, min: 1, price: 35000, cond: 'GOOD', serial: 'SN-HP-SCN-01' },
    { name: 'طاولة اجتماعات 10 أشخاص', cat: 0, office: 1, qty: 1, min: 1, price: 45000, cond: 'GOOD', serial: '' },
    { name: 'لوح أبيض مغناطيسي 120×90', cat: 3, office: 0, qty: 5, min: 1, price: 6500, cond: 'GOOD', serial: '' },
    { name: 'جهاز UPS 1500VA', cat: 1, office: 0, qty: 4, min: 1, price: 25000, cond: 'GOOD', serial: '' },
    { name: 'سلة مهملات معدنية', cat: 0, office: 0, qty: 15, min: 3, price: 600, cond: 'GOOD', serial: '' },
    { name: 'موسعة طاقة 6 مخارج', cat: 1, office: 0, qty: 10, min: 2, price: 1200, cond: 'GOOD', serial: '' },
  ];

  for (let i = 0; i < assetDefs.length; i++) {
    const d = assetDefs[i];
    const invNumber = `UBB-${year}-${String(i + 1).padStart(3, '0')}`;
    await prisma.asset.create({
      data: {
        invNumber, name: d.name, quantity: d.qty, minQuantity: d.min,
        price: d.price, condition: d.cond, hasBarcode: d.price > 500,
        serialNumber: d.serial || null, unit: 'قطعة',
        categoryId: cats[d.cat].id, officeId: offices[d.office].id,
        supplierId: supplier.id, purchaseDate: new Date('2024-09-01')
      }
    });
  }
  console.log('✅ الوسائل:', assetDefs.length);

  // ─── SAMPLE REQUEST ───────────────────────────
  const bureauUser = await prisma.user.findUnique({ where: { email: 'doyen@univ-bba.dz' } });
  const storage = await prisma.office.findFirst({ where: { type: 'STORAGE' } });
  await prisma.request.create({
    data: {
      reference: `#RQ-${year}-001`,
      toOfficeId: storage.id,
      requesterId: bureauUser.id,
      priority: 'HIGH',
      reason: 'نحتاج هذه الوسائل لاجتماع اللجنة العلمية',
      status: 'PENDING',
      items: {
        create: [
          { itemName: 'كرسي زوار', quantity: 5, notes: '' },
          { itemName: 'طاولة اجتماعات', quantity: 1, notes: 'مقاس كبير' }
        ]
      }
    }
  });
  console.log('✅ الطلبات النموذجية');

  console.log('\n══════════════════════════════════════════');
  console.log('🎉 تمت تهيئة قاعدة البيانات بنجاح!');
  console.log('══════════════════════════════════════════');
  console.log('📧 مسؤول الوسائل: masoul@univ-bba.dz');
  console.log('🔑 كلمة المرور:    Admin@2025');
  console.log('──────────────────────────────────────────');
  console.log('📧 مسؤول مكتب:    doyen@univ-bba.dz');
  console.log('🔑 كلمة المرور:    Bureau@2025');
  console.log('══════════════════════════════════════════\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
