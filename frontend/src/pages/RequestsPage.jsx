import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle, X } from 'lucide-react'
import api from '../utils/api'
import { Btn, Badge, Card, Modal, Input, Select, Textarea, PageHeader, Alert } from '../components/ui'

const STATUS_LABELS = { PENDING:'⏳ جديد', REVIEWING:'🔍 دراسة', APPROVED:'✅ موافق', REJECTED:'❌ مرفوض', DELIVERED:'📦 تم التسليم' }
const STATUS_COLORS = { PENDING:'gold', REVIEWING:'blue', APPROVED:'green', REJECTED:'red', DELIVERED:'slate' }
const PRIORITY_LABELS = { LOW:'عادي', NORMAL:'عادي', HIGH:'⚡ عاجل', URGENT:'🚨 طارئ' }
const PRIORITY_COLORS = { LOW:'slate', NORMAL:'slate', HIGH:'orange', URGENT:'red' }

export default function RequestsPage() {
  const qc = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [approveModal, setApproveModal] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [approveForm, setApproveForm] = useState({ pickupDate: '', pickupTime: '09:00', pickupPlace: 'المخزن الرئيسي', notes: '' })
  const [rejectNotes, setRejectNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['requests', filterStatus],
    queryFn: () => api.get('/requests', { params: { status: filterStatus || undefined } }).then(r => r.data.data)
  })
  const requests = data || []

  const handleApprove = async () => {
    if (!approveForm.pickupDate) return toast.error('يرجى تحديد تاريخ الاستلام')
    setSaving(true)
    try {
      const { data: res } = await api.put(`/requests/${approveModal.id}/approve`, approveForm)
      toast.success(res.message)
      qc.invalidateQueries(['requests'])
      qc.invalidateQueries(['dashboard'])
      setApproveModal(null)
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ') }
    setSaving(false)
  }

  const handleReject = async () => {
    setSaving(true)
    try {
      await api.put(`/requests/${rejectModal.id}/reject`, { notes: rejectNotes })
      toast.success('تم رفض الطلب وإشعار المسؤول')
      qc.invalidateQueries(['requests'])
      setRejectModal(null)
      setRejectNotes('')
    } catch { toast.error('خطأ في الرفض') }
    setSaving(false)
  }

  const handleReviewing = async id => {
    try { await api.put(`/requests/${id}/reviewing`); qc.invalidateQueries(['requests']); toast.success('الطلب قيد الدراسة') }
    catch { toast.error('خطأ') }
  }

  const handleDeliver = async id => {
    try { await api.put(`/requests/${id}/deliver`); qc.invalidateQueries(['requests']); toast.success('تم تأكيد التسليم') }
    catch { toast.error('خطأ') }
  }

  const setAF = k => e => setApproveForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="📨 طلبات المصالح" subtitle="مراجعة وتأكيد طلبات مسؤولي المكاتب وتحديد موعد الاستلام" />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['','الكل'],['PENDING','⏳ جديد'],['REVIEWING','🔍 دراسة'],['APPROVED','✅ موافق'],['REJECTED','❌ مرفوض'],['DELIVERED','📦 تم التسليم']].map(([k, v]) => (
          <button key={k} onClick={() => setFilterStatus(k)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold border-2 transition ${filterStatus === k ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}>{v}</button>
        ))}
      </div>

      {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="space-y-3">
          {requests.map(req => (
            <Card key={req.id} className={`overflow-hidden ${req.status === 'PENDING' ? 'border-r-4 border-r-amber-400' : req.status === 'APPROVED' ? 'border-r-4 border-r-emerald-400' : req.status === 'REJECTED' ? 'border-r-4 border-r-red-400 opacity-70' : ''}`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border">{req.reference}</span>
                      <p className="font-bold text-slate-800 text-[15px]">{req.toOffice?.name}</p>
                    </div>
                    <p className="text-[12px] text-slate-400">
                      المسؤول: {req.requester?.name} · {new Date(req.createdAt).toLocaleDateString('ar-DZ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.priority !== 'NORMAL' && <Badge color={PRIORITY_COLORS[req.priority]}>{PRIORITY_LABELS[req.priority]}</Badge>}
                    <Badge color={STATUS_COLORS[req.status]}>{STATUS_LABELS[req.status]}</Badge>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-slate-50 rounded-xl p-3 mb-3">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2">الوسائل المطلوبة:</p>
                  {req.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-[12px] py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-700">{item.itemName}</span>
                      <span className="font-bold text-slate-800">× {item.quantity}</span>
                    </div>
                  ))}
                </div>

                {req.reason && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3 text-[12px] text-amber-800">
                    💬 <strong>السبب:</strong> {req.reason}
                  </div>
                )}

                {req.status === 'APPROVED' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3 text-[12px] text-emerald-800">
                    ✅ <strong>موعد الاستلام:</strong> {req.pickupDate ? new Date(req.pickupDate).toLocaleDateString('ar-DZ') : '—'} الساعة {req.pickupTime} — {req.pickupPlace}
                  </div>
                )}

                {req.notes && req.status === 'REJECTED' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3 text-[12px] text-red-700">
                    ❌ <strong>سبب الرفض:</strong> {req.notes}
                  </div>
                )}

                {/* Actions */}
                {req.status === 'PENDING' && (
                  <div className="flex gap-2 justify-end">
                    <Btn variant="ghost" size="sm" onClick={() => handleReviewing(req.id)}>🔍 وضع قيد الدراسة</Btn>
                    <Btn variant="danger" size="sm" onClick={() => setRejectModal(req)}>❌ رفض</Btn>
                    <Btn variant="gold" size="sm" onClick={() => { setApproveModal(req); setApproveForm({ pickupDate: new Date().toISOString().split('T')[0], pickupTime: '09:00', pickupPlace: 'المخزن الرئيسي', notes: '' }) }}>📅 تحديد موعد الاستلام</Btn>
                    <Btn variant="green" size="sm" onClick={() => { setApproveModal(req); setApproveForm({ pickupDate: new Date().toISOString().split('T')[0], pickupTime: '09:00', pickupPlace: 'المخزن الرئيسي', notes: '' }) }}>✅ موافقة</Btn>
                  </div>
                )}
                {req.status === 'REVIEWING' && (
                  <div className="flex gap-2 justify-end">
                    <Btn variant="danger" size="sm" onClick={() => setRejectModal(req)}>❌ رفض</Btn>
                    <Btn variant="gold" size="sm" onClick={() => { setApproveModal(req); setApproveForm({ pickupDate: new Date().toISOString().split('T')[0], pickupTime: '09:00', pickupPlace: 'المخزن الرئيسي', notes: '' }) }}>✅ موافقة وتحديد موعد</Btn>
                  </div>
                )}
                {req.status === 'APPROVED' && (
                  <div className="flex gap-2 justify-end">
                    <Btn variant="green" size="sm" onClick={() => handleDeliver(req.id)}><CheckCircle size={13} /> تأكيد التسليم</Btn>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {!requests.length && (
            <Card><div className="text-center py-12"><p className="text-3xl mb-2">📭</p><p className="text-slate-400">لا توجد طلبات بهذه الحالة</p></div></Card>
          )}
        </div>
      )}

      {/* Approve Modal */}
      <Modal open={!!approveModal} onClose={() => setApproveModal(null)} title="📅 تحديد موعد الاستلام" size="sm"
        footer={<><Btn variant="ghost" onClick={() => setApproveModal(null)}>إلغاء</Btn><Btn variant="green" onClick={handleApprove} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} تأكيد وإرسال الإشعار</Btn></>}>
        <div className="space-y-3">
          {approveModal && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12px] text-blue-800">
              الطلب: <strong>{approveModal.reference}</strong> — {approveModal.toOffice?.name}
            </div>
          )}
          <Input label="تاريخ الاستلام" required type="date" value={approveForm.pickupDate} onChange={setAF('pickupDate')} min={new Date().toISOString().split('T')[0]} />
          <Input label="ساعة الاستلام" type="time" value={approveForm.pickupTime} onChange={setAF('pickupTime')} />
          <Select label="مكان الاستلام" value={approveForm.pickupPlace} onChange={setAF('pickupPlace')}>
            <option>المخزن الرئيسي</option>
            <option>مكتب الوسائل</option>
          </Select>
          <Textarea label="ملاحظة للمسؤول (اختياري)" value={approveForm.notes} onChange={setAF('notes')} placeholder="مثال: يرجى الحضور بشهادة التسليم..." />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="❌ رفض الطلب" size="sm"
        footer={<><Btn variant="ghost" onClick={() => setRejectModal(null)}>إلغاء</Btn><Btn variant="danger" onClick={handleReject} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} رفض الطلب</Btn></>}>
        <div className="space-y-3">
          {rejectModal && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[12px] text-red-800">
              طلب: <strong>{rejectModal.reference}</strong> — {rejectModal.toOffice?.name}
            </div>
          )}
          <Textarea label="سبب الرفض" value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="اشرح سبب الرفض للمسؤول..." />
        </div>
      </Modal>
    </div>
  )
}
