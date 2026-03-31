// UsersPage.jsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Loader2, Shield, User } from 'lucide-react'
import api from '../utils/api'
import { Btn, Badge, Card, Modal, Input, Select, PageHeader, Table } from '../components/ui'

const ROLE_LABELS = { ADMIN:'👑 مسؤول الوسائل', BUREAU:'🏢 مسؤول مكتب', VIEWER:'👁️ مشاهد' }
const ROLE_COLORS = { ADMIN:'navy', BUREAU:'blue', VIEWER:'slate' }
const EMPTY = { name:'', email:'', password:'', role:'BUREAU', phone:'', officeId:'' }

export default function UsersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data.data) })
  const { data: offsData } = useQuery({ queryKey: ['offices'], queryFn: () => api.get('/offices').then(r => r.data.data) })
  const users = data || []
  const offs = offsData || []

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true) }
  const openEdit = u => { setEditing(u); setForm({ name:u.name, email:u.email, password:'', role:u.role, phone:u.phone||'', officeId:u.office?.id||'' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('الاسم والبريد مطلوبان')
    if (!editing && !form.password) return toast.error('كلمة المرور مطلوبة')
    setSaving(true)
    try {
      const payload = { ...form }
      if (editing && !payload.password) delete payload.password
      if (editing) { await api.put(`/users/${editing.id}`, payload); toast.success('تم التحديث') }
      else { await api.post('/users', payload); toast.success('تمت إضافة المستخدم') }
      qc.invalidateQueries(['users'])
      setModal(null)
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ') }
    setSaving(false)
  }

  const handleDelete = async id => {
    if (!confirm('حذف هذا المستخدم؟')) return
    setDeleting(id)
    try { await api.delete(`/users/${id}`); toast.success('تم الحذف'); qc.invalidateQueries(['users']) }
    catch (err) { toast.error(err.response?.data?.message || 'خطأ') }
    setDeleting(null)
  }

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="👥 إدارة المستخدمين" subtitle={`${users.length} مستخدم مسجل`}
        actions={<Btn onClick={openAdd}><Plus size={15} /> إضافة مستخدم</Btn>} />
      <Card>
        <Table loading={isLoading} empty="لا يوجد مستخدمون" headers={['المستخدم','الدور','المكتب','البريد الإلكتروني','الهاتف','آخر دخول','إجراءات']}>
          {users.map(u => (
            <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              <td>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{u.name[0]}</div>
                  <div><p className="font-semibold text-[13px]">{u.name}</p><p className="text-[11px] text-slate-400">{new Date(u.createdAt).toLocaleDateString('ar-DZ')}</p></div>
                </div>
              </td>
              <td><Badge color={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
              <td className="text-[12px] text-slate-600">{u.office?.name || '—'}</td>
              <td dir="ltr" className="text-[12px] text-slate-500">{u.email}</td>
              <td dir="ltr" className="text-[12px] text-slate-500">{u.phone || '—'}</td>
              <td className="text-[11px] text-slate-400">—</td>
              <td>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(u)} className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100">
                    {deleting === u.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Modal open={!!modal} onClose={() => setModal(null)} title={editing ? '✏️ تعديل المستخدم' : '👤 إضافة مستخدم'} size="md"
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn><Btn onClick={handleSave} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} حفظ</Btn></>}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Input label="الاسم الكامل" required value={form.name} onChange={set('name')} /></div>
          <Input label="البريد الإلكتروني" required type="email" value={form.email} onChange={set('email')} dir="ltr" placeholder="name@univ-bba.dz" />
          <Input label={editing ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'} required={!editing} type="password" value={form.password} onChange={set('password')} dir="ltr" />
          <Select label="الدور" value={form.role} onChange={set('role')}>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="المكتب / المصلحة" value={form.officeId} onChange={set('officeId')}>
            <option value="">بدون مكتب</option>
            {offs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
          <div className="col-span-2"><Input label="رقم الهاتف" value={form.phone} onChange={set('phone')} dir="ltr" placeholder="0551234567" /></div>
        </div>
      </Modal>
    </div>
  )
}
