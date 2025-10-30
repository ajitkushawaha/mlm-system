export type TransactionType = "staking" | "generation" | "referral"

export interface BaseTransactionMeta {
  note?: string
}

export interface StakingMeta extends BaseTransactionMeta {
  amountStaked: number
  roiRate: number
  period: string
}

export interface GenerationMeta extends BaseTransactionMeta {
  level: number
  downlineUserId: string
  packageAmount: number
}

export interface ReferralMeta extends BaseTransactionMeta {
  level: number
  referralUserId: string
  referralProfit: number
  commissionRate: number
}

export interface Transaction<TMeta extends BaseTransactionMeta = BaseTransactionMeta> {
  _id?: string
  userId: string
  type: TransactionType
  amount: number
  currency: string
  createdAt: Date
  meta: TMeta
}


