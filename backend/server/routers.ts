import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Schemas de validação ─────────────────────────────────────────────────────

const ordemSchema = z.object({
  id: z.string(),
  paradaId: z.string(),
  numeroOrdem: z.string().optional().nullable(),
  descricao: z.string(),
  homemDia: z.number().optional().nullable(),
  horaDia: z.number().optional().nullable(),
  dataPrevInicio: z.string(),
  dataPrevFim: z.string(),
  horaPrevInicio: z.string().optional().nullable(),
  horaPrevFim: z.string().optional().nullable(),
  dataRealInicio: z.string().optional().nullable(),
  dataRealFim: z.string().optional().nullable(),
  horaRealInicio: z.string().optional().nullable(),
  horaRealFim: z.string().optional().nullable(),
  peso: z.number().default(0),
  concluida: z.boolean().default(false),
  observacao: z.string().optional().nullable(),
  pessoasExecutando: z.number().optional().nullable(),
  progressoOs: z.number().optional().nullable(),
  tipoAtividade: z.string().optional().nullable(),
  especialidade: z.string().optional().nullable(),
  caminhoCritico: z.string().optional().nullable(),
  tipoOs: z.string().optional().nullable(),
});

const paradaSchema = z.object({
  id: z.string(),
  equipamento: z.string(),
  descricao: z.string().optional().nullable(),
  dataPrevInicio: z.string(),
  dataPrevFim: z.string(),
  horaPrevInicio: z.string().optional().nullable(),
  horaPrevFim: z.string().optional().nullable(),
  dataRealInicio: z.string().optional().nullable(),
  dataRealFim: z.string().optional().nullable(),
  horaRealInicio: z.string().optional().nullable(),
  horaRealFim: z.string().optional().nullable(),
  criadaEm: z.string(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Paradas HME (Automotiva) ─────────────────────────────────────────────
  paradas: router({
    list: publicProcedure.query(async () => {
      const todasParadas = await db.getAllParadas();
      const result = await Promise.all(
        todasParadas.map(async (p) => {
          const ordens = await db.getOrdensByParada(p.id);
          return { ...p, ordens };
        })
      );
      return result;
    }),

    create: publicProcedure
      .input(paradaSchema)
      .mutation(async ({ input }) => {
        await db.createParada({
          id: input.id,
          equipamento: input.equipamento,
          descricao: input.descricao ?? null,
          dataPrevInicio: input.dataPrevInicio,
          dataPrevFim: input.dataPrevFim,
          horaPrevInicio: input.horaPrevInicio ?? null,
          horaPrevFim: input.horaPrevFim ?? null,
          dataRealInicio: input.dataRealInicio ?? null,
          dataRealFim: input.dataRealFim ?? null,
          horaRealInicio: input.horaRealInicio ?? null,
          horaRealFim: input.horaRealFim ?? null,
          criadaEm: input.criadaEm,
        });
        return { id: input.id };
      }),

    update: publicProcedure
      .input(paradaSchema.partial().required({ id: true }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateParada(id, {
          equipamento: data.equipamento,
          descricao: data.descricao ?? null,
          dataPrevInicio: data.dataPrevInicio,
          dataPrevFim: data.dataPrevFim,
          horaPrevInicio: data.horaPrevInicio ?? null,
          horaPrevFim: data.horaPrevFim ?? null,
          dataRealInicio: data.dataRealInicio ?? null,
          dataRealFim: data.dataRealFim ?? null,
          horaRealInicio: data.horaRealInicio ?? null,
          horaRealFim: data.horaRealFim ?? null,
        });
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteParada(input.id);
        return { success: true };
      }),
  }),

  // ─── Ordens de Serviço HME ────────────────────────────────────────────────
  ordens: router({
    create: publicProcedure
      .input(ordemSchema)
      .mutation(async ({ input }) => {
        await db.createOrdem({
          id: input.id,
          paradaId: input.paradaId,
          numeroOrdem: input.numeroOrdem ?? null,
          descricao: input.descricao,
          homemDia: input.homemDia ?? null,
          horaDia: input.horaDia ?? null,
          dataPrevInicio: input.dataPrevInicio,
          dataPrevFim: input.dataPrevFim,
          horaPrevInicio: input.horaPrevInicio ?? null,
          horaPrevFim: input.horaPrevFim ?? null,
          dataRealInicio: input.dataRealInicio ?? null,
          dataRealFim: input.dataRealFim ?? null,
          horaRealInicio: input.horaRealInicio ?? null,
          horaRealFim: input.horaRealFim ?? null,
          peso: input.peso,
          concluida: input.concluida,
          observacao: input.observacao ?? null,
          pessoasExecutando: input.pessoasExecutando ?? null,
          progressoOs: input.progressoOs ?? null,
          tipoAtividade: input.tipoAtividade ?? null,
          especialidade: input.especialidade ?? null,
          caminhoCritico: input.caminhoCritico ?? null,
          tipoOs: input.tipoOs ?? null,
        });
        return { id: input.id };
      }),

    createMany: publicProcedure
      .input(z.array(ordemSchema))
      .mutation(async ({ input }) => {
        for (const ordem of input) {
          await db.createOrdem({
            id: ordem.id,
            paradaId: ordem.paradaId,
            numeroOrdem: ordem.numeroOrdem ?? null,
            descricao: ordem.descricao,
            homemDia: ordem.homemDia ?? null,
            horaDia: ordem.horaDia ?? null,
            dataPrevInicio: ordem.dataPrevInicio,
            dataPrevFim: ordem.dataPrevFim,
            horaPrevInicio: ordem.horaPrevInicio ?? null,
            horaPrevFim: ordem.horaPrevFim ?? null,
            dataRealInicio: ordem.dataRealInicio ?? null,
            dataRealFim: ordem.dataRealFim ?? null,
            horaRealInicio: ordem.horaRealInicio ?? null,
            horaRealFim: ordem.horaRealFim ?? null,
            peso: ordem.peso,
            concluida: ordem.concluida,
            observacao: ordem.observacao ?? null,
            pessoasExecutando: ordem.pessoasExecutando ?? null,
            progressoOs: ordem.progressoOs ?? null,
            tipoAtividade: ordem.tipoAtividade ?? null,
            especialidade: ordem.especialidade ?? null,
            caminhoCritico: ordem.caminhoCritico ?? null,
            tipoOs: ordem.tipoOs ?? null,
          });
        }
        return { count: input.length };
      }),

    update: publicProcedure
      .input(ordemSchema.partial().required({ id: true }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateOrdem(id, {
          numeroOrdem: data.numeroOrdem ?? null,
          descricao: data.descricao,
          homemDia: data.homemDia ?? null,
          horaDia: data.horaDia ?? null,
          dataPrevInicio: data.dataPrevInicio,
          dataPrevFim: data.dataPrevFim,
          horaPrevInicio: data.horaPrevInicio ?? null,
          horaPrevFim: data.horaPrevFim ?? null,
          dataRealInicio: data.dataRealInicio ?? null,
          dataRealFim: data.dataRealFim ?? null,
          horaRealInicio: data.horaRealInicio ?? null,
          horaRealFim: data.horaRealFim ?? null,
          peso: data.peso,
          concluida: data.concluida,
          observacao: data.observacao ?? null,
          pessoasExecutando: data.pessoasExecutando ?? null,
          progressoOs: data.progressoOs ?? null,
          tipoAtividade: data.tipoAtividade ?? null,
          especialidade: data.especialidade ?? null,
          caminhoCritico: data.caminhoCritico ?? null,
          tipoOs: data.tipoOs ?? null,
        });
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteOrdem(input.id);
        return { success: true };
      }),
  }),

  // ─── Paradas MINA ─────────────────────────────────────────────────────────
  paradasMina: router({
    list: publicProcedure.query(async () => {
      const todas = await db.getAllParadasMina();
      return Promise.all(todas.map(async (p) => ({ ...p, ordens: await db.getOrdensByParadaMina(p.id) })));
    }),
    create: publicProcedure.input(paradaSchema).mutation(async ({ input }) => {
      await db.createParadaMina({ id: input.id, equipamento: input.equipamento, descricao: input.descricao ?? null, dataPrevInicio: input.dataPrevInicio, dataPrevFim: input.dataPrevFim, horaPrevInicio: input.horaPrevInicio ?? null, horaPrevFim: input.horaPrevFim ?? null, dataRealInicio: input.dataRealInicio ?? null, dataRealFim: input.dataRealFim ?? null, horaRealInicio: input.horaRealInicio ?? null, horaRealFim: input.horaRealFim ?? null, criadaEm: input.criadaEm });
      return { id: input.id };
    }),
    update: publicProcedure.input(paradaSchema.partial().required({ id: true })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateParadaMina(id, { equipamento: data.equipamento, descricao: data.descricao ?? null, dataPrevInicio: data.dataPrevInicio, dataPrevFim: data.dataPrevFim, horaPrevInicio: data.horaPrevInicio ?? null, horaPrevFim: data.horaPrevFim ?? null, dataRealInicio: data.dataRealInicio ?? null, dataRealFim: data.dataRealFim ?? null, horaRealInicio: data.horaRealInicio ?? null, horaRealFim: data.horaRealFim ?? null });
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await db.deleteParadaMina(input.id);
      return { success: true };
    }),
  }),

  // ─── Ordens MINA ──────────────────────────────────────────────────────────
  ordensMina: router({
    create: publicProcedure.input(ordemSchema).mutation(async ({ input }) => {
      await db.createOrdemMina({ id: input.id, paradaId: input.paradaId, numeroOrdem: input.numeroOrdem ?? null, descricao: input.descricao, homemDia: input.homemDia ?? null, horaDia: input.horaDia ?? null, dataPrevInicio: input.dataPrevInicio, dataPrevFim: input.dataPrevFim, horaPrevInicio: input.horaPrevInicio ?? null, horaPrevFim: input.horaPrevFim ?? null, dataRealInicio: input.dataRealInicio ?? null, dataRealFim: input.dataRealFim ?? null, horaRealInicio: input.horaRealInicio ?? null, horaRealFim: input.horaRealFim ?? null, peso: input.peso, concluida: input.concluida, observacao: input.observacao ?? null, pessoasExecutando: input.pessoasExecutando ?? null, progressoOs: input.progressoOs ?? null, tipoAtividade: input.tipoAtividade ?? null, especialidade: input.especialidade ?? null, caminhoCritico: input.caminhoCritico ?? null, tipoOs: input.tipoOs ?? null });
      return { id: input.id };
    }),
    createMany: publicProcedure.input(z.array(ordemSchema)).mutation(async ({ input }) => {
      for (const o of input) await db.createOrdemMina({ id: o.id, paradaId: o.paradaId, numeroOrdem: o.numeroOrdem ?? null, descricao: o.descricao, homemDia: o.homemDia ?? null, horaDia: o.horaDia ?? null, dataPrevInicio: o.dataPrevInicio, dataPrevFim: o.dataPrevFim, horaPrevInicio: o.horaPrevInicio ?? null, horaPrevFim: o.horaPrevFim ?? null, dataRealInicio: o.dataRealInicio ?? null, dataRealFim: o.dataRealFim ?? null, horaRealInicio: o.horaRealInicio ?? null, horaRealFim: o.horaRealFim ?? null, peso: o.peso, concluida: o.concluida, observacao: o.observacao ?? null, pessoasExecutando: o.pessoasExecutando ?? null, progressoOs: o.progressoOs ?? null, tipoAtividade: o.tipoAtividade ?? null, especialidade: o.especialidade ?? null, caminhoCritico: o.caminhoCritico ?? null, tipoOs: o.tipoOs ?? null });
      return { count: input.length };
    }),
    update: publicProcedure.input(ordemSchema.partial().required({ id: true })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateOrdemMina(id, { numeroOrdem: data.numeroOrdem ?? null, descricao: data.descricao, homemDia: data.homemDia ?? null, horaDia: data.horaDia ?? null, dataPrevInicio: data.dataPrevInicio, dataPrevFim: data.dataPrevFim, horaPrevInicio: data.horaPrevInicio ?? null, horaPrevFim: data.horaPrevFim ?? null, dataRealInicio: data.dataRealInicio ?? null, dataRealFim: data.dataRealFim ?? null, horaRealInicio: data.horaRealInicio ?? null, horaRealFim: data.horaRealFim ?? null, peso: data.peso, concluida: data.concluida, observacao: data.observacao ?? null, pessoasExecutando: data.pessoasExecutando ?? null, progressoOs: data.progressoOs ?? null, tipoAtividade: data.tipoAtividade ?? null, especialidade: data.especialidade ?? null, caminhoCritico: data.caminhoCritico ?? null, tipoOs: data.tipoOs ?? null });
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await db.deleteOrdemMina(input.id);
      return { success: true };
    }),
  }),

  // ─── Paradas INDUSTRIAL ───────────────────────────────────────────────────
  paradasIndustrial: router({
    list: publicProcedure.query(async () => {
      const todas = await db.getAllParadasIndustrial();
      return Promise.all(todas.map(async (p) => ({ ...p, ordens: await db.getOrdensByParadaIndustrial(p.id) })));
    }),
    create: publicProcedure.input(paradaSchema).mutation(async ({ input }) => {
      await db.createParadaIndustrial({ id: input.id, equipamento: input.equipamento, descricao: input.descricao ?? null, dataPrevInicio: input.dataPrevInicio, dataPrevFim: input.dataPrevFim, horaPrevInicio: input.horaPrevInicio ?? null, horaPrevFim: input.horaPrevFim ?? null, dataRealInicio: input.dataRealInicio ?? null, dataRealFim: input.dataRealFim ?? null, horaRealInicio: input.horaRealInicio ?? null, horaRealFim: input.horaRealFim ?? null, criadaEm: input.criadaEm });
      return { id: input.id };
    }),
    update: publicProcedure.input(paradaSchema.partial().required({ id: true })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateParadaIndustrial(id, { equipamento: data.equipamento, descricao: data.descricao ?? null, dataPrevInicio: data.dataPrevInicio, dataPrevFim: data.dataPrevFim, horaPrevInicio: data.horaPrevInicio ?? null, horaPrevFim: data.horaPrevFim ?? null, dataRealInicio: data.dataRealInicio ?? null, dataRealFim: data.dataRealFim ?? null, horaRealInicio: data.horaRealInicio ?? null, horaRealFim: data.horaRealFim ?? null });
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await db.deleteParadaIndustrial(input.id);
      return { success: true };
    }),
  }),

  // ─── Ordens INDUSTRIAL ────────────────────────────────────────────────────
  ordensIndustrial: router({
    create: publicProcedure.input(ordemSchema).mutation(async ({ input }) => {
      await db.createOrdemIndustrial({ id: input.id, paradaId: input.paradaId, numeroOrdem: input.numeroOrdem ?? null, descricao: input.descricao, homemDia: input.homemDia ?? null, horaDia: input.horaDia ?? null, dataPrevInicio: input.dataPrevInicio, dataPrevFim: input.dataPrevFim, horaPrevInicio: input.horaPrevInicio ?? null, horaPrevFim: input.horaPrevFim ?? null, dataRealInicio: input.dataRealInicio ?? null, dataRealFim: input.dataRealFim ?? null, horaRealInicio: input.horaRealInicio ?? null, horaRealFim: input.horaRealFim ?? null, peso: input.peso, concluida: input.concluida, observacao: input.observacao ?? null, pessoasExecutando: input.pessoasExecutando ?? null, progressoOs: input.progressoOs ?? null, tipoAtividade: input.tipoAtividade ?? null, especialidade: input.especialidade ?? null, caminhoCritico: input.caminhoCritico ?? null, tipoOs: input.tipoOs ?? null });
      return { id: input.id };
    }),
    createMany: publicProcedure.input(z.array(ordemSchema)).mutation(async ({ input }) => {
      for (const o of input) await db.createOrdemIndustrial({ id: o.id, paradaId: o.paradaId, numeroOrdem: o.numeroOrdem ?? null, descricao: o.descricao, homemDia: o.homemDia ?? null, horaDia: o.horaDia ?? null, dataPrevInicio: o.dataPrevInicio, dataPrevFim: o.dataPrevFim, horaPrevInicio: o.horaPrevInicio ?? null, horaPrevFim: o.horaPrevFim ?? null, dataRealInicio: o.dataRealInicio ?? null, dataRealFim: o.dataRealFim ?? null, horaRealInicio: o.horaRealInicio ?? null, horaRealFim: o.horaRealFim ?? null, peso: o.peso, concluida: o.concluida, observacao: o.observacao ?? null, pessoasExecutando: o.pessoasExecutando ?? null, progressoOs: o.progressoOs ?? null, tipoAtividade: o.tipoAtividade ?? null, especialidade: o.especialidade ?? null, caminhoCritico: o.caminhoCritico ?? null, tipoOs: o.tipoOs ?? null });
      return { count: input.length };
    }),
    update: publicProcedure.input(ordemSchema.partial().required({ id: true })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateOrdemIndustrial(id, { numeroOrdem: data.numeroOrdem ?? null, descricao: data.descricao, homemDia: data.homemDia ?? null, horaDia: data.horaDia ?? null, dataPrevInicio: data.dataPrevInicio, dataPrevFim: data.dataPrevFim, horaPrevInicio: data.horaPrevInicio ?? null, horaPrevFim: data.horaPrevFim ?? null, dataRealInicio: data.dataRealInicio ?? null, dataRealFim: data.dataRealFim ?? null, horaRealInicio: data.horaRealInicio ?? null, horaRealFim: data.horaRealFim ?? null, peso: data.peso, concluida: data.concluida, observacao: data.observacao ?? null, pessoasExecutando: data.pessoasExecutando ?? null, progressoOs: data.progressoOs ?? null, tipoAtividade: data.tipoAtividade ?? null, especialidade: data.especialidade ?? null, caminhoCritico: data.caminhoCritico ?? null, tipoOs: data.tipoOs ?? null });
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      await db.deleteOrdemIndustrial(input.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
