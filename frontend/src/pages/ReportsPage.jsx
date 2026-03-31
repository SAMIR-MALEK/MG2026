import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../utils/api'
import { Btn, Badge, Card, CondBadge, PageHeader, StatCard } from '../components/ui'
import { Printer } from 'lucide-react'

const COLORS = ['#1a56db','#059669','#f59e0b','#7c3aed','#dc2626','#06b6d4']

export default function ReportsPage() {
  const { data: assetsData, isLoading } = useQuery({ queryKey: ['report-assets'], queryFn: () => api.get('/reports/assets').then(r => r.data) })
  const { data: dashData } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/dashboard').then(r => r.data.data) })

  const assets = assetsData?.data || []
  const totalValue = assetsData?.totalValue || 0
  const d = dashData || {}

  const goodCount = assets.filter(a => a.condition === 'GOOD').length
  const damagedCount = assets.filter(a => ['POOR','DAMAGED','DISPOSED'].includes(a.condition)).length
  const lowStockCount = assets.filter(a => a.quantity <= a.minQuantity).length

  const handlePrint = () => {
    const win = window.open('', '_blank')
    const rows = assets.map((a, i) => `
      <tr>
        <td>${i+1}</td>
        <td style="font-family:monospace;font-size:8pt">${a.invNumber}</td>
        <td><strong>${a.name}</strong></td>
        <td>${a.category?.name||''}</td>
        <td>${a.office?.name||''}</td>
        <td style="text-align:center">${a.quantity} ${a.unit}</td>
        <td style="text-align:center">${a.price?.toLocaleString('ar')} دج</td>
        <td style="text-align:center;font-weight:700;color:#1a56db">${(a.quantity*a.price).toLocaleString('ar')} دج</td>
        <td style="text-align:center">${{GOOD:'جيد',FAIR:'مقبول',POOR:'رديء',DAMAGED:'تالف',DISPOSED:'متلَف'}[a.condition]||''}</td>
      </tr>`).join('')
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
    <style>*{font-family:'IBM Plex Sans Arabic',Tahoma,sans-serif;}@page{margin:10mm;}body{font-size:9pt;}
    .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:5mm;margin-bottom:5mm;}
    .hdr h1{font-size:12pt;font-weight:800;}.hdr p{font-size:9pt;color:#555;}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin-bottom:5mm;}
    .stat{border:1px solid #ddd;border-radius:2mm;padding:3mm;text-align:center;}
    .stat .val{font-size:16pt;font-weight:800;}.stat .lbl{font-size:7pt;color:#666;}
    table{width:100%;border-collapse:collapse;}th{background:#1e3a5f;color:#fff;padding:3mm 2mm;font-size:8pt;text-align:right;}
    td{padding:2.5mm 2mm;border-bottom:0.3px solid #eee;font-size:8pt;}tr:nth-child(even) td{background:#f9f9f9;}
    .footer{margin-top:8mm;text-align:center;font-size:8pt;color:#666;}
    </style></head><body>
    <div class="hdr"><h1>🏛️ تقرير الجرد السنوي للوسائل</h1>
    <p>كلية الحقوق والعلوم السياسية — جامعة محمد البشير الإبراهيمي — برج بوعريريج</p>
    <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-DZ')}</p></div>
    <div class="stats">
      <div class="stat"><div class="val">${assets.length}</div><div class="lbl">إجمالي الأصناف</div></div>
      <div class="stat"><div class="val" style="color:#059669">${goodCount}</div><div class="lbl">حالة جيدة</div></div>
      <div class="stat"><div class="val" style="color:#dc2626">${damagedCount}</div><div class="lbl">تالفة/رديئة</div></div>
      <div class="stat"><div class="val" style="color:#1a56db">${(totalValue/1000000).toFixed(2)}M</div><div class="lbl">القيمة الإجمالية (دج)</div></div>
    </div>
    <table><thead><tr><th>#</th><th>رقم الجرد</th><th>اسم الوسيلة</th><th>الفئة</th><th>الموقع</th><th>الكمية</th><th>السعر</th><th>القيمة</th><th>الحالة</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="footer">نظام إدارة الوسائل العامة — كلية الحقوق — جامعة برج بوعريريج © ${new Date().getFullYear()}</div>
    <script>window.onload=()=>{window.print();window.close();}</script>
    </body></html>`)
    win.document.close()
  }

  return (
    <div className="space-y-4 fade-up">
      <PageHeader title="📈 التقارير والإحصائيات"
        actions={<Btn variant="gold" onClick={handlePrint}><Printer size={15} /> طباعة تقرير الجرد</Btn>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي الأصناف" value={assets.length} icon="📦" color="blue" />
        <StatCard label="في حالة جيدة" value={goodCount} icon="✅" color="green" trend={{ label: `${Math.round(goodCount/assets.length*100)||0}%`, up: true }} />
        <StatCard label="تالفة / رديئة" value={damagedCount} icon="🚫" color="red" />
        <StatCard label="القيمة الإجمالية" value={`${(totalValue/1000).toFixed(0)}K دج`} icon="💰" color="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-bold text-slate-700 text-[14px]">📊 الوسائل حسب الفئة</h2></div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.categoryStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'IBM Plex Sans Arabic' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: 'IBM Plex Sans Arabic', fontSize: 12, borderRadius: 10 }} />
                <Bar dataKey="totalQty" name="الكمية" fill="#1a56db" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-bold text-slate-700 text-[14px]">⚠️ مخزون منخفض ({lowStockCount})</h2></div>
          <div>
            {assets.filter(a => a.quantity <= a.minQuantity).slice(0, 6).map(a => (
              <div key={a.id} className="flex justify-between items-center px-5 py-3 border-b border-slate-50 last:border-0">
                <div><p className="font-semibold text-[13px]">{a.name}</p><p className="text-[11px] text-slate-400">{a.office?.name}</p></div>
                <div className="text-right"><p className="text-red-600 font-black text-[16px]">{a.quantity}</p><p className="text-[10px] text-slate-400">/ {a.minQuantity}</p></div>
              </div>
            ))}
            {!lowStockCount && <div className="text-center py-8"><p className="text-3xl mb-2">✅</p><p className="text-slate-400 text-sm">المخزون في مستوى جيد</p></div>}
          </div>
        </Card>
      </div>

      {/* Full table */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-700 text-[14px]">📋 قائمة الجرد الكاملة ({assets.length} وسيلة)</h2>
          <div className="text-[13px] text-blue-700 font-bold">القيمة الإجمالية: {totalValue.toLocaleString('ar')} دج</div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {['رقم الجرد','الوسيلة','الفئة','الموقع','الكمية','السعر','القيمة الإجمالية','الحالة'].map((h,i) => (
                  <th key={i} className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td><span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">{a.invNumber}</span></td>
                    <td><p className="font-semibold text-[13px]">{a.name}</p></td>
                    <td className="text-[12px] text-slate-600">{a.category?.name}</td>
                    <td className="text-[12px] text-slate-600">{a.office?.name}</td>
                    <td><span className="font-bold">{a.quantity}</span> <span className="text-[11px] text-slate-400">{a.unit}</span></td>
                    <td className="text-[13px]">{a.price?.toLocaleString('ar')} دج</td>
                    <td className="font-bold text-blue-700">{(a.quantity * a.price).toLocaleString('ar')} دج</td>
                    <td><CondBadge cond={a.condition} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
