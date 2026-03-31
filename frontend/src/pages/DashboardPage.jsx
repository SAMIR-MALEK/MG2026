import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../utils/api'
import { StatCard, Card, Badge, Alert } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#1a56db','#059669','#f59e0b','#7c3aed','#dc2626','#06b6d4']
const TX_LABELS = { PURCHASE:'شراء', DISTRIBUTE:'توزيع', TRANSFER:'تحويل', RETURN:'إرجاع', DISPOSAL:'إتلاف' }
const TX_COLORS = { PURCHASE:'green', DISTRIBUTE:'blue', TRANSFER:'purple', RETURN:'gold', DISPOSAL:'red' }

export default function DashboardPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/dashboard').then(r => r.data.data) })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const d = data || {}
  const s = d.stats || {}

  return (
    <div className="space-y-5 fade-up">
      {isAdmin && s.pendingRequests > 0 && (
        <Alert type="warn">
          <strong>{s.pendingRequests} طلب جديد</strong> تنتظر المراجعة من مصالح الكلية —{' '}
          <button onClick={() => navigate('/requests')} className="underline font-bold">مراجعة الطلبات ←</button>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي أنواع الوسائل" value={s.totalAssets ?? 0} icon="📦" color="blue" trend={{ label: '↑ نشط', up: true }} />
        <StatCard label="إجمالي الكميات" value={s.totalQuantity?.toLocaleString('ar') ?? 0} icon="📊" color="green" />
        <StatCard label="المكاتب والمصالح" value={s.totalOffices ?? 0} icon="🏢" color="gold" />
        <StatCard label="طلبات قيد الانتظار" value={s.pendingRequests ?? 0} icon="📨" color="red" trend={s.pendingRequests > 0 ? { label: 'تحتاج تدخل', up: false } : undefined} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '📦', label: 'إضافة وسيلة', to: '/assets', admin: true },
          { icon: '▦', label: 'طباعة الباركود', to: '/barcode', admin: true },
          { icon: '📨', label: 'مراجعة الطلبات', to: '/requests', admin: true },
          { icon: '📋', label: 'فتح ورقة جرد', to: '/inventory', admin: true },
        ].filter(q => !q.admin || isAdmin).map(q => (
          <button key={q.to} onClick={() => navigate(q.to)}
            className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-0.5 transition-all shadow-sm">
            <div className="text-3xl mb-2">{q.icon}</div>
            <p className="text-[12px] font-semibold text-slate-600">{q.label}</p>
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-700 text-[14px]">📊 الوسائل حسب الفئة</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.categoryStats || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'IBM Plex Sans Arabic' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: 'IBM Plex Sans Arabic', fontSize: 12, borderRadius: 10 }}
                  formatter={(v, n) => [v, n === 'totalQty' ? 'الكمية' : 'الأنواع']} />
                <Bar dataKey="totalQty" name="الكمية" fill="#1a56db" radius={[5, 5, 0, 0]} />
                <Bar dataKey="count" name="الأنواع" fill="#93c5fd" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-700 text-[14px]">🥧 توزيع الفئات</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={d.categoryStats || []} dataKey="totalQty" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {(d.categoryStats || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'IBM Plex Sans Arabic', fontSize: 12, borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-700 text-[14px]">🔄 آخر حركات الوسائل</h2>
          </div>
          <div>
            {(d.recentMovements || []).slice(0, 6).map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Badge color={TX_COLORS[m.type]}>{TX_LABELS[m.type]}</Badge>
                  <span className="text-[13px] text-slate-700 truncate">{m.asset?.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-slate-800 text-[13px]">{m.quantity}</span>
                  <p className="text-[11px] text-slate-400">{m.user?.name}</p>
                </div>
              </div>
            ))}
            {!(d.recentMovements?.length) && <p className="text-center py-8 text-slate-400 text-sm">لا توجد حركات بعد</p>}
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-700 text-[14px]">⚠️ وسائل مخزونها منخفض</h2>
          </div>
          <div>
            {(d.lowStock || []).map(a => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">{a.name}</p>
                  <p className="text-[11px] text-slate-400">{a.office?.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-red-600 font-black text-[16px]">{a.quantity}</span>
                  <p className="text-[10px] text-slate-400">الأدنى: {a.minQuantity}</p>
                </div>
              </div>
            ))}
            {!(d.lowStock?.length) && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-slate-400 text-sm">المخزون في مستوى جيد</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
