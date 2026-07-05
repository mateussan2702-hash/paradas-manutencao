import { useState, useEffect } from 'react'
import { api, type Parada } from '../lib/api'

function gerarId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

type Props = {
  parada: Parada | null
  onClose: () => void
  onSaved: () => void
}

export default function NovaParadaModal({ parada, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    equipamento: '',
    descricao: '',
    dataPrevInicio: '',
    dataPrevFim: '',
    horaPrevInicio: '',
    horaPrevFim: '',
    dataRealInicio: '',
    dataRealFim: '',
    horaRealInicio: '',
    horaRealFim: '',
  })

  useEffect(() => {
    if (parada) {
      setForm({
        equipamento: parada.equipamento || '',
        descricao: parada.descricao || '',
        dataPrevInicio: parada.dataPrevInicio || '',
        dataPrevFim: parada.dataPrevFim || '',
        horaPrevInicio: parada.horaPrevInicio || '',
        horaPrevFim: parada.horaPrevFim || '',
        dataRealInicio: parada.dataRealInicio || '',
        dataRealFim: parada.dataRealFim || '',
        horaRealInicio: parada.horaRealInicio || '',
        horaRealFim: parada.horaRealFim || '',
      })
    }
  }, [parada])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        descricao: form.descricao || null,
        horaPrevInicio: form.horaPrevInicio || null,
        horaPrevFim: form.horaPrevFim || null,
        dataRealInicio: form.dataRealInicio || null,
        dataRealFim: form.dataRealFim || null,
        horaRealInicio: form.horaRealInicio || null,
        horaRealFim: form.horaRealFim || null,
      }
      if (parada) {
        await api.paradas.update({ id: parada.id, ...payload })
      } else {
        await api.paradas.create({ id: gerarId(), criadaEm: new Date().toISOString(), ...payload } as Parada)
      }
      onSaved()
    } catch (e) {
      console.error(e)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{parada ? 'Editar Parada' : 'Nova Parada'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={labelStyle}>Equipamento *</label>
              <input required style={inputStyle} value={form.equipamento} onChange={e => setForm(f => ({ ...f, equipamento: e.target.value }))} placeholder="Ex: JCB 01" />
            </div>
            <div>
              <label style={labelStyle}>Descrição</label>
              <input style={inputStyle} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: PREVENTIVA SEM 22" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Data Prev. Início *</label>
                <input required type="date" style={inputStyle} value={form.dataPrevInicio} onChange={e => setForm(f => ({ ...f, dataPrevInicio: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Data Prev. Fim *</label>
                <input required type="date" style={inputStyle} value={form.dataPrevFim} onChange={e => setForm(f => ({ ...f, dataPrevFim: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Hora Prev. Início</label>
                <input type="time" style={inputStyle} value={form.horaPrevInicio} onChange={e => setForm(f => ({ ...f, horaPrevInicio: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Hora Prev. Fim</label>
                <input type="time" style={inputStyle} value={form.horaPrevFim} onChange={e => setForm(f => ({ ...f, horaPrevFim: e.target.value }))} />
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>REALIZADO (opcional)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Data Real Início</label>
                  <input type="date" style={inputStyle} value={form.dataRealInicio} onChange={e => setForm(f => ({ ...f, dataRealInicio: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Data Real Fim</label>
                  <input type="date" style={inputStyle} value={form.dataRealFim} onChange={e => setForm(f => ({ ...f, dataRealFim: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={labelStyle}>Hora Real Início</label>
                  <input type="time" style={inputStyle} value={form.horaRealInicio} onChange={e => setForm(f => ({ ...f, horaRealInicio: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Hora Real Fim</label>
                  <input type="time" style={inputStyle} value={form.horaRealFim} onChange={e => setForm(f => ({ ...f, horaRealFim: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, color: '#475569', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Salvando...' : parada ? 'Salvar' : 'Criar Parada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#1e293b', background: '#f8fafc' }
