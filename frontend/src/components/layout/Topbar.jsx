import { Menu, Bell, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const titles = {
  '/': 'لوحة التحكم', '/assets': 'الوسائل والمخزون', '/barcode': 'الباركود والطباعة',
  '/movements': 'حركة الوسائل', '/inventory': 'الجرد اليدوي', '/offices': 'المكاتب والمصالح',
  '/categories': 'التصنيفات', '/suppliers': 'الموردون', '/requests': 'طلبات المصالح',
  '/my-requests': 'طلباتي', '/reports': 'التقارير', '/users': 'المستخدمون',
}

export default function Topbar({ onMenu }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drop, setDrop] = useState(false)
  const title = titles[location.pathname] || titles[Object.keys(titles).find(k => location.pathname.startsWith(k) && k !== '/') || '/']

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="h-[58px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Menu size={18} />
        </button>
        <div>
          <p className="font-bold text-slate-800 text-[15px]">{title}</p>
          <p className="text-slate-400 text-[11px] hidden sm:block">نظام الوسائل العامة ← كلية الحقوق ← جامعة برج بوعريريج</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>
        <div className="relative">
          <button onClick={() => setDrop(!drop)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0] || 'م'}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[13px] font-semibold text-slate-700 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400">{isAdmin ? 'مسؤول الوسائل' : 'مسؤول مكتب'}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {drop && (
            <div className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[13px] font-semibold text-slate-700">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition">
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
