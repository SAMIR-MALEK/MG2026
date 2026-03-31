import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Btn, Badge, Card, Modal, Select, Textarea, PageHeader, Alert } from '../components/ui'
import { Plus, Loader2 } from 'lucide-react'

export default function InventoryPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ officeId: '', notes: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => api.get('/inventory').then(r => r.data.data) })
  const { data: offsData } = useQuery({ queryKey: ['offices'], queryFn: () => api.get('/offices').then(r => r.data.data) })
  const invs = data || []
  const offs = offsData || []

  const handleCreate = async () => {
    if (!form.officeId) return toast.error('يرجى اختيار الموقع')
    setSaving(true)
    try {
      const { data: res } = await api.post('/inventory', form)
      toast.success(res.message)
      qc.invalidateQueries(['inventory'])
      setModal(false)
      navigate(`/inventory/${res.data.id}`)
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ') }
    setSaving(false)
  }

  const STATUS_LABEL = { OPEN: ['gold','🔓 مفتوح'], CLOSED: ['green','✅ مكتمل'] }

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="📋 الجرد اليدوي" subtitle="مسؤول الوسائل يفتح ورقة الجرد ويملأ الكميات الفعلية يدوياً لكل موقع"
        actions={<Btn onClick={() => setModal(true)}><Plus size={15} /> فتح ورقة جرد</Btn>} />

      <Alert type="info">
        <strong>كيفية الجرد:</strong> افتح ورقة جرد لموقع محدد، ثم أدخل الكميات الفعلية التي وجدتها لكل وسيلة. سيحسب النظام الفروق تلقائياً.
      </Alert>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {invs.map(inv => {
            const [color, label] = STATUS_LABEL[inv.status] || ['slate', inv.status]
            return (
              <Card key={inv.id}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${inv.status === 'CLOSED' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      {inv.status === 'CLOSED' ? '✅' : '📋'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">{inv.reference}</span>
                        <p className="font-bold text-slate-800">{inv.office?.name}</p>
                      </div>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {new Date(inv.date).toLocaleDateString('ar-DZ')} · {inv.user?.name} · {inv._count?.items} صنف
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={color}>{label}</Badge>
                    <Btn variant={inv.status === 'OPEN' ? 'primary' : 'ghost'} size="sm" onClick={() => navigate(`/inventory/${inv.id}`)}>
                      {inv.status === 'OPEN' ? '▶ متابعة الجرد' : '👁️ عرض التقرير'}
                    </Btn>
                  </div>
                </div>
              </Card>
            )
          })}
          {!invs.length && (
            <Card><div className="text-center py-14">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-slate-500 font-semibold">لا توجد ورقات جرد بعد</p>
              <p className="text-slate-400 text-sm mt-1">اضغط "فتح ورقة جرد" للبدء</p>
            </div></Card>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="📋 فتح ورقة جرد جديدة" size="sm"
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>إلغاء</Btn><Btn onClick={handleCreate} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} فتح</Btn></>}>
        <div className="space-y-3">
          <Select label="الموقع المراد جرده" required value={form.officeId} onChange={set('officeId')}>
            <option value="">اختر الموقع</option>
            {offs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-slate-600">تاريخ الجرد</label>
            <input type="date" value={form.date} onChange={set('date')} className="px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500" />
          </div>
          <Textarea label="ملاحظات" value={form.notes} onChange={set('notes')} placeholder="اختياري..." />
        </div>
      </Modal>
    </div>
  )
}
