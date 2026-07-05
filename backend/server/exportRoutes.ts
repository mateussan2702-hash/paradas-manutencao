import { Router } from 'express';
import * as XLSX from 'xlsx';
import * as db from './db';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso?: string | null, hora?: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const base = `${d}/${m}/${y}`;
  return hora ? `${base} ${hora}` : base;
}

function statusOS(concluida: boolean, dataRealInicio?: string | null): string {
  if (concluida) return 'Concluída';
  if (dataRealInicio) return 'Em andamento';
  return 'Aguardando';
}

function statusParada(parada: {
  dataPrevFim: string;
  dataRealFim?: string | null;
  dataRealInicio?: string | null;
  ordens: { concluida: boolean }[];
}): string {
  if (parada.dataRealFim) return 'Concluída';
  if (parada.dataRealInicio) return 'Em andamento';
  const hoje = new Date().toISOString().split('T')[0];
  if (parada.dataPrevFim < hoje) return 'Atrasada';
  return 'Planejada';
}

// ─── Função principal: busca todos os dados e monta as linhas ─────────────────

async function buildRows(): Promise<Record<string, string | number>[]> {
  const rows: Record<string, string | number>[] = [];

  const areas = [
    {
      nome: 'HME',
      getParadas: db.getAllParadas,
      getOrdens: db.getOrdensByParada,
    },
    {
      nome: 'Mina',
      getParadas: db.getAllParadasMina,
      getOrdens: db.getOrdensByParadaMina,
    },
    {
      nome: 'Industrial',
      getParadas: db.getAllParadasIndustrial,
      getOrdens: db.getOrdensByParadaIndustrial,
    },
  ];

  for (const area of areas) {
    const paradas = await area.getParadas();

    for (const parada of paradas) {
      const ordens = await area.getOrdens(parada.id);
      const paradaComOrdens = { ...parada, ordens };
      const stParada = statusParada(paradaComOrdens as any);
      const osConcluidas = ordens.filter((o) => o.concluida).length;
      const osTotal = ordens.length;
      // Cálculo ponderado pelo peso: soma(peso_os * progressoOs) / soma(pesos)
      // progressoOs é 0-100 (campo real da OS); se concluída, usa 100
      const somaPesos = ordens.reduce((acc, o) => acc + (o.peso ?? 0), 0);
      const progresso = somaPesos > 0
        ? Math.round(
            ordens.reduce((acc, o) => {
              const pesoOs = o.peso ?? 0;
              const progressoOs = o.concluida ? 100 : ((o as any).progressoOs ?? 0);
              return acc + pesoOs * progressoOs;
            }, 0) / somaPesos
          )
        : osTotal > 0 ? Math.round((osConcluidas / osTotal) * 100) : 0;

      if (ordens.length === 0) {
        // Parada sem OSs — uma linha só com dados da parada
        rows.push({
          Area: area.nome,
          Equipamento: parada.equipamento,
          Descricao_Parada: parada.descricao ?? '',
          Status_Parada: stParada,
          Inicio_Previsto: fmt(parada.dataPrevInicio, parada.horaPrevInicio),
          Fim_Previsto: fmt(parada.dataPrevFim, parada.horaPrevFim),
          Inicio_Real: fmt(parada.dataRealInicio, parada.horaRealInicio),
          Fim_Real: fmt(parada.dataRealFim, parada.horaRealFim),
          Progresso_Pct: progresso,
          OSs_Concluidas: osConcluidas,
          OSs_Total: osTotal,
          Numero_OS: '',
          Descricao_OS: '',
          Status_OS: '',
          OS_Inicio_Previsto: '',
          OS_Fim_Previsto: '',
          OS_Inicio_Real: '',
          OS_Fim_Real: '',
          Homem_Dia: '',
          Hora_Dia: '',
          Pessoas_Executando: '',
          Progresso_OS_Pct: '',
          Tipo_Atividade: '',
          Especialidade: '',
          Caminho_Critico: '',
          Tipo_OS: '',
          Peso_Pct: '',
          Observacao_OS: '',
        });
      } else {
        for (const os of ordens) {
          rows.push({
            Area: area.nome,
            Equipamento: parada.equipamento,
            Descricao_Parada: parada.descricao ?? '',
            Status_Parada: stParada,
            Inicio_Previsto: fmt(parada.dataPrevInicio, parada.horaPrevInicio),
            Fim_Previsto: fmt(parada.dataPrevFim, parada.horaPrevFim),
            Inicio_Real: fmt(parada.dataRealInicio, parada.horaRealInicio),
            Fim_Real: fmt(parada.dataRealFim, parada.horaRealFim),
            Progresso_Pct: progresso,
            OSs_Concluidas: osConcluidas,
            OSs_Total: osTotal,
            Numero_OS: os.numeroOrdem ?? '',
            Descricao_OS: os.descricao,
            Status_OS: statusOS(os.concluida, os.dataRealInicio),
            OS_Inicio_Previsto: fmt(os.dataPrevInicio, os.horaPrevInicio),
            OS_Fim_Previsto: fmt(os.dataPrevFim, os.horaPrevFim),
            OS_Inicio_Real: fmt(os.dataRealInicio, os.horaRealInicio),
            OS_Fim_Real: fmt(os.dataRealFim, os.horaRealFim),
            Homem_Dia: os.homemDia ?? '',
            Hora_Dia: os.horaDia ?? '',
            Pessoas_Executando: (os as any).pessoasExecutando ?? '',
            Progresso_OS_Pct: os.concluida ? 100 : ((os as any).progressoOs ?? 0),
            Tipo_Atividade: (os as any).tipoAtividade ?? '',
            Especialidade: (os as any).especialidade ?? '',
            Caminho_Critico: (os as any).caminhoCritico ?? '',
            Tipo_OS: (os as any).tipoOs ?? '',
            Peso_Pct: os.peso,
            Observacao_OS: os.observacao ?? ''
          });
        }
      }
    }
  }

  return rows;
}

// ─── Endpoint Excel (/api/exportar/paradas.xlsx) ──────────────────────────────

router.get('/exportar/paradas.xlsx', async (_req, res) => {
  try {
    const rows = await buildRows();

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Largura das colunas
    ws['!cols'] = [
      { wch: 12 }, // Area
      { wch: 22 }, // Equipamento
      { wch: 30 }, // Descricao_Parada
      { wch: 14 }, // Status_Parada
      { wch: 18 }, // Inicio_Previsto
      { wch: 18 }, // Fim_Previsto
      { wch: 18 }, // Inicio_Real
      { wch: 18 }, // Fim_Real
      { wch: 14 }, // Progresso_Pct
      { wch: 14 }, // OSs_Concluidas
      { wch: 10 }, // OSs_Total
      { wch: 12 }, // Numero_OS
      { wch: 45 }, // Descricao_OS
      { wch: 16 }, // Status_OS
      { wch: 18 }, // OS_Inicio_Previsto
      { wch: 18 }, // OS_Fim_Previsto
      { wch: 18 }, // OS_Inicio_Real
      { wch: 18 }, // OS_Fim_Real
      { wch: 12 }, // Homem_Dia
      { wch: 12 }, // Hora_Dia
      { wch: 18 }, // Pessoas_Executando
      { wch: 16 }, // Progresso_OS_Pct
      { wch: 16 }, // Tipo_Atividade
      { wch: 18 }, // Especialidade
      { wch: 16 }, // Caminho_Critico
      { wch: 10 }, // Peso_Pct
      { wch: 40 }, // Observacao_OS
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Paradas e OSs');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="paradas_manutencao.xlsx"');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(buf);
  } catch (err) {
    console.error('[exportar/xlsx]', err);
    res.status(500).json({ error: 'Erro ao gerar Excel' });
  }
});

// ─── Endpoint CSV (/api/exportar/paradas.csv) ─────────────────────────────────

router.get('/exportar/paradas.csv', async (_req, res) => {
  try {
    const rows = await buildRows();

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const csv = XLSX.utils.sheet_to_csv(ws);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="paradas_manutencao.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    // BOM para Excel abrir corretamente com acentos
    res.send('\uFEFF' + csv);
  } catch (err) {
    console.error('[exportar/csv]', err);
    res.status(500).json({ error: 'Erro ao gerar CSV' });
  }
});

// ─── Endpoint JSON (/api/exportar/paradas.json) — útil para Power BI via Web ──

router.get('/exportar/paradas.json', async (_req, res) => {
  try {
    const rows = await buildRows();
    res.setHeader('Cache-Control', 'no-cache');
    res.json(rows);
  } catch (err) {
    console.error('[exportar/json]', err);
    res.status(500).json({ error: 'Erro ao gerar JSON' });
  }
});

export function registerExportRoutes(app: import('express').Application) {
  app.use('/api', router);
}

// build: 20260513120000
