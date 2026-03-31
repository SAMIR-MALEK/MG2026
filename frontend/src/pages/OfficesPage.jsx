import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Btn, Badge, Card, Modal, Input, Select, Textarea, PageHeader } from '../components/ui'

const TYPE_LABELS = { STORAGE:'🏪 مخزن', BUREAU:'🖥️ مكتب إداري', SERVICE:'⚙️ مصلحة', HALL:'🎓 قاعة', LAB:'💻 مختبر', LIBRARY:'📚 مكتبة' }
const TYPE_COLORS = { STORAGE:'gold', BUREAU:'blue', SERVICE:'purple', HALL:'green', LAB:'orange', LIBRARY:'slate' }
const EMPTY = { name:'', type:'BUREAU', floor:'', room:'', phone:'', description:'' }

export default function OfficesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data, isLoading } = useQuery({ queryKey: ['offices'], queryFn: () => api.get('/offices').then(r => r.data.data) })
  const offices = data || []

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true) }
  const openEdit = o => { setEditing(o); setForm({ name:o.name, type:o.type, floor:o.floor||'', room:o.room||'', phone:o.phone||'', description:o.description||'' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name) return toast.error('اسم المكتب مطلوب')
    setSaving(true)
    try {
      if (editing) { await api.put(`/offices/${editing.id}`, form); toast.success('تم تحديث المكتب') }
      else { await api.post('/offices', form); toast.success('تمت إضافة المكتب') }
      qc.invalidateQueries(['offices'])
      setModal(null)
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ') }
    setSaving(false)
  }

  const handleDelete = async id => {
    if (!confirm('حذف هذا المكتب؟')) return
    setDeleting(id)
    try { await api.delete(`/offices/${id}`); toast.success('تم الحذف'); qc.invalidateQueries(['offices']) }
    catch (err) { toast.error(err.response?.data?.message || 'لا يمكن الحذف') }
    setDeleting(null)
  }

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="🏢 المكاتب والمصالح" subtitle={`${offices.length} موقع مسجل — حصر كامل مع مسؤولي كل مكتب`}
        actions={isAdmin && <Btn onClick={openAdd}><Plus size={15} /> إضافة مكتب</Btn>} />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offices.map(o => (
            <Card key={o.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4" style={{ background: 'linear-gradient(135deg,#0a1628,#162d52)' }}>
                <div className="flex items-start justify-between mb-2">
                  <Badge color={TYPE_COLORS[o.type] || 'slate'}>{TYPE_LABELS[o.type] || o.type}</Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(o)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition"><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(o.id)} disabled={deleting === o.id} className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-300 hover:bg-red-500/30 transition">
                        {deleting === o.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-white font-bold text-[15px] mt-2">{o.name}</p>
                {o.floor && <p className="text-blue-300 text-[12px] mt-1">📍 {o.floor}{o.room ? ` — ${o.room}` : ''}</p>}
              </div>
              <div className="p-4 space-y-2">
                {o.users?.length > 0 && (
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5">المسؤولون</p>
                    {o.users.map(u => (
                      <div key={u.id} className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{u.name[0]}</div>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-700">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-[12px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500">عدد الوسائل</span>
                  <span className="font-bold text-slate-800">{o._count?.assets || 0}</span>
                </div>
                {o.phone && <div className="flex justify-between text-[12px]"><span className="text-slate-500">الهاتف</span><span dir="ltr" className="font-mono text-slate-700">{o.phone}</span></div>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={editing ? '✏️ تعديل المكتب' : '🏢 إضافة مكتب / مصلحة'} size="md"
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn><Btn onClick={handleSave} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} حفظ</Btn></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Input label="اسم المكتب / المصلحة" required value={form.name} onChange={set('name')} placeholder="مثال: مكتب العميد" /></div>
            <Select label="النوع" value={form.type} onChange={set('type')}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Input label="رقم الهاتف" value={form.phone} onChange={set('phone')} dir="ltr" placeholder="0551234567" />
            <Input label="الطابق" value={form.floor} onChange={set('floor')} placeholder="الطابق 1" />
            <Input label="رقم الغرفة" value={form.room} onChange={set('room')} placeholder="غرفة 101" />
            <div className="col-span-2"><Textarea label="ملاحظات" value={form.description} onChange={set('description')} /></div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
