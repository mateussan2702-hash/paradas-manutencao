import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api, type Parada } from '../lib/api'

function calcProgresso(parada: Parada): number {
  const ordens = parada.ordens || []
  if (ordens.length === 0) return 0
  const totalPeso = ordens.reduce((s, o) => s + (o.peso || 0), 0)
  if (totalPeso === 0) return (ordens.filter(o => o.concluida).length / ordens.length) * 100
  const progPonderado = ordens.reduce((s, o) => {
    const prog = o.concluida ? 100 : (o.progressoOs ?? 0)
    return s + (o.peso || 0) * prog
  }, 0)
  return progPonderado / totalPeso
}

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function extrairSemana(texto?: string | null): string | null {
  if (!texto) return null
  const m = texto.match(/SEM\s*(\d+)/i)
  return m ? m[1] : null
}

/**
 * Gera pontos da Curva S baseado no PROGRESSO real de cada parada.
 * Para cada ponto de data, calcula a média ponderada do progresso de todas as paradas.
 * A linha "previsto" assume progresso linear de 0% a 100% entre início e fim de cada parada.
 */
function gerarCurvaS(paradas: Parada[]) {
  if (paradas.length === 0) return []
  const todasDatas = paradas.flatMap(p => [p.dataPrevInicio, p.dataPrevFim]).filter(Boolean).sort()
  if (todasDatas.length < 2) return []

  const inicio = new Date(todasDatas[0] + 'T12:00:00')
  const fim = new Date(todasDatas[todasDatas.length - 1] + 'T12:00:00')
  const totalDias = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / 86400000))

  const steps = Math.min(totalDias + 1, 30)
  const pontos: { data: string; previsto: number; realizado: number }[] = []

  for (let i = 0; i <= steps; i++) {
    const d = Math.round((i / steps) * totalDias)
    const dataAtual = new Date(inicio.getTime() + d * 86400000)
    const dataStr = dataAtual.toISOString().split('T')[0]

    let somaPrevistosPesos = 0
    let somaRealizadosPesos = 0
    let totalPeso = 0

    paradas.forEach(parada => {
      const ordens = parada.ordens || []
      if (ordens.length === 0) return

      const pesoPar = ordens.reduce((s, o) => s + (o.peso || 0), 0)
      if (pesoPar === 0) return
      totalPeso += pesoPar

      // Previsto: progresso linear entre dataPrevInicio e dataPrevFim da parada
      const pInicio = parada.dataPrevInicio
      const pFim = parada.dataPrevFim
      let previstoPar = 0
      if (pInicio && pFim && dataStr >= pFim) {
        previstoPar = 100
      } else if (pInicio && pFim && dataStr >= pInicio) {
        const dInicio = new Date(pInicio + 'T12:00:00').getTime()
        const dFim = new Date(pFim + 'T12:00:00').getTime()
        const dAtual = dataAtual.getTime()
        previstoPar = Math.min(100, ((dAtual - dInicio) / Math.max(1, dFim - dInicio)) * 100)
      }
      somaPrevistosPesos += previstoPar * pesoPar

      // Realizado: progresso atual real da parada (ponderado pelas OSs)
      // Só conta se a parada já começou (dataPrevInicio <= dataStr)
      if (parada.dataPrevInicio && dataStr >= parada.dataPrevInicio) {
        const progReal = calcProgresso(parada)
        somaRealizadosPesos += progReal * pesoPar
      }
    })

    pontos.push({
      data: formatDate(dataStr),
      previsto: totalPeso > 0 ? somaPrevistosPesos / totalPeso : 0,
      realizado: totalPeso > 0 ? somaRealizadosPesos / totalPeso : 0,
    })
  }

  return pontos
}

export default function CurvaS() {
  const navigate = useNavigate()
  const location = useLocation()
  const semanaInicial = (location.state as { semana?: string })?.semana ?? 'todas'

  const [paradas, setParadas] = useState<Parada[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionada, setSelecionada] = useState<string>('todas')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    api.paradas.list().then(setParadas).finally(() => setLoading(false))
  }, [])

  // Filtrar por semana (vinda do estado de navegação)
  const paradasPorSemana = semanaInicial === 'todas'
    ? paradas
    : paradas.filter(p => extrairSemana(p.descricao) === semanaInicial)

  // Filtrar por parada específica
  const paradasFiltradas = selecionada === 'todas'
    ? paradasPorSemana
    : paradasPorSemana.filter(p => p.id === selecionada)

  const pontos = gerarCurvaS(paradasFiltradas)

  const totalOS = paradasFiltradas.flatMap(p => p.ordens || []).length
  const concluidasOS = paradasFiltradas.flatMap(p => p.ordens || []).filter(o => o.concluida).length
  const progGeral = paradasFiltradas.length > 0
    ? paradasFiltradas.reduce((s, p) => s + calcProgresso(p), 0) / paradasFiltradas.length
    : 0

  // Dimensões do gráfico
  const chartW = 800, chartH = 240
  const pad = { top: 20, right: 35, bottom: 38, left: 48 }
  const w = chartW - pad.left - pad.right
  const h = chartH - pad.top - pad.bottom

  function toX(i: number) { return pad.left + (i / Math.max(1, pontos.length - 1)) * w }
  function toY(v: number) { return pad.top + h - (v / 100) * h }

  const prevPath = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.previsto).toFixed(1)}`).join(' ')
  const realPath = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.realizado).toFixed(1)}`).join(' ')

  const xLabels = pontos.length <= 6
    ? pontos.map((_, i) => i)
    : [0, ...Array.from({ length: 4 }, (_, k) => Math.round((k + 1) * (pontos.length - 1) / 5)), pontos.length - 1]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#1e293b] text-white px-8 py-5">
        <div className="max-w-screen-xl mx-auto">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            ← Paradas
          </button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5">ANÁLISE</p>
              <h1 className="text-xl font-black">
                Curva S — Progresso
                {semanaInicial !== 'todas' && (
                  <span className="ml-2 text-sm font-semibold text-white/60">· Semana {semanaInicial}</span>
                )}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 max-w-screen-xl mx-auto space-y-4">

        {/* Filtro por parada */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Filtrar por parada</p>
          <select
            className="w-full sm:w-80 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            value={selecionada}
            onChange={e => setSelecionada(e.target.value)}
          >
            <option value="todas">
              Todas as paradas{semanaInicial !== 'todas' ? ` (Sem. ${semanaInicial})` : ''}
            </option>
            {paradasPorSemana.map(p => <option key={p.id} value={p.id}>{p.equipamento}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-brand">{paradasFiltradas.length}</p>
            <p className="text-xs text-slate-500">Paradas</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-green-600">{concluidasOS}/{totalOS}</p>
            <p className="text-xs text-slate-500">OSs</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-slate-700">{progGeral.toFixed(0)}%</p>
            <p className="text-xs text-slate-500">Progresso</p>
          </div>
        </div>

        {/* Gráfico */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 shadow-sm">
            <p className="text-sm">Carregando...</p>
          </div>
        ) : pontos.length < 2 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <p className="text-sm text-slate-500">Dados insuficientes para gerar a curva.</p>
            <p className="text-xs text-slate-400 mt-1">Cadastre OSs com datas e pesos para visualizar.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            {/* Legenda */}
            <div className="flex items-center gap-5 mb-3 text-xs">
              <div className="flex items-center gap-1.5">
                <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,3" /></svg>
                <span className="text-slate-500">Previsto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#F97316" strokeWidth="2.5" /></svg>
                <span className="text-slate-500">Realizado</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full"
                style={{ minWidth: 420 }}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Grid horizontal */}
                {[0, 25, 50, 75, 100].map(v => (
                  <g key={v}>
                    <line x1={pad.left} y1={toY(v)} x2={pad.left + w} y2={toY(v)} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={pad.left - 6} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{v}%</text>
                  </g>
                ))}

                {/* Eixo X */}
                {xLabels.map(idx => (
                  <text key={idx} x={toX(idx)} y={chartH - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">
                    {pontos[idx]?.data}
                  </text>
                ))}

                {/* Linha previsto */}
                <path d={prevPath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />

                {/* Linha realizado */}
                <path d={realPath} fill="none" stroke="#F97316" strokeWidth="2.5" />

                {/* Pontos + rótulos realizado */}
                {pontos.map((p, i) => {
                  const cx = toX(i)
                  const cy = toY(p.realizado)
                  const isHovered = hoveredIdx === i
                  const showLabel = isHovered || i === 0 || i === pontos.length - 1 || (p.realizado > 0 && i % Math.max(1, Math.floor(pontos.length / 8)) === 0)
                  const labelAbove = cy > pad.top + 22
                  return (
                    <g key={i}>
                      <rect
                        x={cx - 14} y={pad.top} width={28} height={h}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIdx(i)}
                      />
                      <circle cx={cx} cy={cy} r={isHovered ? 5 : 3.5} fill={isHovered ? '#ea6c0a' : '#F97316'} stroke="white" strokeWidth="1.5" />
                      {showLabel && p.realizado > 0 && (
                        <g>
                          <rect
                            x={cx - 20} y={labelAbove ? cy - 22 : cy + 6}
                            width={40} height={15} rx={4} fill="#F97316" opacity="0.92"
                          />
                          <text
                            x={cx} y={labelAbove ? cy - 11 : cy + 16}
                            textAnchor="middle" fontSize="9" fill="white" fontWeight="bold"
                          >
                            {p.realizado.toFixed(1)}%
                          </text>
                        </g>
                      )}
                      {/* Tooltip hover */}
                      {isHovered && (
                        <g>
                          <rect
                            x={Math.min(cx - 44, chartW - 100)} y={pad.top + 2}
                            width={92} height={46} rx={6} fill="#1e293b" opacity="0.92"
                          />
                          <text x={Math.min(cx + 2, chartW - 50)} y={pad.top + 16} textAnchor="middle" fontSize="9" fill="#94a3b8">{p.data}</text>
                          <text x={Math.min(cx + 2, chartW - 50)} y={pad.top + 29} textAnchor="middle" fontSize="9" fill="#94a3b8">Prev: {p.previsto.toFixed(1)}%</text>
                          <text x={Math.min(cx + 2, chartW - 50)} y={pad.top + 42} textAnchor="middle" fontSize="9" fill="#F97316">Real: {p.realizado.toFixed(1)}%</text>
                        </g>
                      )}
                    </g>
                  )
                })}

                {/* Ponto final previsto */}
                <circle
                  cx={toX(pontos.length - 1)} cy={toY(pontos[pontos.length - 1]?.previsto || 0)}
                  r={3} fill="#94a3b8" stroke="white" strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Lista de paradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paradasFiltradas.map(p => {
            const prog = calcProgresso(p)
            const semana = extrairSemana(p.descricao)
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/parada/${p.id}`)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{p.equipamento}</p>
                    {p.descricao && <p className="text-xs text-slate-500 truncate">{p.descricao}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className="text-lg font-black text-brand">{prog.toFixed(0)}%</span>
                    {semana && (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Sem. {semana}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-2">{formatDate(p.dataPrevInicio)} → {formatDate(p.dataPrevFim)}</p>
                <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${prog >= 100 ? 'bg-green-500' : prog > 0 ? 'bg-brand' : 'bg-slate-200'}`}
                    style={{ width: `${Math.min(prog, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
