import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Btn, Badge, Card, Modal, Select, Textarea, PageHeader, Alert } from '../components/ui'

const STATUS_LABELS = { PENDING:'⏳ قيد المراجعة', REVIEWING:'🔍 قيد الدراسة', APPROVED:'✅ موافق — جاهز للاستلام', REJECTED:'❌ مرفوض', DELIVERED:'📦 تم الاستلام' }
const STATUS_COLORS = { PENDING:'gold', REVIEWING:'blue', APPROVED:'green', REJECTED:'red', DELIVERED:'slate' }
const PRIORITY_LABELS = { LOW:'منخفض', NORMAL:'عادي', HIGH:'⚡ عاجل', URGENT:'🚨 طارئ' }
const EMPTY_REQ = { priority: 'NORMAL', reason: '', items: [{ name: '', qty: 1 }] }

export default function MyRequestsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_REQ)
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => api.get('/requests').then(r => r.data.data)
  })
  const { data: offsData } = useQuery({ queryKey: ['offices'], queryFn: () => api.get('/offices').then(r => r.data.data) })
  const requests = data || []
  const offs = (offsData || []).filter(o => o.type === 'STORAGE')

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name: '', qty: 1 }] }))
  const removeItem = i => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, k, v) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [k]: v } : item) }))

  const handleSubmit = async () => {
    const validItems = form.items.filter(i => i.name.trim())
    if (!validItems.length) return toast.error('يرجى إضافة وسيلة واحدة على الأقل')
    setSaving(true)
    try {
      const toOfficeId = offs[0]?.id || ''
      if (!toOfficeId) return toast.error('لا يوجد مخزن مسجل في النظام')
      const { data: res } = await api.post('/requests', {
        toOfficeId,
        priority: form.priority,
        reason: form.reason,
        items: validItems.map(i => ({ name: i.name, qty: Number(i.qty) }))
      })
      toast.success(res.message)
      qc.invalidateQueries(['my-requests'])
      setModal(false)
      setForm(EMPTY_REQ)
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ في إرسال الطلب') }
    setSaving(false)
  }

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="📤 طلباتي" subtitle="إرسال ومتابعة طلبات الوسائل الخاصة بمكتبك"
        actions={<Btn onClick={() => setModal(true)}><Plus size={15} /> طلب جديد</Btn>} />

      <Alert type="info">
        أرسل طلبك وستتلقى إشعاراً فور الموافقة مع تحديد <strong>موعد ومكان الاستلام</strong> من قبل مسؤول الوسائل.
      </Alert>

      {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {requests.map(req => (
            <Card key={req.id} className={`overflow-hidden ${req.status === 'APPROVED' ? 'border-r-4 border-r-emerald-400' : req.status === 'REJECTED' ? 'border-r-4 border-r-red-400' : ''}`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">{req.reference}</span>
                      <Badge color={req.priority === 'HIGH' || req.priority === 'URGENT' ? 'orange' : 'slate'}>{PRIORITY_LABELS[req.priority]}</Badge>
                    </div>
                    <p className="text-[12px] text-slate-400">{new Date(req.createdAt).toLocaleDateString('ar-DZ')}</p>
                  </div>
                  <Badge color={STATUS_COLORS[req.status]}>{STATUS_LABELS[req.status]}</Badge>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-3">
                  {req.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-[12px] py-1.5 border-b border-slate-100 last:border-0">
                      <span>{item.itemName}</span><span className="font-bold">× {item.quantity}</span>
                    </div>
                  ))}
                </div>

                {req.status === 'APPROVED' && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 text-[12px] text-emerald-800">
                    ✅ <strong>تمت الموافقة!</strong> يمكنك الاستلام يوم <strong>{req.pickupDate ? new Date(req.pickupDate).toLocaleDateString('ar-DZ') : '—'}</strong> الساعة <strong>{req.pickupTime}</strong> من <strong>{req.pickupPlace}</strong>
                  </div>
                )}
                {req.status === 'REJECTED' && req.notes && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[12px] text-red-700">
                    ❌ <strong>سبب الرفض:</strong> {req.notes}
                  </div>
                )}
                {(req.status === 'PENDING' || req.status === 'REVIEWING') && (
                  <p className="text-[12px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> في انتظار مراجعة مسؤول الوسائل
                  </p>
                )}
              </div>
            </Card>
          ))}
          {!requests.length && (
            <Card><div className="text-center py-12"><p className="text-3xl mb-2">📭</p><p className="text-slate-400">لا توجد طلبات بعد</p><p className="text-slate-300 text-sm mt-1">اضغط "طلب جديد" لإرسال طلبك الأول</p></div></Card>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="📤 إرسال طلب وسائل جديد" size="md"
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>إلغاء</Btn><Btn onClick={handleSubmit} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} 📤 إرسال الطلب</Btn></>}>
        <div className="space-y-4">
          <Select label="الأولوية" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-slate-600">الوسائل المطلوبة *</label>
              <Btn variant="ghost" size="sm" onClick={addItem}><Plus size={12} /> إضافة</Btn>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)}
                    placeholder="اسم الوسيلة أو الصنف المطلوب"
                    className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500" />
                  <input type="number" min="1" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)}
                    className="w-20 px-2 py-2 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 text-center" />
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Textarea label="سبب الطلب" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="اشرح سبب الطلب والغرض منه..." />
        </div>
      </Modal>
    </div>
  )
}
