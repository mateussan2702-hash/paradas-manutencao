import { useState } from 'react'
import { api, type OrdemServico } from '../lib/api'

function gerarId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const DIAS_SEMANA: Record<string, number> = {
  'domingo': 0, 'segunda': 1, 'segunda-feira': 1, 'terça': 2, 'terca': 2, 'terça-feira': 2, 'terca-feira': 2,
  'quarta': 3, 'quarta-feira': 3, 'quinta': 4, 'quinta-feira': 4, 'sexta': 5, 'sexta-feira': 5, 'sábado': 6, 'sabado': 6,
}

function diaSemanaParaData(nomeDia: string, dataInicio: string): string {
  const diaTarget = DIAS_SEMANA[nomeDia.toLowerCase().trim()]
  if (diaTarget === undefined) return dataInicio
  const inicio = new Date(dataInicio + 'T12:00:00')
  const diaAtual = inicio.getDay()
  let diff = diaTarget - diaAtual
  if (diff < 0) diff += 7
  const data = new Date(inicio)
  data.setDate(data.getDate() + diff)
  return data.toISOString().split('T')[0]
}

type OSPreview = {
  numeroOrdem: string
  descricao: string
  homemDia: number
  horaDia: number
  dataPrevInicio: string
  dataPrevFim: string
  especialidade: string
  tipoAtividade: string
  caminhoCritico: string
  tipoOs: string
  peso: number
}

type Props = {
  paradaId: string
  paradaDataInicio: string
  onClose: () => void
  onSaved: () => void
}

export default function ImportarOSModal({ paradaId, paradaDataInicio, onClose, onSaved }: Props) {
  const [texto, setTexto] = useState('')
  const [preview, setPreview] = useState<OSPreview[]>([])
  const [etapa, setEtapa] = useState<'colar' | 'revisar'>('colar')
  const [erro, setErro] = useState('')
  const [importando, setImportando] = useState(false)

  function parsearTexto() {
    setErro('')
    const linhas = texto.trim().split('\n').filter(l => l.trim())
    if (linhas.length === 0) { setErro('Cole os dados da planilha'); return }

    const cabecalho = linhas[0].split('\t').map(c => c.trim().toLowerCase())
    const idxNum = cabecalho.findIndex(c => c.includes('número') || c.includes('numero') || c === 'os' || c.includes('ordem'))
    const idxDesc = cabecalho.findIndex(c => c.includes('descrição') || c.includes('descricao') || c.includes('atividade') || c.includes('serviço'))
    const idxHH = cabecalho.findIndex(c => c.includes('homem') || c === 'hh' || c.includes('h/h'))
    const idxHoras = cabecalho.findIndex(c => c.includes('hora/dia') || c.includes('h/dia') || c.includes('duração'))
    const idxDia = cabecalho.findIndex(c => c === 'dia' || c.includes('dia semana'))
    const idxEsp = cabecalho.findIndex(c => c.includes('especialidade') || c.includes('disciplina'))
    const idxTipo = cabecalho.findIndex(c => c.includes('tipo ativ') || c.includes('código'))
    const idxCritico = cabecalho.findIndex(c => c.includes('crítico') || c.includes('critico'))
    const idxTipoOs = cabecalho.findIndex(c => c.includes('tipo de os') || c.includes('tipo os'))

    const temCabecalho = idxDesc >= 0 || idxNum >= 0
    const inicio = temCabecalho ? 1 : 0

    const osMap = new Map<string, OSPreview>()

    for (let i = inicio; i < linhas.length; i++) {
      const cols = linhas[i].split('\t')
      const num = idxNum >= 0 ? cols[idxNum]?.trim() : ''
      const desc = idxDesc >= 0 ? cols[idxDesc]?.trim() : cols[1]?.trim() || ''
      if (!desc) continue

      const hh = parseFloat((idxHH >= 0 ? cols[idxHH] : cols[2])?.replace(',', '.') || '0') || 0
      const horas = parseFloat((idxHoras >= 0 ? cols[idxHoras] : cols[3])?.replace(',', '.') || '0') || 0
      const diaStr = idxDia >= 0 ? cols[idxDia]?.trim() : ''
      const esp = idxEsp >= 0 ? cols[idxEsp]?.trim() : ''
      const tipo = idxTipo >= 0 ? cols[idxTipo]?.trim() : ''
      const critico = idxCritico >= 0 ? (cols[idxCritico]?.trim().toLowerCase().includes('sim') ? 'Sim' : 'Não') : 'Não'
      const tipoOs = idxTipoOs >= 0 ? cols[idxTipoOs]?.trim() : 'OS Programada'

      const dataOS = diaStr ? diaSemanaParaData(diaStr, paradaDataInicio) : paradaDataInicio
      const chave = `${num}|${desc}`

      if (osMap.has(chave)) {
        const existing = osMap.get(chave)!
        existing.homemDia += hh
        existing.horaDia += horas
      } else {
        osMap.set(chave, {
          numeroOrdem: num,
          descricao: desc,
          homemDia: hh,
          horaDia: horas,
          dataPrevInicio: dataOS,
          dataPrevFim: dataOS,
          especialidade: esp,
          tipoAtividade: tipo,
          caminhoCritico: critico,
          tipoOs: tipoOs || 'OS Programada',
          peso: 0,
        })
      }
    }

    const lista = Array.from(osMap.values())
    if (lista.length === 0) { setErro('Nenhuma OS encontrada. Verifique o formato.'); return }

    const totalHoras = lista.reduce((s, o) => s + o.horaDia, 0)
    lista.forEach(o => { o.peso = totalHoras > 0 ? parseFloat(((o.horaDia / totalHoras) * 100).toFixed(2)) : 0 })

    setPreview(lista)
    setEtapa('revisar')
  }

  async function importar() {
    setImportando(true)
    try {
      for (const os of preview) {
        const data: OrdemServico = {
          id: gerarId(),
          paradaId,
          numeroOrdem: os.numeroOrdem || null,
          descricao: os.descricao,
          homemDia: os.homemDia || null,
          horaDia: os.horaDia || null,
          dataPrevInicio: os.dataPrevInicio,
          dataPrevFim: os.dataPrevFim,
          horaPrevInicio: null,
          horaPrevFim: null,
          dataRealInicio: null,
          dataRealFim: null,
          horaRealInicio: null,
          horaRealFim: null,
          peso: os.peso,
          concluida: false,
          observacao: null,
          pessoasExecutando: null,
          progressoOs: null,
          tipoAtividade: os.tipoAtividade || null,
          especialidade: os.especialidade || null,
          caminhoCritico: os.caminhoCritico || null,
          tipoOs: os.tipoOs || null,
        }
        await api.ordens.create(data)
      }
      onSaved()
    } catch (e) {
      console.error(e)
      alert('Erro ao importar. Tente novamente.')
    } finally {
      setImportando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Importar OSs da Planilha</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>

        {etapa === 'colar' && (
          <>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 13, color: '#475569' }}>
              <strong>Como importar:</strong>
              <ol style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
                <li>Selecione as colunas na planilha (incluindo cabeçalho)</li>
                <li>Copie (Ctrl+C)</li>
                <li>Cole aqui (Ctrl+V)</li>
              </ol>
              <div style={{ marginTop: 8 }}>Colunas reconhecidas: <strong>Número OS, Descrição, Homem/Dia, Hora/Dia, Dia (nome do dia), Especialidade, Tipo Atividade, Caminho Crítico, Tipo OS</strong></div>
            </div>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Cole aqui os dados copiados da planilha..."
              style={{ width: '100%', height: 200, padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical' }}
            />
            {erro && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{erro}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={parsearTexto} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Analisar
              </button>
            </div>
          </>
        )}

        {etapa === 'revisar' && (
          <>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#166534' }}>
              ✅ {preview.length} OSs encontradas. Revise abaixo e confirme a importação.
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={th}>Nº OS</th>
                    <th style={th}>Descrição</th>
                    <th style={th}>HH</th>
                    <th style={th}>H/Dia</th>
                    <th style={th}>Data</th>
                    <th style={th}>Peso</th>
                    <th style={th}>Especialidade</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((os, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}>{os.numeroOrdem || '-'}</td>
                      <td style={td}>{os.descricao}</td>
                      <td style={td}>{os.homemDia.toFixed(1)}</td>
                      <td style={td}>{os.horaDia.toFixed(1)}</td>
                      <td style={td}>{os.dataPrevInicio}</td>
                      <td style={td}>{os.peso.toFixed(1)}%</td>
                      <td style={td}>{os.especialidade || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setEtapa('colar')} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>← Voltar</button>
              <button onClick={importar} disabled={importando} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {importando ? 'Importando...' : `✅ Importar ${preview.length} OSs`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12 }
const td: React.CSSProperties = { padding: '8px 12px', color: '#1e293b' }
