// Tipos das entidades
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function trpcQuery(procedure: string, input?: unknown) {
  const url = input !== undefined
    ? `${API_URL}/api/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
    : `${API_URL}/api/trpc/${procedure}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.result?.data?.json ?? data.result?.data
}

async function trpcMutation(procedure: string, input: unknown) {
  const res = await fetch(`${API_URL}/api/trpc/${procedure}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: input }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.result?.data?.json ?? data.result?.data
}

// API de paradas
export const api = {
  paradas: {
    list: () => trpcQuery('paradas.list') as Promise<Parada[]>,
    create: (input: Omit<Parada, 'ordens'>) => trpcMutation('paradas.create', input),
    update: (input: Partial<Parada> & { id: string }) => trpcMutation('paradas.update', input),
    delete: (input: { id: string }) => trpcMutation('paradas.delete', input),
  },
  ordens: {
    create: (input: OrdemServico) => trpcMutation('ordens.create', input),
    update: (input: Partial<OrdemServico> & { id: string }) => trpcMutation('ordens.update', input),
    delete: (input: { id: string }) => trpcMutation('ordens.delete', input),
  },
}
