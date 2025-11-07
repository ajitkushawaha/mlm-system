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
  withdrawalMethod?: "bank" | "crypto" // Withdrawal method type
  // Bank Transfer Details
  bankName?: string
  accountNumber?: string
  accountHolderName?: string
  ifscCode?: string
  branchName?: string
  bankPassbookImage?: string // URL to uploaded passbook image
  // Crypto Transfer Details
  cryptoWalletAddress?: string
  cryptoNetwork?: "BEP20" | "ERC20" | "TRC20"
  cryptoQrCodeImage?: string // URL to uploaded QR code image
  currency: string
  notes?: string
}

