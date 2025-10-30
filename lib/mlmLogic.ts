import type { Db } from "mongodb"
import type {
  Transaction,
  StakingMeta,
  GenerationMeta,
  ReferralMeta,
} from "@/lib/models/Transaction"

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateStakingIncome(amount: number): number {
  if (amount < 100) return 0
  const tiers: Array<{ min: number; max: number | null; rate: number }> = [
    { min: 100, max: 1000, rate: 0.04 },
    { min: 1000, max: 4000, rate: 0.05 },
    { min: 4000, max: 6000, rate: 0.06 },
    { min: 6000, max: 10000, rate: 0.07 },
    { min: 10000, max: null, rate: 0.08 },
  ]

  const tier = tiers.find(t => amount >= t.min && (t.max === null || amount <= t.max))
  const rate = tier ? tier.rate : 0
  return roundToTwo(amount * rate)
}

export function calculateGenerationCommission(level: number): number {
  const mapping: Record<number, number> = {
    1: 300,
    2: 100,
    3: 80,
    4: 70,
    5: 60,
  }
  return mapping[level] ?? 0
}

export function calculateReferralIncome(referralLevel: number, referralProfit: number): number {
  const mapping: Record<number, number> = {
    1: 0.2,
    2: 0.1,
    3: 0.05,
  }
  const rate = mapping[referralLevel] ?? 0
  return roundToTwo(referralProfit * rate)
}

async function getDb(db?: Db): Promise<Db> {
  if (db) return db
  const mod = await import("@/lib/mongodb")
  return await mod.getDatabase()
}

export async function recordStakingIncome(
  userId: string,
  amountStaked: number,
  period: string,
  currency: string = "USD",
  db?: Db,
): Promise<Transaction<StakingMeta>> {
  const database = await getDb(db)
  const income = calculateStakingIncome(amountStaked)
  const doc: Transaction<StakingMeta> = {
    userId,
    type: "staking",
    amount: income,
    currency,
    createdAt: new Date(),
    meta: {
      amountStaked,
      roiRate: income === 0 ? 0 : roundToTwo(income / amountStaked),
      period,
    },
  }
  await database.collection<Transaction>("transactions").insertOne(doc)
  return doc
}

export async function recordGenerationCommission(
  uplineUserId: string,
  level: number,
  packageAmount: number,
  downlineUserId: string,
  currency: string = "USD",
  db?: Db,
): Promise<Transaction<GenerationMeta>> {
  const database = await getDb(db)
  const commission = calculateGenerationCommission(level)
  const doc: Transaction<GenerationMeta> = {
    userId: uplineUserId,
    type: "generation",
    amount: commission,
    currency,
    createdAt: new Date(),
    meta: {
      level,
      downlineUserId,
      packageAmount,
    },
  }
  await database.collection<Transaction>("transactions").insertOne(doc)
  return doc
}

export async function recordReferralIncome(
  uplineUserId: string,
  level: number,
  referralProfit: number,
  referralUserId: string,
  currency: string = "USD",
  db?: Db,
): Promise<Transaction<ReferralMeta>> {
  const database = await getDb(db)
  const amount = calculateReferralIncome(level, referralProfit)
  const rate = amount === 0 ? 0 : roundToTwo(amount / referralProfit)
  const doc: Transaction<ReferralMeta> = {
    userId: uplineUserId,
    type: "referral",
    amount,
    currency,
    createdAt: new Date(),
    meta: {
      level,
      referralUserId,
      referralProfit,
      commissionRate: rate,
    },
  }
  await database.collection<Transaction>("transactions").insertOne(doc)
  return doc
}

export async function processNewStakePayouts(
  purchaserUserId: string,
  packageAmount: number,
  uplineChain: Array<{ userId: string; level: number }>,
  db?: Db,
): Promise<void> {
  const database = await getDb(db)
  await recordStakingIncome(purchaserUserId, packageAmount, new Date().toISOString().slice(0, 7), "USD", database)
  for (const upline of uplineChain) {
    if (upline.level >= 1 && upline.level <= 5) {
      await recordGenerationCommission(upline.userId, upline.level, packageAmount, purchaserUserId, "USD", database)
    }
  }
}


