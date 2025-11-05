export type TransactionType = "staking" | "generation" | "referral" | "activation" | "roi" | "transfer" | "franchise"

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

export interface ActivationMeta extends BaseTransactionMeta {
  level: number
  activatedUserId: string
  activationFee: number
  commissionRate: number
}

export interface RoiMeta extends BaseTransactionMeta {
  investmentAmount: number
  roiRate: number
  roiPercentage: number
  period: string
}

export interface TransferMeta extends BaseTransactionMeta {
  fromWallet: "normal" | "franchise" | "shaking"
  toWallet: "normal" | "franchise" | "shaking"
  transferType: "user" | "admin"
}

export interface FranchiseMeta extends BaseTransactionMeta {
  franchiseFee: number
  franchiseWalletCredit?: number
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


