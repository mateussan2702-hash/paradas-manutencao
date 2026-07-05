import { useState, useEffect } from 'react'
import { api, type OrdemServico } from '../lib/api'

function gerarId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

type Props = {
  os: OrdemServico | null
  paradaId: string
  paradaDataInicio: string
  paradaDataFim: string
  onClose: () => void
  onSaved: () => void
}

export default function NovaOSModal({ os, paradaId, paradaDataInicio, paradaDataFim, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    numeroOrdem: '',
    descricao: '',
    homemDia: '',
    horaDia: '',
    dataPrevInicio: paradaDataInicio,
    dataPrevFim: paradaDataFim,
    horaPrevInicio: '',
    horaPrevFim: '',
    dataRealInicio: '',
    dataRealFim: '',
    horaRealInicio: '',
    horaRealFim: '',
    peso: '',
    concluida: false,
    observacao: '',
    pessoasExecutando: '',
    progressoOs: '',
    tipoAtividade: '',
    especialidade: '',
    caminhoCritico: 'Não',
    tipoOs: 'OS Programada',
  })

  useEffect(() => {
    if (os) {
      setForm({
        numeroOrdem: os.numeroOrdem || '',
        descricao: os.descricao || '',
        homemDia: os.homemDia?.toString() || '',
        horaDia: os.horaDia?.toString() || '',
        dataPrevInicio: os.dataPrevInicio || paradaDataInicio,
        dataPrevFim: os.dataPrevFim || paradaDataFim,
        horaPrevInicio: os.horaPrevInicio || '',
        horaPrevFim: os.horaPrevFim || '',
        dataRealInicio: os.dataRealInicio || '',
        dataRealFim: os.dataRealFim || '',
        horaRealInicio: os.horaRealInicio || '',
        horaRealFim: os.horaRealFim || '',
        peso: os.peso?.toString() || '',
        concluida: os.concluida || false,
        observacao: os.observacao || '',
        pessoasExecutando: os.pessoasExecutando?.toString() || '',
        progressoOs: os.progressoOs?.toString() || '',
        tipoAtividade: os.tipoAtividade || '',
        especialidade: os.especialidade || '',
        caminhoCritico: os.caminhoCritico || 'Não',
        tipoOs: os.tipoOs || 'OS Programada',
      })
    }
  }, [os, paradaDataInicio, paradaDataFim])

  useEffect(() => {
    if (form.horaPrevInicio && form.horaDia) {
      const [h, m] = form.horaPrevInicio.split(':').map(Number)
      const totalMin = h * 60 + m + parseFloat(form.horaDia) * 60
      const hFim = Math.floor(totalMin / 60) % 24
      const mFim = totalMin % 60
      setForm(f => ({ ...f, horaPrevFim: `${String(hFim).padStart(2, '0')}:${String(mFim).padStart(2, '0')}` }))
    }
  }, [form.horaPrevInicio, form.horaDia])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const data: OrdemServico = {
        id: os?.id || gerarId(),
        paradaId,
        numeroOrdem: form.numeroOrdem || null,
        descricao: form.descricao,
        homemDia: form.homemDia ? parseFloat(form.homemDia) : null,
        horaDia: form.horaDia ? parseFloat(form.horaDia) : null,
        dataPrevInicio: form.dataPrevInicio,
        dataPrevFim: form.dataPrevFim,
        horaPrevInicio: form.horaPrevInicio || null,
        horaPrevFim: form.horaPrevFim || null,
        dataRealInicio: form.dataRealInicio || null,
        dataRealFim: form.dataRealFim || null,
        horaRealInicio: form.horaRealInicio || null,
        horaRealFim: form.horaRealFim || null,
        peso: form.peso ? parseFloat(form.peso) : 0,
        concluida: form.concluida,
        observacao: form.observacao || null,
        pessoasExecutando: form.pessoasExecutando ? parseFloat(form.pessoasExecutando) : null,
        progressoOs: form.progressoOs ? parseFloat(form.progressoOs) : null,
        tipoAtividade: form.tipoAtividade || null,
        especialidade: form.especialidade || null,
        caminhoCritico: form.caminhoCritico || null,
        tipoOs: form.tipoOs || null,
      }
      if (os) {
        await api.ordens.update(data)
      } else {
        await api.ordens.create(data)
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
      <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{os ? 'Editar OS' : 'Nova OS'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label style={lbl}>Número da OS</label>
                <input style={inp} value={form.numeroOrdem} onChange={e => setForm(f => ({ ...f, numeroOrdem: e.target.value }))} placeholder="Ex: 12345" />
              </div>
              <div>
                <label style={lbl}>Descrição *</label>
                <input required style={inp} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição da OS" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Homem/Dia</label>
                <input type="number" step="0.1" style={inp} value={form.homemDia} onChange={e => setForm(f => ({ ...f, homemDia: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Hora/Dia</label>
                <input type="number" step="0.5" style={inp} value={form.horaDia} onChange={e => setForm(f => ({ ...f, horaDia: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Peso (%)</label>
                <input type="number" step="0.1" style={inp} value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Data Prev. Início *</label>
                <input required type="date" style={inp} value={form.dataPrevInicio} onChange={e => setForm(f => ({ ...f, dataPrevInicio: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Data Prev. Fim *</label>
                <input required type="date" style={inp} value={form.dataPrevFim} onChange={e => setForm(f => ({ ...f, dataPrevFim: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Hora Prev. Início</label>
                <input type="time" style={inp} value={form.horaPrevInicio} onChange={e => setForm(f => ({ ...f, horaPrevInicio: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Hora Prev. Fim (auto)</label>
                <input type="time" style={inp} value={form.horaPrevFim} onChange={e => setForm(f => ({ ...f, horaPrevFim: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Especialidade</label>
                <select style={inp} value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))}>
                  <option value="">-</option>
                  <option>Mecânica</option>
                  <option>Elétrica</option>
                  <option>Lubrificação</option>
                  <option>Inspeção</option>
                  <option>Caldeiraria</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Tipo de Atividade</label>
                <input style={inp} value={form.tipoAtividade} onChange={e => setForm(f => ({ ...f, tipoAtividade: e.target.value }))} placeholder="Ex: A04" />
              </div>
              <div>
                <label style={lbl}>Tipo de OS</label>
                <select style={inp} value={form.tipoOs} onChange={e => setForm(f => ({ ...f, tipoOs: e.target.value }))}>
                  <option>OS Programada</option>
                  <option>OS Adicional</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Progresso (%)</label>
                <input type="number" min="0" max="100" style={inp} value={form.progressoOs} onChange={e => setForm(f => ({ ...f, progressoOs: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>HH Executado</label>
                <input type="number" step="0.5" style={inp} value={form.pessoasExecutando} onChange={e => setForm(f => ({ ...f, pessoasExecutando: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Caminho Crítico?</label>
                <select style={inp} value={form.caminhoCritico} onChange={e => setForm(f => ({ ...f, caminhoCritico: e.target.value }))}>
                  <option>Não</option>
                  <option>Sim</option>
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>Observação</label>
              <textarea style={{ ...inp, height: 60, resize: 'vertical' }} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="concluida" checked={form.concluida} onChange={e => setForm(f => ({ ...f, concluida: e.target.checked }))} />
              <label htmlFor="concluida" style={{ fontSize: 14, color: '#475569' }}>OS Concluída</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Salvando...' : os ? 'Salvar' : 'Criar OS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#1e293b', background: '#f8fafc' }
