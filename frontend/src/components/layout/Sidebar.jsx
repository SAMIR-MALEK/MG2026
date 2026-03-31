import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Package, ScanBarcode, ArrowLeftRight,
  ClipboardList, Building2, Tag, Inbox, Send,
  BarChart3, Users, Truck, X, GraduationCap, LogOut
} from 'lucide-react'

const adminNav = [
  { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم', end: true },
  { to: '/assets', icon: Package, label: 'الوسائل والمخزون' },
  { to: '/barcode', icon: ScanBarcode, label: 'الباركود والطباعة' },
  { to: '/movements', icon: ArrowLeftRight, label: 'حركة الوسائل' },
  { to: '/inventory', icon: ClipboardList, label: 'الجرد اليدوي' },
  null, // divider
  { to: '/offices', icon: Building2, label: 'المكاتب والمصالح' },
  { to: '/categories', icon: Tag, label: 'التصنيفات' },
  { to: '/suppliers', icon: Truck, label: 'الموردون' },
  null,
  { to: '/requests', icon: Inbox, label: 'طلبات المصالح', badge: true },
  { to: '/reports', icon: BarChart3, label: 'التقارير' },
  { to: '/users', icon: Users, label: 'المستخدمون' },
]

const bureauNav = [
  { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم', end: true },
  { to: '/assets', icon: Package, label: 'الوسائل' },
  { to: '/my-requests', icon: Send, label: 'طلباتي' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const nav = isAdmin ? adminNav : bureauNav

  const handleLogout = () => { logout(); navigate('/login') }

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : 'text-slate-400 hover:bg-white/8 hover:text-white'
    }`

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 right-0 h-full w-[245px] z-40 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#0a1628' }}>

        {/* Brand */}
        <div className="p-4 border-b border-white/8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>🏛️</div>
              <div>
                <p className="text-white text-[13px] font-bold leading-tight">نظام الوسائل العامة</p>
                <p className="text-slate-500 text-[10px] mt-0.5">كلية الحقوق - UBB</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white"><X size={16} /></button>
          </div>
        </div>

        {/* User */}
        <div className="mx-3 my-3 p-3 rounded-xl border border-white/7" style={{ background: 'rgba(255,255,255,.04)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0] || 'م'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1"></span>
                {isAdmin ? 'مسؤول الوسائل' : 'مسؤول مكتب'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          {nav.map((item, i) => {
            if (!item) return <div key={i} className="my-2 border-t border-white/6" />
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkCls} onClick={onClose}>
                <item.icon size={16} className="flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">!</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/8">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition text-sm">
            <LogOut size={15} /> تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  )
}
