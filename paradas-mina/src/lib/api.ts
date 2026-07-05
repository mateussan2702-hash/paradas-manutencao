const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export type OrdemServico = {
  id: string
  paradaId: string
  numeroOrdem?: string | null
  descricao: string
  homemDia?: number | null
  horaDia?: number | null
  dataPrevInicio: string
  dataPrevFim: string
  horaPrevInicio?: string | null
  horaPrevFim?: string | null
  dataRealInicio?: string | null
  dataRealFim?: string | null
  horaRealInicio?: string | null
  horaRealFim?: string | null
  peso: number
  concluida: boolean
  observacao?: string | null
  pessoasExecutando?: number | null
  progressoOs?: number | null
  tipoAtividade?: string | null
  especialidade?: string | null
  caminhoCritico?: string | null
  tipoOs?: string | null
}

export type Parada = {
  id: string
  equipamento: string
  descricao?: string | null
  dataPrevInicio: string
  dataPrevFim: string
  horaPrevInicio?: string | null
  horaPrevFim?: string | null
  dataRealInicio?: string | null
  dataRealFim?: string | null
  horaRealInicio?: string | null
  horaRealFim?: string | null
  criadaEm: string
  ordens: OrdemServico[]
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

async function get(proc: string) {
  const res = await fetch(`${API_URL}/api/trpc/${proc}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.result?.data?.json ?? data.result?.data
}

async function post(proc: string, input: unknown) {
  const res = await fetch(`${API_URL}/api/trpc/${proc}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: input }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.result?.data?.json ?? data.result?.data
}

export const api = {
  paradas: {
    list: (): Promise<Parada[]> => get('paradasMina.list'),
    create: (p: Omit<Parada, 'ordens'>) => post('paradasMina.create', p),
    update: (p: Partial<Parada> & { id: string }) => post('paradasMina.update', p),
    delete: (id: string) => post('paradasMina.delete', { id }),
  },
  ordens: {
    create: (o: OrdemServico) => post('ordensMina.create', o),
    createMany: (ordens: OrdemServico[]) => post('ordensMina.createMany', ordens),
    update: (o: Partial<OrdemServico> & { id: string }) => post('ordensMina.update', o),
    delete: (id: string) => post('ordensMina.delete', { id }),
  },
}

export { gerarId }
