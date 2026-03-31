import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Btn, Card, Modal, Input, Textarea, PageHeader } from '../components/ui'

const COLORS = ['bg-blue-50 text-blue-700','bg-emerald-50 text-emerald-700','bg-amber-50 text-amber-700','bg-purple-50 text-purple-700','bg-red-50 text-red-700','bg-cyan-50 text-cyan-700']
const EMPTY_CAT = { name:'', icon:'📦', description:'' }

export default function CategoriesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_CAT)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data.data) })
  const cats = data || []

  const openAdd = () => { setForm(EMPTY_CAT); setEditing(null); setModal(true) }
  const openEdit = c => { setEditing(c); setForm({ name:c.name, icon:c.icon||'📦', description:c.description||'' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name) return toast.error('اسم الفئة مطلوب')
    setSaving(true)
    try {
      if (editing) { await api.put(`/categories/${editing.id}`, form); toast.success('تم التحديث') }
      else { await api.post('/categories', form); toast.success('تمت الإضافة') }
      qc.invalidateQueries(['categories'])
      setModal(null)
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ') }
    setSaving(false)
  }

  const handleDelete = async id => {
    if (!confirm('حذف هذه الفئة؟')) return
    try { await api.delete(`/categories/${id}`); toast.success('تم الحذف'); qc.invalidateQueries(['categories']) }
    catch { toast.error('لا يمكن حذف فئة بها وسائل') }
  }

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="🏷️ التصنيفات" subtitle={`${cats.length} فئة`}
        actions={isAdmin && <Btn onClick={openAdd}><Plus size={15} /> إضافة فئة</Btn>} />
      {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((c, i) => {
            const totalQty = (c.assets||[]).reduce((s, a) => s + a.quantity, 0)
            const totalVal = (c.assets||[]).reduce((s, a) => s + a.quantity * a.price, 0)
            return (
              <Card key={c.id} className="p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${COLORS[i % COLORS.length]}`}>{c.icon}</div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(c.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
                <p className="font-bold text-slate-800 text-[15px]">{c.name}</p>
                {c.description && <p className="text-[12px] text-slate-400 mt-0.5">{c.description}</p>}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div><p className="font-bold text-slate-800">{c._count?.assets || 0}</p><p className="text-[10px] text-slate-400">نوع</p></div>
                  <div><p className="font-bold text-slate-800">{totalQty}</p><p className="text-[10px] text-slate-400">قطعة</p></div>
                  <div><p className="font-bold text-blue-700 text-[11px]">{(totalVal/1000).toFixed(0)}K</p><p className="text-[10px] text-slate-400">دج</p></div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)} title={editing ? '✏️ تعديل الفئة' : '🏷️ إضافة فئة'} size="sm"
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn><Btn onClick={handleSave} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} حفظ</Btn></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Input label="الأيقونة" value={form.icon} onChange={set('icon')} className="text-center text-xl" />
            <div className="col-span-2"><Input label="اسم الفئة" required value={form.name} onChange={set('name')} /></div>
          </div>
          <Textarea label="وصف" value={form.description} onChange={set('description')} />
        </div>
      </Modal>
    </div>
  )
}
