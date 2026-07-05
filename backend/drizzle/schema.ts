import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de paradas de equipamentos.
 * Cada parada representa uma parada programada de manutenção.
 */
export const paradas = mysqlTable("paradas", {
  id: varchar("id", { length: 32 }).primaryKey(),
  equipamento: varchar("equipamento", { length: 255 }).notNull(),
  descricao: text("descricao"),
  dataPrevInicio: varchar("dataPrevInicio", { length: 10 }).notNull(), // YYYY-MM-DD
  dataPrevFim: varchar("dataPrevFim", { length: 10 }).notNull(),
  horaPrevInicio: varchar("horaPrevInicio", { length: 5 }),            // HH:MM
  horaPrevFim: varchar("horaPrevFim", { length: 5 }),
  dataRealInicio: varchar("dataRealInicio", { length: 10 }),
  dataRealFim: varchar("dataRealFim", { length: 10 }),
  horaRealInicio: varchar("horaRealInicio", { length: 5 }),
  horaRealFim: varchar("horaRealFim", { length: 5 }),
  criadaEm: varchar("criadaEm", { length: 30 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Parada = typeof paradas.$inferSelect;
export type InsertParada = typeof paradas.$inferInsert;

/**
 * Tabela de ordens de serviço vinculadas a uma parada (HME).
 */
export const ordensServico = mysqlTable("ordens_servico", {
  id: varchar("id", { length: 32 }).primaryKey(),
  paradaId: varchar("paradaId", { length: 32 }).notNull(),
  numeroOrdem: varchar("numeroOrdem", { length: 64 }),
  descricao: text("descricao").notNull(),
  homemDia: int("homemDia"),
  horaDia: int("horaDia"),
  dataPrevInicio: varchar("dataPrevInicio", { length: 10 }).notNull(),
  dataPrevFim: varchar("dataPrevFim", { length: 10 }).notNull(),
  horaPrevInicio: varchar("horaPrevInicio", { length: 5 }),
  horaPrevFim: varchar("horaPrevFim", { length: 5 }),
  dataRealInicio: varchar("dataRealInicio", { length: 10 }),
  dataRealFim: varchar("dataRealFim", { length: 10 }),
  horaRealInicio: varchar("horaRealInicio", { length: 5 }),
  horaRealFim: varchar("horaRealFim", { length: 5 }),
  peso: int("peso").notNull().default(0),
  concluida: boolean("concluida").notNull().default(false),
  observacao: text("observacao"),
  pessoasExecutando: int("pessoasExecutando"),
  progressoOs: int("progressoOs").default(0),
  tipoAtividade: varchar("tipoAtividade", { length: 32 }),
  especialidade: varchar("especialidade", { length: 64 }),
  caminhoCritico: varchar("caminhoCritico", { length: 4 }),
  tipoOs: varchar("tipoOs", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrdemServico = typeof ordensServico.$inferSelect;
export type InsertOrdemServico = typeof ordensServico.$inferInsert;

/**
 * Tabela de paradas de manutenção de MINA.
 */
export const paradasMina = mysqlTable("paradas_mina", {
  id: varchar("id", { length: 32 }).primaryKey(),
  equipamento: varchar("equipamento", { length: 255 }).notNull(),
  descricao: text("descricao"),
  dataPrevInicio: varchar("dataPrevInicio", { length: 10 }).notNull(),
  dataPrevFim: varchar("dataPrevFim", { length: 10 }).notNull(),
  horaPrevInicio: varchar("horaPrevInicio", { length: 5 }),
  horaPrevFim: varchar("horaPrevFim", { length: 5 }),
  dataRealInicio: varchar("dataRealInicio", { length: 10 }),
  dataRealFim: varchar("dataRealFim", { length: 10 }),
  horaRealInicio: varchar("horaRealInicio", { length: 5 }),
  horaRealFim: varchar("horaRealFim", { length: 5 }),
  criadaEm: varchar("criadaEm", { length: 30 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const ordensServicoMina = mysqlTable("ordens_servico_mina", {
  id: varchar("id", { length: 32 }).primaryKey(),
  paradaId: varchar("paradaId", { length: 32 }).notNull(),
  numeroOrdem: varchar("numeroOrdem", { length: 64 }),
  descricao: text("descricao").notNull(),
  homemDia: int("homemDia"),
  horaDia: int("horaDia"),
  dataPrevInicio: varchar("dataPrevInicio", { length: 10 }).notNull(),
  dataPrevFim: varchar("dataPrevFim", { length: 10 }).notNull(),
  horaPrevInicio: varchar("horaPrevInicio", { length: 5 }),
  horaPrevFim: varchar("horaPrevFim", { length: 5 }),
  dataRealInicio: varchar("dataRealInicio", { length: 10 }),
  dataRealFim: varchar("dataRealFim", { length: 10 }),
  horaRealInicio: varchar("horaRealInicio", { length: 5 }),
  horaRealFim: varchar("horaRealFim", { length: 5 }),
  peso: int("peso").notNull().default(0),
  concluida: boolean("concluida").notNull().default(false),
  observacao: text("observacao"),
  pessoasExecutando: int("pessoasExecutando"),
  progressoOs: int("progressoOs").default(0),
  tipoAtividade: varchar("tipoAtividade", { length: 32 }),
  especialidade: varchar("especialidade", { length: 64 }),
  caminhoCritico: varchar("caminhoCritico", { length: 4 }),
  tipoOs: varchar("tipoOs", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Tabela de paradas de manutenção INDUSTRIAL.
 */
export const paradasIndustrial = mysqlTable("paradas_industrial", {
  id: varchar("id", { length: 32 }).primaryKey(),
  equipamento: varchar("equipamento", { length: 255 }).notNull(),
  descricao: text("descricao"),
  dataPrevInicio: varchar("dataPrevInicio", { length: 10 }).notNull(),
  dataPrevFim: varchar("dataPrevFim", { length: 10 }).notNull(),
  horaPrevInicio: varchar("horaPrevInicio", { length: 5 }),
  horaPrevFim: varchar("horaPrevFim", { length: 5 }),
  dataRealInicio: varchar("dataRealInicio", { length: 10 }),
  dataRealFim: varchar("dataRealFim", { length: 10 }),
  horaRealInicio: varchar("horaRealInicio", { length: 5 }),
  horaRealFim: varchar("horaRealFim", { length: 5 }),
  criadaEm: varchar("criadaEm", { length: 30 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const ordensServicoIndustrial = mysqlTable("ordens_servico_industrial", {
  id: varchar("id", { length: 32 }).primaryKey(),
  paradaId: varchar("paradaId", { length: 32 }).notNull(),
  numeroOrdem: varchar("numeroOrdem", { length: 64 }),
  descricao: text("descricao").notNull(),
  homemDia: int("homemDia"),
  horaDia: int("horaDia"),
  dataPrevInicio: varchar("dataPrevInicio", { length: 10 }).notNull(),
  dataPrevFim: varchar("dataPrevFim", { length: 10 }).notNull(),
  horaPrevInicio: varchar("horaPrevInicio", { length: 5 }),
  horaPrevFim: varchar("horaPrevFim", { length: 5 }),
  dataRealInicio: varchar("dataRealInicio", { length: 10 }),
  dataRealFim: varchar("dataRealFim", { length: 10 }),
  horaRealInicio: varchar("horaRealInicio", { length: 5 }),
  horaRealFim: varchar("horaRealFim", { length: 5 }),
  peso: int("peso").notNull().default(0),
  concluida: boolean("concluida").notNull().default(false),
  observacao: text("observacao"),
  pessoasExecutando: int("pessoasExecutando"),
  progressoOs: int("progressoOs").default(0),
  tipoAtividade: varchar("tipoAtividade", { length: 32 }),
  especialidade: varchar("especialidade", { length: 64 }),
  caminhoCritico: varchar("caminhoCritico", { length: 4 }),
  tipoOs: varchar("tipoOs", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
