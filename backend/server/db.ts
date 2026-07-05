import { eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, paradas, ordensServico, InsertParada, InsertOrdemServico, paradasMina, ordensServicoMina, paradasIndustrial, ordensServicoIndustrial } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Paradas ──────────────────────────────────────────────────────────────────

export async function getAllParadas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paradas).orderBy(asc(paradas.criadaEm));
}

export async function getParadaById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(paradas).where(eq(paradas.id, id));
  return result[0] ?? null;
}

export async function createParada(data: InsertParada) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(paradas).values(data);
  return data.id;
}

export async function updateParada(id: string, data: Partial<InsertParada>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(paradas).set(data).where(eq(paradas.id, id));
}

export async function deleteParada(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ordensServico).where(eq(ordensServico.paradaId, id));
  await db.delete(paradas).where(eq(paradas.id, id));
}

// ─── Ordens de Serviço ────────────────────────────────────────────────────────

export async function getOrdensByParada(paradaId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ordensServico).where(eq(ordensServico.paradaId, paradaId));
}

export async function createOrdem(data: InsertOrdemServico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ordensServico).values(data);
  return data.id;
}

export async function updateOrdem(id: string, data: Partial<InsertOrdemServico>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ordensServico).set(data).where(eq(ordensServico.id, id));
}

export async function deleteOrdem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ordensServico).where(eq(ordensServico.id, id));
}

export async function deleteOrdensByParada(paradaId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ordensServico).where(eq(ordensServico.paradaId, paradaId));
}

// ─── Paradas MINA ─────────────────────────────────────────────────────────────

export async function getAllParadasMina() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paradasMina).orderBy(asc(paradasMina.criadaEm));
}

export async function createParadaMina(data: typeof paradasMina.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(paradasMina).values(data);
  return data.id;
}

export async function updateParadaMina(id: string, data: Partial<typeof paradasMina.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(paradasMina).set(data).where(eq(paradasMina.id, id));
}

export async function deleteParadaMina(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ordensServicoMina).where(eq(ordensServicoMina.paradaId, id));
  await db.delete(paradasMina).where(eq(paradasMina.id, id));
}

export async function getOrdensByParadaMina(paradaId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ordensServicoMina).where(eq(ordensServicoMina.paradaId, paradaId));
}

export async function createOrdemMina(data: typeof ordensServicoMina.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ordensServicoMina).values(data);
  return data.id;
}

export async function updateOrdemMina(id: string, data: Partial<typeof ordensServicoMina.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ordensServicoMina).set(data).where(eq(ordensServicoMina.id, id));
}

export async function deleteOrdemMina(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ordensServicoMina).where(eq(ordensServicoMina.id, id));
}

// ─── Paradas INDUSTRIAL ───────────────────────────────────────────────────────

export async function getAllParadasIndustrial() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paradasIndustrial).orderBy(asc(paradasIndustrial.criadaEm));
}

export async function createParadaIndustrial(data: typeof paradasIndustrial.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(paradasIndustrial).values(data);
  return data.id;
}

export async function updateParadaIndustrial(id: string, data: Partial<typeof paradasIndustrial.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(paradasIndustrial).set(data).where(eq(paradasIndustrial.id, id));
}

export async function deleteParadaIndustrial(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ordensServicoIndustrial).where(eq(ordensServicoIndustrial.paradaId, id));
  await db.delete(paradasIndustrial).where(eq(paradasIndustrial.id, id));
}

export async function getOrdensByParadaIndustrial(paradaId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ordensServicoIndustrial).where(eq(ordensServicoIndustrial.paradaId, paradaId));
}

export async function createOrdemIndustrial(data: typeof ordensServicoIndustrial.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ordensServicoIndustrial).values(data);
  return data.id;
}

export async function updateOrdemIndustrial(id: string, data: Partial<typeof ordensServicoIndustrial.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ordensServicoIndustrial).set(data).where(eq(ordensServicoIndustrial.id, id));
}

export async function deleteOrdemIndustrial(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ordensServicoIndustrial).where(eq(ordensServicoIndustrial.id, id));
}
