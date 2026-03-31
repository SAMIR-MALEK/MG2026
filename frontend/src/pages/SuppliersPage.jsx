import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { Btn, Card, Modal, Input, Textarea, PageHeader, Table } from '../components/ui'

const EMPTY = { name:'', phone:'', email:'', address:'' }

export default function SuppliersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data, isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get('/suppliers').then(r => r.data.data) })
  const suppliers = data || []

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true) }
  const openEdit = s => { setEditing(s); setForm({ name:s.name, phone:s.phone||'', email:s.email||'', address:s.address||'' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name) return toast.error('اسم المورد مطلوب')
    setSaving(true)
    try {
      if (editing) { await api.put(`/suppliers/${editing.id}`, form); toast.success('تم التحديث') }
      else { await api.post('/suppliers', form); toast.success('تمت الإضافة') }
      qc.invalidateQueries(['suppliers'])
      setModal(null)
    } catch { toast.error('خطأ') }
    setSaving(false)
  }

  const handleDelete = async id => {
    if (!confirm('حذف هذا المورد؟')) return
    try { await api.delete(`/suppliers/${id}`); toast.success('تم الحذف'); qc.invalidateQueries(['suppliers']) }
    catch { toast.error('لا يمكن حذف مورد له وسائل') }
  }

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="🚚 الموردون" subtitle={`${suppliers.length} مورد مسجل`}
        actions={<Btn onClick={openAdd}><Plus size={15} /> إضافة مورد</Btn>} />
      <Card>
        <Table loading={isLoading} empty="لا يوجد موردون" headers={['اسم المورد','الهاتف','البريد','العنوان','عدد الوسائل','إجراءات']}>
          {suppliers.map(s => (
            <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              <td><p className="font-semibold text-[13px]">{s.name}</p></td>
              <td dir="ltr" className="text-[12px] text-slate-600">{s.phone || '—'}</td>
              <td dir="ltr" className="text-[12px] text-slate-500">{s.email || '—'}</td>
              <td className="text-[12px] text-slate-600">{s.address || '—'}</td>
              <td><span className="font-bold">{s._count?.assets || 0}</span></td>
              <td>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100"><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Modal open={!!modal} onClose={() => setModal(null)} title={editing ? '✏️ تعديل المورد' : '🚚 إضافة مورد'} size="sm"
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn><Btn onClick={handleSave} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} حفظ</Btn></>}>
        <div className="space-y-3">
          <Input label="اسم المورد" required value={form.name} onChange={set('name')} />
          <Input label="الهاتف" value={form.phone} onChange={set('phone')} dir="ltr" />
          <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={set('email')} dir="ltr" />
          <Textarea label="العنوان" value={form.address} onChange={set('address')} />
        </div>
      </Modal>
    </div>
  )
}
