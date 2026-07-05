import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, type OrdemServico, type Parada } from '../lib/api'
import NovaOSModal from './NovaOSModal'
import ImportarOSModal from './ImportarOSModal'

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

function formatDate(d?: string | null) {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function DetalheParada() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [parada, setParada] = useState<Parada | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNovaOS, setShowNovaOS] = useState(false)
  const [editandoOS, setEditandoOS] = useState<OrdemServico | null>(null)
  const [showImportar, setShowImportar] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [deletingOsId, setDeletingOsId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const todas = await api.paradas.list()
      setParada(todas.find(p => p.id === id) || null)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function toggleConcluida(os: OrdemServico) {
    await api.ordens.update({ ...os, concluida: !os.concluida, progressoOs: !os.concluida ? 100 : os.progressoOs })
    carregar()
  }

  async function handleDeleteOS(osId: string) {
    if (deletingOsId === osId) {
      await api.ordens.delete(osId)
      setDeletingOsId(null)
      carregar()
    } else {
      setDeletingOsId(osId)
      setTimeout(() => setDeletingOsId(null), 3000)
    }
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚙️</div>
        <p style={{ fontSize: '14px' }}>Carregando...</p>
      </div>
    </div>
  )

  if (!parada) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '16px' }}>Parada não encontrada</p>
        <button onClick={() => navigate('/')} style={{ background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>← Voltar</button>
      </div>
    </div>
  )

  const prog = calcProgresso(parada)
  const totalOS = parada.ordens?.length || 0
  const concluidasOS = parada.ordens?.filter(o => o.concluida).length || 0
  const totalHH = parada.ordens?.reduce((s, o) => s + (o.homemDia || 0), 0) || 0
  const totalHoras = parada.ordens?.reduce((s, o) => s + (o.horaDia || 0), 0) || 0

  const ordensFiltradas = (parada.ordens || []).filter(os => {
    if (!filtro) return true
    const q = filtro.toLowerCase()
    return os.descricao?.toLowerCase().includes(q) || (os.numeroOrdem || '').toLowerCase().includes(q)
  })

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>

      {/* Header da parada */}
      <div style={{ background: '#1e293b', color: 'white', padding: '12px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >← Paradas</button>
          <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>/ EQUIPAMENTO</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, lineHeight: 1.2 }}>{parada.equipamento}</h1>
            <div style={{ display: 'flex', gap: '12px', marginTop: '2px', flexWrap: 'wrap' }}>
              {parada.descricao && <span style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{parada.descricao}</span>}
              <span style={{ fontSize: '12px', opacity: 0.6 }}>📅 {formatDate(parada.dataPrevInicio)} → {formatDate(parada.dataPrevFim)}</span>
            </div>
          </div>

          {/* Stats inline */}
          <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#fb923c', margin: 0 }}>{totalOS}</p>
              <p style={{ fontSize: '10px', opacity: 0.5, margin: 0 }}>OSs</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80', margin: 0 }}>{concluidasOS}/{totalOS}</p>
              <p style={{ fontSize: '10px', opacity: 0.5, margin: 0 }}>Concluídas</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0 }}>{totalHH.toFixed(1)}</p>
              <p style={{ fontSize: '10px', opacity: 0.5, margin: 0 }}>HH Total</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0 }}>{totalHoras.toFixed(1)}h</p>
              <p style={{ fontSize: '10px', opacity: 0.5, margin: 0 }}>Horas</p>
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <span style={{ fontSize: '11px', opacity: 0.5, whiteSpace: 'nowrap' }}>Progresso geral</span>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: prog >= 100 ? '#4ade80' : '#f97316', width: `${Math.min(prog, 100)}%`, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>{prog.toFixed(0)}%</span>
        </div>
      </div>

      {/* Barra de ações */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '8px 32px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={() => { setEditandoOS(null); setShowNovaOS(true) }}
          style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >+ Nova OS</button>
        <button
          onClick={() => setShowImportar(true)}
          style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >↑ Importar OSs</button>
        <input
          type="text"
          placeholder="Buscar OS por descrição ou número..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{ flex: 1, maxWidth: '360px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', outline: 'none', background: '#f8fafc', color: '#1e293b' }}
        />
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{ordensFiltradas.length} ordem{ordensFiltradas.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabela de OSs */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 32px' }}>
        {ordensFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '60px', color: '#94a3b8' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Nenhuma OS cadastrada</p>
            <p style={{ fontSize: '12px', marginTop: '6px' }}>Clique em "+ Nova OS" ou "Importar OSs" para adicionar.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '120px' }}>Nº OS / Peso</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descrição</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '160px', whiteSpace: 'nowrap' }}>Período</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '100px', whiteSpace: 'nowrap' }}>Horário</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '100px' }}>Especialidade</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '60px' }}>HH</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '70px' }}>h/dia</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '130px' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', width: '70px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordensFiltradas.map((os, idx) => {
                const isCritico = os.caminhoCritico === 'Sim'
                const isDeleting = deletingOsId === os.id
                const progOS = os.concluida ? 100 : (os.progressoOs ?? 0)
                const rowBg = os.concluida ? '#f0fdf4' : (idx % 2 === 0 ? 'white' : '#fafafa')
                const borderColor = isCritico ? '#fecaca' : '#f1f5f9'
                const leftBorderColor = isCritico ? '#ef4444' : os.concluida ? '#22c55e' : '#e2e8f0'
                return (
                  <tr key={os.id} style={{ background: rowBg }}>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, borderLeft: `3px solid ${leftBorderColor}` }}>
                      {os.numeroOrdem && (
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#f97316', margin: 0 }}>#{os.numeroOrdem}</p>
                      )}
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '3px' }}>
                        {os.peso > 0 && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '99px' }}>{os.peso.toFixed(1)}%</span>
                        )}
                        {isCritico && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: '99px' }}>⚠ Crítico</span>
                        )}
                        {os.tipoOs === 'OS Adicional' && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: '#fefce8', color: '#a16207', padding: '1px 6px', borderRadius: '99px' }}>Adicional</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}` }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>{os.descricao}</p>
                      {progOS > 0 && !os.concluida && (
                        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#f97316', borderRadius: '99px', width: `${progOS}%` }} />
                          </div>
                          <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{progOS}%</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDate(os.dataPrevInicio)}<br /><span style={{ opacity: 0.7 }}>→ {formatDate(os.dataPrevFim)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {os.horaPrevInicio || '-'}
                      {os.horaPrevFim && <><br /><span style={{ opacity: 0.7 }}>→ {os.horaPrevFim}</span></>}
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, fontSize: '12px', color: '#64748b' }}>
                      {os.especialidade || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, fontSize: '13px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>
                      {os.homemDia || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, fontSize: '13px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>
                      {os.horaDia ? `${os.horaDia}h` : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, textAlign: 'center' }}>
                      <button
                        onClick={() => toggleConcluida(os)}
                        style={{
                          border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                          background: os.concluida ? '#dcfce7' : '#f1f5f9',
                          color: os.concluida ? '#15803d' : '#475569'
                        }}
                      >
                        {os.concluida ? '✅ Concluída' : '○ Concluir'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => { setEditandoOS(os); setShowNovaOS(true) }}
                          style={{ width: '26px', height: '26px', border: 'none', borderRadius: '6px', background: '#f1f5f9', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Editar"
                        >✏️</button>
                        <button
                          onClick={() => handleDeleteOS(os.id)}
                          style={{ width: '26px', height: '26px', border: 'none', borderRadius: '6px', background: isDeleting ? '#ef4444' : '#fff1f2', cursor: 'pointer', fontSize: '12px', color: isDeleting ? 'white' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title={isDeleting ? 'Clique para confirmar exclusão' : 'Excluir'}
                        >{isDeleting ? '✓' : '🗑️'}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showNovaOS && (
        <NovaOSModal
          os={editandoOS}
          paradaId={parada.id}
          paradaDataInicio={parada.dataPrevInicio}
          paradaDataFim={parada.dataPrevFim}
          onClose={() => { setShowNovaOS(false); setEditandoOS(null) }}
          onSaved={() => { carregar(); setShowNovaOS(false); setEditandoOS(null) }}
        />
      )}
      {showImportar && (
        <ImportarOSModal
          paradaId={parada.id}
          paradaDataInicio={parada.dataPrevInicio}
          onClose={() => setShowImportar(false)}
          onSaved={() => { carregar(); setShowImportar(false) }}
        />
      )}
    </div>
  )
}
