import type { ObjectId } from "mongodb"

export interface FranchiseApplication {
  _id?: ObjectId
  userId: ObjectId
  userName?: string
  userEmail?: string
  userIdString?: string // User ID like DS123456
  amount: number // Franchise fee: $100, $200, $500, or $1000
  bonusPercent?: number // Bonus percentage (10%, 15%, 20%)
  bonusAmount?: number // Bonus amount in dollars
  totalCredit?: number // Total amount to credit (amount + bonus)
  status: "pending" | "approved" | "rejected"
  requestedAt: Date
  processedAt?: Date
  processedBy?: ObjectId // Admin who processed it
  rejectionReason?: string
  // Deposit Details
  transactionHash?: string // BEP20/ERC20/TRC20 transaction hash
  proofImage?: string // Base64 string of uploaded proof image
  notes?: string // User notes
  currency: string
  network: string // BEP20, ERC20, TRC20, etc.
}

