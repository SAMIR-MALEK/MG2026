import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Btn, Badge, Card, Alert, PageHeader } from '../components/ui'
import { Loader2, Printer, Save, CheckCircle } from 'lucide-react'

export default function InventorySheetPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)

  const { data: inv, isLoading } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => api.get(`/inventory/${id}`).then(r => r.data.data)
  })

  useEffect(() => {
    if (inv?.items) {
      setRows(inv.items.map(item => ({
        id: item.id,
        assetId: item.assetId,
        name: item.asset?.name || '',
        invNumber: item.asset?.invNumber || '',
        category: item.asset?.category?.name || '',
        expectedQty: item.expectedQty,
        actualQty: item.actualQty,
        notes: item.notes || ''
      })))
    }
  }, [inv])

  const updateRow = (idx, field, value) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const getDiff = (expected, actual) => {
    const d = Number(actual) - Number(expected)
    if (d === 0) return { label: '✓ متطابق', color: 'text-emerald-600', bg: 'bg-emerald-50' }
    if (d > 0)  return { label: `+${d} زيادة`, color: 'text-blue-600', bg: 'bg-blue-50' }
    return { label: `${d} ناقص`, color: 'text-red-600', bg: 'bg-red-50' }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/inventory/${id}/items`, {
        items: rows.map(r => ({ itemId: r.id, actualQty: Number(r.actualQty), notes: r.notes }))
      })
      toast.success('تم حفظ بيانات الجرد')
      qc.invalidateQueries(['inventory'])
    } catch (err) { toast.error(err.response?.data?.message || 'خطأ في الحفظ') }
    setSaving(false)
  }

  const handleClose = async () => {
    if (!confirm('هل تريد إغلاق وحفظ هذا الجرد نهائياً؟ لن تتمكن من تعديله بعد ذلك.')) return
    setClosing(true)
    try {
      await handleSave()
      await api.put(`/inventory/${id}/close`)
      toast.success('تم إغلاق الجرد بنجاح')
      qc.invalidateQueries(['inventory'])
      navigate('/inventory')
    } catch (err) { toast.error('خطأ في إغلاق الجرد') }
    setClosing(false)
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    const matched = rows.filter(r => Number(r.actualQty) === Number(r.expectedQty)).length
    const deficit = rows.filter(r => Number(r.actualQty) < Number(r.expectedQty)).length
    const surplus = rows.filter(r => Number(r.actualQty) > Number(r.expectedQty)).length

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:'IBM Plex Sans Arabic',Tahoma,sans-serif;}
      @page{margin:15mm 10mm;}
      body{font-size:10pt;color:#000;}
      .header{text-align:center;border-bottom:2px solid #000;padding-bottom:8mm;margin-bottom:8mm;}
      .header h1{font-size:14pt;font-weight:800;}
      .header h2{font-size:12pt;font-weight:700;margin-top:3mm;}
      .header p{font-size:9pt;color:#444;margin-top:2mm;}
      .meta{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6mm;margin-bottom:6mm;background:#f5f5f5;padding:5mm;border-radius:3mm;}
      .meta-item label{font-size:8pt;color:#666;display:block;}
      .meta-item span{font-size:10pt;font-weight:700;}
      table{width:100%;border-collapse:collapse;margin-bottom:6mm;}
      th{background:#1e3a5f;color:#fff;padding:4mm 3mm;text-align:right;font-size:9pt;font-weight:700;}
      td{padding:3mm;border-bottom:0.5px solid #ddd;font-size:9pt;vertical-align:middle;}
      tr:nth-child(even) td{background:#f9f9f9;}
      .diff-ok{color:#059669;font-weight:700;}
      .diff-up{color:#1a56db;font-weight:700;}
      .diff-dn{color:#dc2626;font-weight:700;}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin-bottom:8mm;}
      .sum-box{border:1px solid #ddd;border-radius:3mm;padding:4mm;text-align:center;}
      .sum-val{font-size:20pt;font-weight:800;}
      .sum-lbl{font-size:8pt;color:#555;margin-top:1mm;}
      .sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10mm;margin-top:15mm;}
      .sign-box{text-align:center;border-top:1px solid #000;padding-top:3mm;font-size:9pt;}
    </style></head><body>
    <div class="header">
      <h1>🏛️ الجمهورية الجزائرية الديمقراطية الشعبية</h1>
      <h2>جامعة محمد البشير الإبراهيمي — برج بوعريريج</h2>
      <p>كلية الحقوق والعلوم السياسية — مصلحة الوسائل العامة</p>
      <h2 style="margin-top:5mm;font-size:13pt;">محضر جرد الوسائل</h2>
    </div>
    <div class="meta">
      <div class="meta-item"><label>رقم الجرد</label><span>${inv?.reference}</span></div>
      <div class="meta-item"><label>الموقع</label><span>${inv?.office?.name}</span></div>
      <div class="meta-item"><label>تاريخ الجرد</label><span>${new Date(inv?.date).toLocaleDateString('ar-DZ')}</span></div>
      <div class="meta-item"><label>المسؤول</label><span>${inv?.user?.name}</span></div>
    </div>
    <div class="summary">
      <div class="sum-box"><div class="sum-val">${rows.length}</div><div class="sum-lbl">إجمالي الأصناف</div></div>
      <div class="sum-box"><div class="sum-val" style="color:#059669">${matched}</div><div class="sum-lbl">متطابق</div></div>
      <div class="sum-box"><div class="sum-val" style="color:#dc2626">${deficit}</div><div class="sum-lbl">ناقص</div></div>
      <div class="sum-box"><div class="sum-val" style="color:#1a56db">${surplus}</div><div class="sum-lbl">زيادة</div></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>رقم الجرد</th><th>اسم الوسيلة</th><th>الفئة</th><th>الكمية المسجلة</th><th>الكمية الفعلية</th><th>الفرق</th><th>ملاحظات</th></tr></thead>
      <tbody>
        ${rows.map((r, i) => {
          const d = Number(r.actualQty) - Number(r.expectedQty)
          const dc = d === 0 ? 'diff-ok' : d > 0 ? 'diff-up' : 'diff-dn'
          const dl = d === 0 ? '✓' : d > 0 ? `+${d}` : `${d}`
          return `<tr><td>${i+1}</td><td style="font-family:monospace;font-size:8pt">${r.invNumber}</td><td><strong>${r.name}</strong></td><td>${r.category}</td><td style="text-align:center">${r.expectedQty}</td><td style="text-align:center;font-weight:700">${r.actualQty}</td><td class="${dc}" style="text-align:center">${dl}</td><td>${r.notes||''}</td></tr>`
        }).join('')}
      </tbody>
    </table>
    <div class="sign">
      <div class="sign-box">مسؤول الوسائل العامة<br><br></div>
      <div class="sign-box">المسؤول المباشر<br><br></div>
      <div class="sign-box">الختم الرسمي<br><br></div>
    </div>
    <script>window.onload=()=>{window.print();window.close();}</script>
    </body></html>`
    win.document.write(html)
    win.document.close()
  }

  if (isLoading) return (
    <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  )
  if (!inv) return <div className="text-center py-12 text-slate-400">الجرد غير موجود</div>

  const matched = rows.filter(r => Number(r.actualQty) === Number(r.expectedQty)).length
  const deficit  = rows.filter(r => Number(r.actualQty) < Number(r.expectedQty)).length
  const surplus  = rows.filter(r => Number(r.actualQty) > Number(r.expectedQty)).length

  return (
    <div className="space-y-4 fade-up">
      <PageHeader
        title={`📋 ورقة جرد — ${inv.office?.name}`}
        subtitle={`${inv.reference} · ${new Date(inv.date).toLocaleDateString('ar-DZ')} · ${inv.user?.name}`}
        actions={<>
          <Badge color={inv.status === 'CLOSED' ? 'green' : 'gold'}>{inv.status === 'CLOSED' ? '✅ مكتمل' : '🔓 مفتوح'}</Badge>
          <Btn variant="ghost" onClick={handlePrint}><Printer size={15} /> طباعة المحضر</Btn>
          {inv.status === 'OPEN' && <>
            <Btn variant="ghost" onClick={handleSave} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />}<Save size={15} /> حفظ</Btn>
            <Btn variant="green" onClick={handleClose} disabled={closing}>{closing && <Loader2 size={14} className="animate-spin" />}<CheckCircle size={15} /> إغلاق الجرد</Btn>
          </>}
        </>}
      />

      {inv.status === 'OPEN' && (
        <Alert type="info">
          أدخل <strong>الكمية الفعلية</strong> التي وجدتها لكل وسيلة. الفروق ستظهر تلقائياً. اضغط <strong>حفظ</strong> للاحتفاظ بالتقدم أو <strong>إغلاق الجرد</strong> عند الانتهاء.
        </Alert>
      )}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الأصناف', val: rows.length, color: 'text-slate-800', bg: 'bg-white' },
          { label: 'متطابق', val: matched, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'ناقص', val: deficit, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'زيادة', val: surplus, color: 'text-blue-700', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-slate-200 p-4 text-center ${s.bg}`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-[12px] text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Inventory table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase w-8">#</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">الوسيلة</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">الفئة</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">الكمية المسجلة</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-blue-600 uppercase">الكمية الفعلية ✏️</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">الفرق</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const diff = getDiff(row.expectedQty, row.actualQty)
                const isChanged = Number(row.actualQty) !== Number(row.expectedQty)
                return (
                  <tr key={row.id} className={`border-b border-slate-50 transition ${isChanged ? 'bg-amber-50/40' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500">{idx + 1}</div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-[13px]">{row.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{row.invNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{row.category}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-700 text-[14px]">{row.expectedQty}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inv.status === 'OPEN' ? (
                        <input
                          type="number" min="0"
                          value={row.actualQty}
                          onChange={e => updateRow(idx, 'actualQty', e.target.value)}
                          className={`w-20 text-center px-2 py-1.5 border-2 rounded-lg text-[13px] font-bold outline-none transition
                            ${Number(row.actualQty) === Number(row.expectedQty)
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border-amber-400 bg-amber-50 text-amber-700 focus:border-blue-500'}`}
                        />
                      ) : (
                        <span className="font-bold text-[14px] text-slate-800">{row.actualQty}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${diff.color} ${diff.bg}`}>{diff.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === 'OPEN' ? (
                        <input
                          value={row.notes}
                          onChange={e => updateRow(idx, 'notes', e.target.value)}
                          placeholder="ملاحظة..."
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[12px] outline-none focus:border-blue-400 bg-white"
                        />
                      ) : (
                        <span className="text-[12px] text-slate-500">{row.notes || '—'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!rows.length && (
                <tr><td colSpan="7" className="text-center py-10 text-slate-400">لا توجد وسائل في هذا الموقع</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {inv.status === 'OPEN' && (
          <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
            <Btn variant="ghost" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}<Save size={14} /> حفظ التقدم
            </Btn>
            <Btn variant="green" onClick={handleClose} disabled={closing}>
              {closing && <Loader2 size={14} className="animate-spin" />}<CheckCircle size={14} /> إغلاق وحفظ الجرد نهائياً
            </Btn>
          </div>
        )}
      </Card>
    </div>
  )
}
