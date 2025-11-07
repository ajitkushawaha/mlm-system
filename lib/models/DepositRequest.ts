import type { ObjectId } from "mongodb"

export interface DepositRequest {
  _id?: ObjectId
  userId: ObjectId
  userName?: string
  userEmail?: string
  userIdString?: string // User ID like DS123456
  amount: number
  status: "pending" | "approved" | "rejected"
  requestedAt: Date
  processedAt?: Date
  processedBy?: ObjectId // Admin who processed it
  rejectionReason?: string
  // Deposit Details
  transactionHash?: string // BEP20 transaction hash
  proofImage?: string // URL to uploaded proof image (screenshot, etc.)
  notes?: string // User notes
  currency: string
  network: string // BEP20, ERC20, etc.
}

