import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import JsBarcode from 'jsbarcode'
import api from '../utils/api'
import { Card, Btn, PageHeader, Input, Select, Badge } from '../components/ui'
import toast from 'react-hot-toast'

export default function BarcodePage() {
  const [params] = useSearchParams()
  const preselectedId = params.get('id')
  const [size, setSize] = useState('58')
  const [bcType, setBcType] = useState('CODE128')
  const [showName, setShowName] = useState(true)
  const [showLoc, setShowLoc] = useState(true)
  const [showPrice, setShowPrice] = useState(false)
  const [copies, setCopies] = useState(1)
  const [selected, setSelected] = useState(preselectedId ? [preselectedId] : [])
  const [custom, setCustom] = useState({ inv: 'UBB-2025-001', name: '', loc: '', price: '' })
  const printRef = useRef(null)

  const { data } = useQuery({ queryKey: ['assets-500'], queryFn: () => api.get('/assets', { params: { hasBarcode: true } }).then(r => r.data.data) })
  const assets = data || []

  // Render grid barcodes
  useEffect(() => {
    if (!assets.length) return
    setTimeout(() => {
      assets.forEach(a => {
        const el = document.getElementById(`bc-grid-${a.id}`)
        if (el) {
          try { JsBarcode(el, a.invNumber, { format: bcType, width: 1.6, height: size === '58' ? 38 : 52, displayValue: false, margin: 3 }) } catch {}
        }
      })
    }, 100)
  }, [assets, bcType, size])

  // Render custom preview
  useEffect(() => {
    const el = document.getElementById('bc-custom-prev')
    if (!el) return
    try { JsBarcode(el, custom.inv || 'UBB-2025-001', { format: bcType, width: 2, height: size === '58' ? 45 : 60, displayValue: false, margin: 5 }) } catch {}
  }, [custom.inv, bcType, size])

  const buildPrintHTML = (items) => {
    const cls = `xp-${size}`
    const cards = items.flatMap(item =>
      Array(item.copies || 1).fill(null).map((_, ci) => {
        const svgId = `pbc-${item.invNumber}-${ci}`
        return `<div class="bc-card">
          <div style="font-size:${size==='58'?'5.5':'6.5'}pt;margin-bottom:0.8mm;color:#555">🏛️ كلية الحقوق - جامعة برج بوعريريج</div>
          <svg id="${svgId}"></svg>
          <div class="bc-invnum">${item.invNumber}</div>
          ${showName && item.name ? `<div class="bc-name">${item.name}</div>` : ''}
          ${showLoc && item.loc ? `<div class="bc-loc">📍 ${item.loc}</div>` : ''}
          ${showPrice && item.price ? `<div class="bc-loc">💰 ${Number(item.price).toLocaleString('ar')} دج</div>` : ''}
          <div class="bc-footer">نظام الوسائل | ${new Date().toLocaleDateString('ar-DZ')}</div>
        </div>`
      })
    ).join('')
    return cards
  }

  const printBarcodes = (items) => {
    const win = window.open('', '_blank')
    const cssLink = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700;800&display=swap" rel="stylesheet">`
    const css = `
      *{margin:0;padding:0;box-sizing:border-box;font-family:'IBM Plex Sans Arabic',Tahoma,sans-serif;}
      @page{margin:2mm;}
      body{background:#fff;}
      .xp-58 .bc-card{width:54mm;min-height:26mm;padding:1.5mm;border:0.3mm solid #000;display:inline-block;page-break-inside:avoid;text-align:center;margin:0.5mm;vertical-align:top;}
      .xp-58 .bc-card svg{width:50mm!important;height:14mm!important;display:block;margin:0 auto;}
      .xp-58 .bc-invnum{font-size:6.5pt;font-weight:900;font-family:monospace;letter-spacing:.4px;margin-top:0.5mm;}
      .xp-58 .bc-name{font-size:6pt;margin-top:0.5mm;}
      .xp-58 .bc-loc{font-size:5pt;color:#444;margin-top:0.3mm;}
      .xp-58 .bc-footer{font-size:4.5pt;color:#666;margin-top:0.5mm;}
      .xp-80 .bc-card{width:76mm;min-height:36mm;padding:2.5mm;border:0.3mm solid #000;display:inline-block;page-break-inside:avoid;text-align:center;margin:0.5mm;vertical-align:top;}
      .xp-80 .bc-card svg{width:70mm!important;height:20mm!important;display:block;margin:0 auto;}
      .xp-80 .bc-invnum{font-size:8.5pt;font-weight:900;font-family:monospace;letter-spacing:.5px;margin-top:1mm;}
      .xp-80 .bc-name{font-size:7.5pt;margin-top:0.5mm;}
      .xp-80 .bc-loc{font-size:6.5pt;color:#444;margin-top:0.5mm;}
      .xp-80 .bc-footer{font-size:5.5pt;color:#666;margin-top:1mm;}
    `
    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">${cssLink}<style>${css}</style><script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"><\/script></head>
    <body><div class="xp-${size}">${buildPrintHTML(items)}</div>
    <script>
      window.onload = function() {
        ${items.flatMap(item => Array(item.copies||1).fill(null).map((_, ci) => `
          try { JsBarcode('#pbc-${item.invNumber}-${ci}', '${item.invNumber}', { format:'${bcType}', width:${size==='58'?1.5:2}, height:${size==='58'?38:52}, displayValue:false, margin:2, background:'#ffffff', lineColor:'#000000' }); } catch(e){}
        `)).join('')}
        setTimeout(() => { window.print(); window.close(); }, 600);
      }
    <\/script></body></html>`
    win.document.write(html)
    win.document.close()
  }

  const handlePrintSelected = () => {
    if (!selected.length) return toast.error('يرجى تحديد وسيلة واحدة على الأقل')
    const items = assets.filter(a => selected.includes(a.id)).map(a => ({ invNumber: a.invNumber, name: a.name, loc: a.office?.name, price: a.price, copies: 1 }))
    printBarcodes(items)
  }

  const handlePrintAll = () => {
    if (!assets.length) return toast.error('لا توجد وسائل فوق 500 دج')
    const items = assets.map(a => ({ invNumber: a.invNumber, name: a.name, loc: a.office?.name, price: a.price, copies: 1 }))
    printBarcodes(items)
    toast.success(`جارٍ طباعة ${assets.length} باركود`)
  }

  const handlePrintCustom = () => {
    if (!custom.inv) return toast.error('يرجى إدخال رقم الجرد')
    printBarcodes([{ invNumber: custom.inv, name: custom.name, loc: custom.loc, price: custom.price, copies: Number(copies) }])
  }

  const toggleSelect = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="▦ الباركود والطباعة — XPrinter" subtitle="طباعة بطاقات باركود للوسائل فوق 500 دج متوافقة مع XPrinter 58mm و 80mm"
        actions={<>
          <Btn variant="ghost" onClick={handlePrintSelected}>🖨️ طباعة المحددة ({selected.length})</Btn>
          <Btn variant="gold" onClick={handlePrintAll}>🖨️ طباعة الكل ({assets.length})</Btn>
        </>} />

      {/* Settings */}
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-slate-600">مقاس الطباعة:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px]"><input type="radio" name="psize" value="58" checked={size==='58'} onChange={() => setSize('58')} /> XPrinter 58mm</label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px]"><input type="radio" name="psize" value="80" checked={size==='80'} onChange={() => setSize('80')} /> XPrinter 80mm</label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-600">نوع الباركود:</span>
            <select value={bcType} onChange={e => setBcType(e.target.value)} className="px-2 py-1.5 border-2 border-slate-200 rounded-lg text-[12px] outline-none focus:border-blue-500 bg-white">
              <option value="CODE128">CODE 128 (موصى به)</option>
              <option value="CODE39">CODE 39</option>
            </select>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={showName} onChange={e => setShowName(e.target.checked)} /> الاسم</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={showLoc} onChange={e => setShowLoc(e.target.checked)} /> الموقع</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} /> السعر</label>
          </div>
          <div className="mr-auto">
            <Badge color="blue">مقاس {size}mm نشط</Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Custom barcode */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-bold text-slate-700 text-[14px]">⚙️ إنشاء باركود مخصص</h2></div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="رقم الجرد" required value={custom.inv} onChange={e => setCustom(c => ({ ...c, inv: e.target.value }))} dir="ltr" placeholder="UBB-2025-001" />
              <Input label="اسم الوسيلة" value={custom.name} onChange={e => setCustom(c => ({ ...c, name: e.target.value }))} />
              <Input label="الموقع" value={custom.loc} onChange={e => setCustom(c => ({ ...c, loc: e.target.value }))} />
              <Input label="السعر (دج)" type="number" value={custom.price} onChange={e => setCustom(c => ({ ...c, price: e.target.value }))} />
            </div>
            <Input label="عدد النسخ" type="number" value={copies} onChange={e => setCopies(e.target.value)} min="1" max="20" />
            <Btn variant="gold" className="w-full justify-center" onClick={handlePrintCustom}>🖨️ طباعة هذا الباركود</Btn>
          </div>
        </Card>

        {/* Preview */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 text-[14px]">👁️ معاينة</h2>
            <Badge color={Number(custom.price) > 500 ? 'blue' : 'slate'}>{Number(custom.price) > 500 ? 'فوق 500 دج ✓' : 'أقل من 500 دج'}</Badge>
          </div>
          <div className="p-5 flex justify-center">
            <div className="border-2 border-blue-200 rounded-xl p-4 text-center bg-white inline-block min-w-[200px]">
              <p className="text-[10px] text-slate-500 mb-2">🏛️ كلية الحقوق - جامعة برج بوعريريج</p>
              <svg id="bc-custom-prev" style={{ display: 'block', margin: '0 auto' }} />
              <p className="font-mono font-black text-[13px] mt-1.5 tracking-wider">{custom.inv || 'UBB-2025-001'}</p>
              {showName && custom.name && <p className="text-[11px] text-slate-700 mt-0.5">{custom.name}</p>}
              {showLoc && custom.loc && <p className="text-[10px] text-slate-500">📍 {custom.loc}</p>}
              {showPrice && custom.price && <p className="text-[10px] text-slate-500">💰 {Number(custom.price).toLocaleString('ar')} دج</p>}
              <p className="text-[9px] text-slate-400 mt-1">نظام الوسائل | {new Date().toLocaleDateString('ar-DZ')}</p>
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-400 pb-4">ℹ️ الوسائل أقل من 500 دج لا تحمل باركود تلقائياً</p>
        </Card>
      </div>

      {/* All 500+ grid */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-700 text-[14px]">▦ جميع الوسائل فوق 500 دج ({assets.length})</h2>
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" onClick={() => setSelected(assets.map(a => a.id))}>تحديد الكل</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setSelected([])}>إلغاء الكل</Btn>
            <Btn variant="gold" size="sm" onClick={handlePrintSelected}>🖨️ طباعة المحددة ({selected.length})</Btn>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {assets.map(a => (
              <div key={a.id} onClick={() => toggleSelect(a.id)}
                className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${selected.includes(a.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                {selected.includes(a.id) && <div className="text-blue-600 text-[10px] font-bold mb-1">✓ محدد</div>}
                <p className="text-[9px] text-slate-500 mb-1">🏛️ كلية الحقوق UBB</p>
                <svg id={`bc-grid-${a.id}`} style={{ display: 'block', margin: '0 auto' }} />
                <p className="font-mono font-black text-[10px] mt-1 tracking-wide">{a.invNumber}</p>
                {showName && <p className="text-[9px] text-slate-600 mt-0.5 truncate">{a.name}</p>}
                {showLoc && <p className="text-[8px] text-slate-400">📍 {a.office?.name}</p>}
              </div>
            ))}
            {!assets.length && <p className="col-span-5 text-center py-8 text-slate-400">لا توجد وسائل فوق 500 دج</p>}
          </div>
        </div>
      </Card>
    </div>
  )
}
