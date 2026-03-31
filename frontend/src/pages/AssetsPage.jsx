import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Eye, ScanBarcode, AlertTriangle, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Btn, Badge, Card, Modal, Input, Select, Textarea, Table, PageHeader, CondBadge, SearchBar, Alert } from '../components/ui'
import { useNavigate } from 'react-router-dom'

const EMPTY = { name:'', description:'', serialNumber:'', quantity:0, minQuantity:1, unit:'قطعة', condition:'GOOD', price:0, categoryId:'', officeId:'', supplierId:'', purchaseDate:'', warrantyDate:'', }

export default function AssetsPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterOff, setFilterOff] = useState('')
  const [filterCond, setFilterCond] = useState('')
  const [filter500, setFilter500] = useState(false)
  const [filterLow, setFilterLow] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [viewAsset, setViewAsset] = useState(null)

  const { data: assetsData, isLoading } = useQuery({ queryKey: ['assets', search, filterCat, filterOff, filterCond, filter500, filterLow], queryFn: () => {
    const p = {}
    if (search) p.search = search
    if (filterCat) p.categoryId = filterCat
    if (filterOff) p.officeId = filterOff
    if (filterCond) p.condition = filterCond
    if (filter500) p.hasBarcode = true
    if (filterLow) p.minQty = true
    return api.get('/assets', { params: p }).then(r => r.data)
  }})
  const { data: catsData } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data.data) })
  const { data: offsData } = useQuery({ queryKey: ['offices'], queryFn: () => api.get('/offices').then(r => r.data.data) })
  const { data: suppData } = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get('/suppliers').then(r => r.data.data) })

  const assets = assetsData?.data || []
  const cats = catsData || []
  const offs = offsData || []
  const supps = suppData || []

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = a => {
    setForm({ name: a.name, description: a.description||'', serialNumber: a.serialNumber||'', quantity: a.quantity, minQuantity: a.minQuantity, unit: a.unit, condition: a.condition, price: a.price, categoryId: a.categoryId, officeId: a.officeId, supplierId: a.supplierId||'', purchaseDate: a.purchaseDate?.split('T')[0]||'', warrantyDate: a.warrantyDate?.split('T')[0]||'' })
    setViewAsset(a)
    setModal('edit')
  }
  const openView = a => { setViewAsset(a); setModal('view') }

  const handleSave = async () => {
    if (!form.name || !form.categoryId || !form.officeId) return toast.error('يرجى ملء الحقول المطلوبة')
    if (!form.price && form.price !== 0) return toast.error('يرجى إدخال السعر')
    setSaving(true)
    try {
      const payload = { ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity), price: Number(form.price) }
      if (modal === 'add') {
        const { data } = await api.post('/assets', payload)
        toast.success(data.message)
      } else {
        await api.put(`/assets/${viewAsset.id}`, payload)
        toast.success('تم تحديث الوسيلة بنجاح')
      }
      qc.invalidateQueries(['assets'])
      qc.invalidateQueries(['dashboard'])
      setModal(null)
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ في الحفظ') }
    setSaving(false)
  }

  const handleDelete = async id => {
    if (!confirm('هل أنت متأكد من حذف هذه الوسيلة؟')) return
    setDeleting(id)
    try {
      await api.delete(`/assets/${id}`)
      toast.success('تم حذف الوسيلة')
      qc.invalidateQueries(['assets'])
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ في الحذف') }
    setDeleting(null)
  }

  const CONDS = ['GOOD','FAIR','POOR','DAMAGED','DISPOSED']
  const COND_LABELS = { GOOD:'جيد', FAIR:'مقبول', POOR:'رديء', DAMAGED:'تالف', DISPOSED:'متلَف' }

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="📦 الوسائل والمخزون" subtitle={`${assets.length} وسيلة — الوسائل فوق 500 دج لها باركود تلقائي`}
        actions={isAdmin && <>
          <Btn variant="gold" onClick={() => navigate('/barcode')}>▦ طباعة الباركود</Btn>
          <Btn onClick={openAdd}><Plus size={15} /> إضافة وسيلة</Btn>
        </>} />

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو رقم الجرد أو الرقم التسلسلي..." className="flex-1 min-w-[200px]" />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] bg-white outline-none focus:border-blue-500">
            <option value="">كل الفئات</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterOff} onChange={e => setFilterOff(e.target.value)} className="px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] bg-white outline-none focus:border-blue-500">
            <option value="">كل المواقع</option>
            {offs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={filterCond} onChange={e => setFilterCond(e.target.value)} className="px-3 py-2 border-2 border-slate-200 rounded-xl text-[13px] bg-white outline-none focus:border-blue-500">
            <option value="">كل الحالات</option>
            {CONDS.map(c => <option key={c} value={c}>{COND_LABELS[c]}</option>)}
          </select>
          <button onClick={() => setFilter500(p => !p)} className={`px-3 py-2 rounded-xl text-[12px] font-semibold border-2 transition ${filter500 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-400'}`}>▦ فوق 500 دج</button>
          <button onClick={() => setFilterLow(p => !p)} className={`px-3 py-2 rounded-xl text-[12px] font-semibold border-2 transition ${filterLow ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600 hover:border-red-400'}`}>⚠️ مخزون منخفض</button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table loading={isLoading} empty="لا توجد وسائل مطابقة للبحث"
          headers={['رقم الجرد','الوسيلة','الفئة','الموقع','الكمية','السعر (دج)','الحالة','باركود','إجراءات']}>
          {assets.map(a => (
            <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              <td><span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{a.invNumber}</span></td>
              <td>
                <p className="font-semibold text-slate-800 text-[13px]">{a.name}</p>
                {a.serialNumber && <p className="text-[11px] text-slate-400">{a.serialNumber}</p>}
              </td>
              <td className="text-slate-600">{a.category?.name}</td>
              <td className="text-slate-600">{a.office?.name}</td>
              <td>
                <div className="flex items-center gap-1">
                  <span className={`font-bold ${a.quantity <= a.minQuantity ? 'text-red-600' : 'text-slate-800'}`}>{a.quantity}</span>
                  <span className="text-[11px] text-slate-400">{a.unit}</span>
                  {a.quantity <= a.minQuantity && <AlertTriangle size={13} className="text-orange-500" />}
                </div>
              </td>
              <td><span className={`font-semibold ${a.price > 500 ? 'text-blue-700' : 'text-slate-500'}`}>{a.price.toLocaleString('ar')}</span></td>
              <td><CondBadge cond={a.condition} /></td>
              <td>{a.hasBarcode ? <Badge color="blue">▦ باركود</Badge> : <span className="text-[11px] text-slate-400">—</span>}</td>
              <td>
                <div className="flex items-center gap-1">
                  <button onClick={() => openView(a)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"><Eye size={13} /></button>
                  {isAdmin && <>
                    <button onClick={() => openEdit(a)} className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition"><Edit2 size={13} /></button>
                    {a.hasBarcode && <button onClick={() => navigate(`/barcode?id=${a.id}`)} className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 hover:bg-amber-100 transition"><ScanBarcode size={13} /></button>}
                    <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition">
                      {deleting === a.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} size="lg"
        title={modal === 'add' ? '📦 إضافة وسيلة جديدة' : '✏️ تعديل الوسيلة'}
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn><Btn onClick={handleSave} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} حفظ</Btn></>}>
        <div className="space-y-3">
          <Alert type="info">الوسائل التي سعرها <strong>أكثر من 500 دج</strong> يُنشأ لها رقم جرد وباركود تلقائياً</Alert>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Input label="اسم الوسيلة" required value={form.name} onChange={set('name')} placeholder="حاسوب مكتبي HP..." /></div>
            <Select label="الفئة" required value={form.categoryId} onChange={set('categoryId')}><option value="">اختر</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Select label="الموقع / المكتب" required value={form.officeId} onChange={set('officeId')}><option value="">اختر</option>{offs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</Select>
            <Input label="السعر (دج)" required type="number" min="0" value={form.price} onChange={set('price')} hint={Number(form.price) > 500 ? '✅ سيُنشأ باركود تلقائياً' : Number(form.price) > 0 ? 'أقل من 500 دج — لا باركود' : ''} />
            <Input label="الكمية" type="number" min="0" value={form.quantity} onChange={set('quantity')} />
            <Input label="الحد الأدنى للتنبيه" type="number" min="0" value={form.minQuantity} onChange={set('minQuantity')} />
            <Input label="الوحدة" value={form.unit} onChange={set('unit')} placeholder="قطعة، جهاز..." />
            <Select label="الحالة" value={form.condition} onChange={set('condition')}>
              {CONDS.map(c => <option key={c} value={c}>{COND_LABELS[c]}</option>)}
            </Select>
            <Input label="الرقم التسلسلي" value={form.serialNumber} onChange={set('serialNumber')} dir="ltr" placeholder="SN-XXXX" />
            <Select label="المورد" value={form.supplierId} onChange={set('supplierId')}><option value="">اختياري</option>{supps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
            <Input label="تاريخ الشراء" type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
            <Input label="انتهاء الضمان" type="date" value={form.warrantyDate} onChange={set('warrantyDate')} />
            <div className="col-span-2"><Textarea label="ملاحظات" value={form.description} onChange={set('description')} placeholder="أي ملاحظات..." /></div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title="👁️ تفاصيل الوسيلة" size="md">
        {viewAsset && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[['رقم الجرد', <span className="font-mono font-bold text-blue-700">{viewAsset.invNumber}</span>],
                ['الاسم', viewAsset.name], ['الفئة', viewAsset.category?.name], ['الموقع', viewAsset.office?.name],
                ['الكمية', `${viewAsset.quantity} ${viewAsset.unit}`], ['السعر', `${viewAsset.price?.toLocaleString('ar')} دج`],
                ['الحالة', <CondBadge cond={viewAsset.condition} />],
                ['الباركود', viewAsset.hasBarcode ? <Badge color="blue">▦ نعم</Badge> : <Badge color="slate">لا</Badge>],
                ['الرقم التسلسلي', viewAsset.serialNumber || '—'],
                ['المورد', viewAsset.supplier?.name || '—'],
              ].map(([k, v], i) => (
                <div key={i}><p className="text-[11px] text-slate-400 mb-0.5">{k}</p><p className="font-semibold text-slate-800 text-[13px]">{v}</p></div>
              ))}
            </div>
            {viewAsset.description && <div className="bg-slate-50 rounded-xl p-3"><p className="text-[11px] text-slate-400 mb-1">ملاحظات</p><p className="text-[13px] text-slate-700">{viewAsset.description}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
