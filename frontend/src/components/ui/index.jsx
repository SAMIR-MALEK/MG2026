// ─── BUTTON ─────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5',
    gold: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20 hover:-translate-y-0.5',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 hover:-translate-y-0.5',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    ghost: 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  }
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>{children}</button>
}

// ─── BADGE ──────────────────────────────────────────────────────
export function Badge({ children, color = 'slate' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700', green: 'bg-emerald-100 text-emerald-700',
    gold: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700', orange: 'bg-orange-100 text-orange-700',
    slate: 'bg-slate-100 text-slate-600', navy: 'bg-blue-900 text-blue-200',
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[color]}`}>{children}</span>
}

// ─── CARD ────────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
}

// ─── STAT CARD ───────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'blue', trend }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    gold: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  }
  const accent = { blue: 'bg-blue-600', green: 'bg-emerald-600', gold: 'bg-amber-500', red: 'bg-red-600' }
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 relative overflow-hidden hover:shadow-md transition-shadow`}>
      <div className={`absolute top-0 right-0 w-1 h-full rounded-r-2xl ${accent[color]}`} />
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${colors[color]}`}>{icon}</div>
        {trend && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${trend.up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{trend.label}</span>}
      </div>
      <p className="text-3xl font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[12px] text-slate-500 mt-1.5 font-medium">{label}</p>
    </div>
  )
}

// ─── INPUT ───────────────────────────────────────────────────────
export function Input({ label, required, hint, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[12px] font-semibold text-slate-600">{label}{required && <span className="text-red-500 mr-0.5">*</span>}</label>}
      <input className={`px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition bg-white ${className}`} {...props} />
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

// ─── SELECT ──────────────────────────────────────────────────────
export function Select({ label, required, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[12px] font-semibold text-slate-600">{label}{required && <span className="text-red-500 mr-0.5">*</span>}</label>}
      <select className={`px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition bg-white appearance-none cursor-pointer ${className}`} {...props}>{children}</select>
    </div>
  )
}

// ─── TEXTAREA ────────────────────────────────────────────────────
export function Textarea({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[12px] font-semibold text-slate-600">{label}</label>}
      <textarea className={`px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition bg-white resize-none min-h-[70px] ${className}`} {...props} />
    </div>
  )
}

// ─── MODAL ───────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl w-full ${sizes[size]} max-h-[92vh] overflow-y-auto shadow-2xl scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition text-lg">✕</button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  )
}

// ─── TABLE ───────────────────────────────────────────────────────
export function Table({ headers, children, loading, empty = 'لا توجد بيانات' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead><tr className="bg-slate-50 border-b border-slate-200">{headers.map((h, i) => <th key={i} className="text-right px-4 py-3 text-[11px] font-700 text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={headers.length} className="text-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : !children || (Array.isArray(children) && children.length === 0) ? (
            <tr><td colSpan={headers.length} className="text-center py-12 text-slate-400 text-sm">{empty}</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  )
}

// ─── ALERT ───────────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }
  const icons = { info: 'ℹ️', warn: '⚠️', success: '✅', error: '❌' }
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-[13px] ${styles[type]}`}>
      <span>{icons[type]}</span><div>{children}</div>
    </div>
  )
}

// ─── PAGE HEADER ─────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-black text-slate-800">{title}</h1>
        {subtitle && <p className="text-slate-500 text-[13px] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

// ─── CONDITION BADGE ─────────────────────────────────────────────
export function CondBadge({ cond }) {
  const m = { GOOD: ['green','جيد'], FAIR: ['gold','مقبول'], POOR: ['orange','رديء'], DAMAGED: ['red','تالف'], DISPOSED: ['slate','متلَف'] }
  const [color, label] = m[cond] || ['slate', cond]
  return <Badge color={color}>{label}</Badge>
}

// ─── SEARCH BAR ──────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'بحث...', className = '' }) {
  return (
    <div className={`flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition ${className}`}>
      <span className="text-slate-400">🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] outline-none text-slate-700 placeholder:text-slate-400" />
      {value && <button onClick={() => onChange('')} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>}
    </div>
  )
}
