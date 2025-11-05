import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  userId?: string // User ID format: DS123456 (DreamStake prefix + 6 digits)
  email: string
  password: string
  name: string
  phone: string
  sponsorId?: ObjectId
  leftChild?: ObjectId
  rightChild?: ObjectId
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  joinDate: Date
  lastActivity: Date
  totalEarnings: number
  currentBalance: number // Legacy field, will be migrated to normalWallet
  
  // Wallet System
  normalWallet: number // Stores all earnings (referral + ROI)
  franchiseWallet: number // Used to activate users ($10 each)
  shakingWallet: number // Stores locked investment amounts

  // Green ID specific
  greenPayouts: number

  // Blue ID specific
  blueStep: number
  bluePairs: {
    left: number
    right: number
  }

  // Gold ID specific
  goldActivated: boolean

  // Booster tracking
  boosterActive: boolean
  boosterDeadline?: Date
  leftDirects: number
  rightDirects: number

  // TDS tracking
  totalTdsDeducted: number

  role?: "admin" | "franchise" | "user"
  
  // Franchise System
  franchiseStatus?: "pending" | "approved" | "rejected"
  franchisePaymentProof?: string // URL to uploaded image
  franchisePurchaseDate?: Date
  
  // Activation System
  activationPaymentProof?: string // URL to uploaded image
  activationStatus?: "pending" | "approved" | "rejected"
  activatedBy?: ObjectId // Franchise Member who activated this user
  activationDate?: Date
  
  // Investment System (Shaking Wallet)
  investmentAmount?: number
  investmentDate?: Date
  investmentLockPeriod?: number // months
  investmentUnlockDate?: Date
  lastRoiCreditDate?: Date
  
  // Saved Bank Details for Withdrawals
  savedBankDetails?: {
    bankName?: string
    accountNumber?: string
    accountHolderName?: string
    ifscCode?: string
    branchName?: string
    savedAt?: Date
  }
}

export interface Payout {
  _id?: ObjectId
  userId: ObjectId
  amount: number
  type: "pair" | "direct" | "matching" | "leadership" | "global"
  level: "green" | "blue" | "gold"
  tdsAmount: number
  netAmount: number
  pairDetails?: {
    leftPairs: number
    rightPairs: number
    step?: number
  }
  createdAt: Date
  cycleTime: "12am-12pm" | "12pm-12am"
}

export interface Referral {
  _id?: ObjectId
  sponsorId: ObjectId
  referredId: ObjectId
  position: "left" | "right"
  level: number
  createdAt: Date
}
