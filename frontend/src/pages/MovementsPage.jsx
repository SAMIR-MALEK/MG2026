// MovementsPage.jsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Btn, Badge, Card, Modal, Select, Textarea, Table, PageHeader, SearchBar } from '../components/ui'

const TX_LABELS = { PURCHASE:'📥 شراء', DISTRIBUTE:'📤 توزيع', TRANSFER:'🔄 تحويل', RETURN:'↩️ إرجاع', DISPOSAL:'🚫 إتلاف' }
const TX_COLORS = { PURCHASE:'green', DISTRIBUTE:'blue', TRANSFER:'purple', RETURN:'gold', DISPOSAL:'red' }
const EMPTY_MV = { type:'PURCHASE', quantity:1, assetId:'', fromOfficeId:'', toOfficeId:'', notes:'' }

export default function MovementsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_MV)
  const [saving, setSaving] = useState(false)

  const { data: mvData, isLoading } = useQuery({ queryKey: ['movements', filterType], queryFn: () => api.get('/movements', { params: { type: filterType || undefined, limit: 100 } }).then(r => r.data.data) })
  const { data: assetsData } = useQuery({ queryKey: ['assets-all'], queryFn: () => api.get('/assets').then(r => r.data.data), enabled: modal })
  const { data: offsData } = useQuery({ queryKey: ['offices'], queryFn: () => api.get('/offices').then(r => r.data.data) })

  const movements = (mvData || []).filter(m => !search || m.asset?.name?.includes(search) || m.reference?.includes(search))
  const assets = assetsData || []
  const offs = offsData || []
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.assetId || !form.quantity) return toast.error('يرجى اختيار الوسيلة والكمية')
    setSaving(true)
    try {
      const { data } = await api.post('/movements', { ...form, quantity: Number(form.quantity) })
      toast.success(data.message || 'تمت العملية بنجاح')
      qc.invalidateQueries(['movements'])
      qc.invalidateQueries(['assets'])
      qc.invalidateQueries(['dashboard'])
      setModal(false)
      setForm(EMPTY_MV)
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ في العملية') }
    setSaving(false)
  }

  const selectedAsset = assets.find(a => a.id === form.assetId)

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="🔄 حركة الوسائل" subtitle={`${movements.length} عملية مسجلة`}
        actions={isAdmin && <Btn onClick={() => setModal(true)}><Plus size={15} /> تسجيل حركة</Btn>} />
      <Card>
        <div className="p-4 flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="بحث برقم العملية أو اسم الوسيلة..." className="flex-1 min-w-[200px]" />
          {Object.entries(TX_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setFilterType(t => t === k ? '' : k)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border-2 transition ${filterType===k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>{v}</button>
          ))}
        </div>
        <Table loading={isLoading} empty="لا توجد حركات" headers={['رقم العملية','النوع','الوسيلة','الكمية','من','إلى','المسؤول','التاريخ','ملاحظات']}>
          {movements.map(m => (
            <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              <td><span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">{m.reference}</span></td>
              <td><Badge color={TX_COLORS[m.type]}>{TX_LABELS[m.type]}</Badge></td>
              <td><p className="font-semibold text-[13px]">{m.asset?.name}</p><p className="text-[10px] text-slate-400 font-mono">{m.asset?.invNumber}</p></td>
              <td><strong>{m.quantity}</strong></td>
              <td className="text-[12px] text-slate-600">{m.fromOffice?.name || '—'}</td>
              <td className="text-[12px] text-slate-600">{m.toOffice?.name || '—'}</td>
              <td className="text-[12px] text-slate-600">{m.user?.name}</td>
              <td className="text-[11px] text-slate-400" dir="ltr">{new Date(m.date).toLocaleDateString('ar-DZ')}</td>
              <td className="text-[12px] text-slate-500 max-w-[120px] truncate">{m.notes || '—'}</td>
            </tr>
          ))}
        </Table>
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="🔄 تسجيل حركة وسيلة" size="md"
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>إلغاء</Btn><Btn onClick={handleSave} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} تسجيل</Btn></>}>
        <div className="space-y-3">
          <Select label="نوع الحركة" required value={form.type} onChange={set('type')}>
            {Object.entries(TX_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="الوسيلة" required value={form.assetId} onChange={set('assetId')}>
            <option value="">اختر الوسيلة</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name} — متوفر: {a.quantity} {a.unit}</option>)}
          </Select>
          {selectedAsset && form.type !== 'PURCHASE' && Number(form.quantity) > selectedAsset.quantity && (
            <p className="text-red-600 text-[12px] bg-red-50 px-3 py-2 rounded-lg">⚠️ الكمية المطلوبة أكبر من المتوفر ({selectedAsset.quantity})</p>
          )}
          <input type="number" min="1" value={form.quantity} onChange={set('quantity')} placeholder="الكمية" className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500" />
          {['DISTRIBUTE','TRANSFER','RETURN'].includes(form.type) && (
            <Select label="من موقع" value={form.fromOfficeId} onChange={set('fromOfficeId')}>
              <option value="">اختر</option>
              {offs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          )}
          {['PURCHASE','DISTRIBUTE','TRANSFER'].includes(form.type) && (
            <Select label="إلى موقع" value={form.toOfficeId} onChange={set('toOfficeId')}>
              <option value="">اختر</option>
              {offs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          )}
          <Textarea label="ملاحظات" value={form.notes} onChange={set('notes')} placeholder="أي ملاحظات..." />
        </div>
      </Modal>
    </div>
  )
}
