import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
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
  currentBalance: number

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

  role?: "admin" | "user"
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
