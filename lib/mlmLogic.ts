import type { Db } from "mongodb"
import type {
  Transaction,
  StakingMeta,
  GenerationMeta,
  ReferralMeta,
  ActivationMeta,
} from "@/lib/models/Transaction"
import { calculateStakingIncome } from "@/lib/staking-calculator"

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

// Re-export for backward compatibility with server-side code
export { calculateStakingIncome }

export function calculateGenerationCommission(level: number): number {
  const mapping: Record<number, number> = {
    1: 3,
    2: 1,
    3: 0.8,
    4: 0.7,
    5: 0.6,
  }
  return mapping[level] ?? 0
}

export function calculateReferralIncome(referralLevel: number, referralProfit: number): number {
  const mapping: Record<number, number> = {
    1: 0.2,
    2: 0.17,
    3: 0.13,
    4: 0.09,
    5: 0.05,
  }
  const rate = mapping[referralLevel] ?? 0
  return roundToTwo(referralProfit * rate)
}

export function calculateActivationCommission(level: number, activationFee: number = 10): number {
  const mapping: Record<number, number> = {
    1: 0.5, // 50% of $10 = $5
    2: 0.2, // 20% of $10 = $2
    3: 0.1, // 10% of $10 = $1
  }
  const rate = mapping[level] ?? 0
  return roundToTwo(activationFee * rate)
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

export async function recordActivationCommission(
  uplineUserId: string,
  level: number,
  activationFee: number,
  activatedUserId: string,
  currency: string = "USD",
  db?: Db,
): Promise<Transaction<ActivationMeta>> {
  const database = await getDb(db)
  const commission = calculateActivationCommission(level, activationFee)
  const rate = commission === 0 ? 0 : roundToTwo(commission / activationFee)
  const doc: Transaction<ActivationMeta> = {
    userId: uplineUserId,
    type: "activation",
    amount: commission,
    currency,
    createdAt: new Date(),
    meta: {
      level,
      activatedUserId,
      activationFee,
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


