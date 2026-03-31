import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('مرحباً بك!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'بيانات الدخول غير صحيحة')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(150deg,#0a1628 0%,#0f2040 50%,#162d52 100%)' }}>
      <div className="w-full max-w-[390px]">
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center" style={{ background: 'linear-gradient(135deg,#0a1628,#1a3a6e)' }}>
            <div className="w-[70px] h-[70px] rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 6px 20px rgba(245,158,11,.35)' }}>🏛️</div>
            <h1 className="text-white text-lg font-black">نظام الوسائل العامة</h1>
            <p className="text-blue-300 text-[12px] mt-1">كلية الحقوق والعلوم السياسية</p>
            <p className="text-slate-500 text-[11px] mt-0.5">جامعة محمد البشير الإبراهيمي - برج بوعريريج</p>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">📧 البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={set('email')} required dir="ltr"
                placeholder="example@univ-bba.dz"
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">🔒 كلمة المرور</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required dir="ltr"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pl-10 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-[14px] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#1a56db,#1e40af)', boxShadow: '0 4px 16px rgba(26,86,219,.3)' }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'جارٍ تسجيل الدخول...' : '🔐 دخول إلى النظام'}
            </button>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-500 font-semibold mb-1.5">🎯 حسابات تجريبية</p>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">مسؤول الوسائل:</span>
                <span dir="ltr" className="font-mono text-blue-600 font-bold">masoul@univ-bba.dz</span>
              </div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">مسؤول مكتب:</span>
                <span dir="ltr" className="font-mono text-blue-600 font-bold">doyen@univ-bba.dz</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">كلمة المرور:</span>
                <span dir="ltr" className="font-mono text-slate-700 font-bold">Admin@2025</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
