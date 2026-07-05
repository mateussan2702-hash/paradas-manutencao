import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Plus, Trash2, Pencil } from 'lucide-react'
import { api, type Parada } from '../lib/api'
import NovaParadaModal from './NovaParadaModal'

function formatDate(d?: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function calcProgresso(parada: Parada): number {
  const ordens = parada.ordens || []
  if (ordens.length === 0) return 0
  const totalHoras = ordens.reduce((s, o) => s + (o.horaDia || 0), 0)
  if (totalHoras === 0) {
    const conc = ordens.filter(o => o.concluida).length
    return (conc / ordens.length) * 100
  }
  const progPonderado = ordens.reduce((s, o) => {
    const prog = o.concluida ? 100 : (o.progressoOs ?? 0)
    return s + (o.horaDia || 0) * prog
  }, 0)
  return progPonderado / totalHoras
}

function getStatus(parada: Parada) {
  if (parada.dataRealFim) return { label: 'Concluída', cls: 'bg-green-100 text-green-700' }
  if (parada.dataRealInicio) return { label: 'Em Andamento', cls: 'bg-orange-100 text-orange-700' }
  return { label: 'Aguardando', cls: 'bg-slate-100 text-slate-500' }
}

export default function Home() {
  const navigate = useNavigate()
  const [paradas, setParadas] = useState<Parada[]>([])
  const [loading, setLoading] = useState(true)
  const [showNova, setShowNova] = useState(false)
  const [editando, setEditando] = useState<Parada | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.paradas.list()
      setParadas(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
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

  const sorted = [...paradas].sort(
    (a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime()
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-brand text-white px-6 pt-8 pb-5 safe-top">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">PLANEJAMENTO HME</p>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-black leading-tight">
              Acompanhamento de<br />programação de manutenção
            </h1>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate('/curva')}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
              >
                <TrendingUp size={14} />
                Curva S
              </button>
              <button
                onClick={() => { setEditando(null); setShowNova(true) }}
                className="flex items-center gap-1.5 bg-white text-brand font-bold text-xs px-3 py-2 rounded-xl shadow hover:bg-gray-100 active:scale-95 transition-all shrink-0"
              >
                <Plus size={14} />
                Nova Parada
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3 pb-10">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm font-medium">Carregando paradas...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">🔧</div>
            <p className="text-base font-semibold text-slate-500">Nenhuma parada</p>
            <p className="text-sm mt-1">Clique em "Nova Parada" para registrar a primeira parada de equipamento.</p>
          </div>
        ) : (
          sorted.map(parada => {
            const prog = calcProgresso(parada)
            const status = getStatus(parada)
            const totalOS = parada.ordens?.length || 0
            const concluidasOS = parada.ordens?.filter(o => o.concluida).length || 0
            const isDeleting = deletingId === parada.id

            return (
              <div
                key={parada.id}
                className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand transition-all"
              >
                {/* Badge de status */}
                <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${isDeleting ? 'bg-red-100 text-red-600' : status.cls}`}>
                  {isDeleting ? '⚠ Toque para confirmar' : status.label}
                </div>

                {/* Conteúdo clicável */}
                <button
                  className="w-full text-left p-4 pr-24 active:scale-[0.99] transition-transform"
                  onClick={() => navigate(`/parada/${parada.id}`)}
                >
                  <p className="font-bold text-slate-800 text-base leading-tight truncate">{parada.equipamento}</p>
                  {parada.descricao && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{parada.descricao}</p>
                  )}
                  <div className="flex gap-4 text-xs text-slate-500 mt-2 mb-1">
                    <span>📅 {formatDate(parada.dataPrevInicio)} → {formatDate(parada.dataPrevFim)}</span>
                    <span>📋 {concluidasOS}/{totalOS} OSs</span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                    <div
                      className="absolute inset-y-0 left-0 bg-brand-light rounded-full"
                      style={{ width: `${Math.min(100, prog)}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 bg-brand rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, prog)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-400">0%</span>
                    <span className={`font-bold ${prog >= 100 ? 'text-green-600' : 'text-brand'}`}>
                      {prog.toFixed(1)}% concluído
                    </span>
                    <span className="text-slate-400">100%</span>
                  </div>
                </button>

                {/* Botões de ação */}
                <div className="flex border-t border-slate-100">
                  <button
                    onClick={() => { setEditando(parada); setShowNova(true) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-brand hover:bg-slate-50 transition-colors rounded-bl-2xl"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <div className="w-px bg-slate-100" />
                  <button
                    onClick={() => handleDelete(parada.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors rounded-br-2xl ${isDeleting ? 'text-red-600 bg-red-50' : 'text-slate-500 hover:text-red-500 hover:bg-red-50'}`}
                  >
                    <Trash2 size={13} /> {isDeleting ? 'Confirmar exclusão' : 'Excluir'}
                  </button>
                </div>
              </div>
            )
          })
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
