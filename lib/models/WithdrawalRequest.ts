import type { ObjectId } from "mongodb"

export interface WithdrawalRequest {
  _id?: ObjectId
  userId: ObjectId
  userName?: string
  userEmail?: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requestedAt: Date
  processedAt?: Date
  processedBy?: ObjectId // Admin who processed it
  rejectionReason?: string
  // Bank Transfer Details
  bankName?: string
  accountNumber?: string
  accountHolderName?: string
  ifscCode?: string
  branchName?: string
  bankPassbookImage?: string // URL to uploaded passbook image
  currency: string
  notes?: string
}

