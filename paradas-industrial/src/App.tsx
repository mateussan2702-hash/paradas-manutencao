import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Parada } from './lib/api'
import NovaParadaModal from './pages/NovaParadaModal'

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

function statusParada(parada: Parada) {
  if (parada.dataRealFim) return { label: 'Concluída', bg: '#dcfce7', color: '#15803d' }
  if (parada.dataRealInicio) return { label: 'Em Andamento', bg: '#fff7ed', color: '#c2410c' }
  return { label: 'Planejada', bg: '#f1f5f9', color: '#64748b' }
}

function extrairSemana(texto?: string | null): string | null {
  if (!texto) return null
  const m = texto.match(/SEM\s*(\d+)/i)
  return m ? m[1] : null
}

export default function App() {
  const navigate = useNavigate()
  const [paradas, setParadas] = useState<Parada[]>([])
  const [loading, setLoading] = useState(true)
  const [showNova, setShowNova] = useState(false)
  const [editando, setEditando] = useState<Parada | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [semanaFiltro, setSemanaFiltro] = useState<string>('todas')

  const carregar = useCallback(async () => {
    setLoading(true)
    try { setParadas(await api.paradas.list()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleDelete(id: string) {
    if (deletingId === id) {
      await api.paradas.delete(id)
      setDeletingId(null)
      carregar()
    } else {
      setDeletingId(id)
      setTimeout(() => setDeletingId(null), 3000)
    }
  }

  const semanasDisponiveis = Array.from(
    new Set(paradas.map(p => extrairSemana(p.descricao)).filter((s): s is string => s !== null))
  ).sort((a, b) => Number(a) - Number(b))

  const paradasFiltradas = semanaFiltro === 'todas'
    ? paradas
    : paradas.filter(p => extrairSemana(p.descricao) === semanaFiltro)

  const sorted = [...paradasFiltradas].sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime())

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', color: 'white', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', opacity: 0.5, margin: 0, textTransform: 'uppercase' }}>PLANEJAMENTO HME</p>
          <h1 style={{ fontSize: '16px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Acompanhamento de programação de manutenção</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {semanasDisponiveis.length > 0 && (
            <select
              value={semanaFiltro}
              onChange={e => setSemanaFiltro(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
            >
              <option value="todas" style={{ background: '#1e293b' }}>Todas as semanas</option>
              {semanasDisponiveis.map(s => (
                <option key={s} value={s} style={{ background: '#1e293b' }}>Semana {s}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => navigate('/curva', { state: { semana: semanaFiltro } })}
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >📈 Curva S</button>
          <button
            onClick={() => { setEditando(null); setShowNova(true) }}
            style={{ background: 'white', color: '#1e293b', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >+ Nova Parada</button>
        </div>
      </div>

      {/* Conteúdo com scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '80px', color: '#94a3b8' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚙️</div>
            <p style={{ fontSize: '14px' }}>Carregando paradas...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '80px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔧</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>Nenhuma parada</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              {semanaFiltro !== 'todas' ? `Nenhuma parada para a Semana ${semanaFiltro}.` : 'Clique em "+ Nova Parada" para começar.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {sorted.map(parada => {
              const prog = calcProgresso(parada)
              const status = statusParada(parada)
              const totalOS = parada.ordens?.length || 0
              const concluidasOS = parada.ordens?.filter(o => o.concluida).length || 0
              const isDeleting = deletingId === parada.id
              return (
                <div
                  key={parada.id}
                  onClick={() => navigate(`/parada/${parada.id}`)}
                  style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
                >
                  {/* Linha topo: nome + ações */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{parada.equipamento}</h2>
                      {parada.descricao && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{parada.descricao}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={e => { e.stopPropagation(); setEditando(parada); setShowNova(true) }}
                        style={{ width: '28px', height: '28px', border: 'none', borderRadius: '8px', background: '#f1f5f9', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >✏️</button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(parada.id) }}
                        style={{ width: '28px', height: '28px', border: 'none', borderRadius: '8px', background: isDeleting ? '#ef4444' : '#fff1f2', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDeleting ? 'white' : '#f87171' }}
                      >{isDeleting ? '✓' : '🗑️'}</button>
                    </div>
                  </div>

                  {/* Badge status */}
                  <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: status.bg, color: status.color, marginBottom: '10px' }}>
                    {status.label}
                  </span>

                  {/* Datas e OSs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    <span>📅 {formatDate(parada.dataPrevInicio)} → {formatDate(parada.dataPrevFim)}</span>
                    <span style={{ color: '#cbd5e1' }}>·</span>
                    <span>📋 {concluidasOS}/{totalOS} OSs</span>
                  </div>

                  {/* Barra de progresso */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '99px', background: prog >= 100 ? '#22c55e' : prog > 0 ? '#f97316' : '#e2e8f0', width: `${Math.min(prog, 100)}%`, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', minWidth: '36px', textAlign: 'right' }}>{prog.toFixed(0)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showNova && (
        <NovaParadaModal
          parada={editando}
          onClose={() => { setShowNova(false); setEditando(null) }}
          onSaved={() => { carregar(); setShowNova(false); setEditando(null) }}
        />
      )}
    </div>
  )
}
