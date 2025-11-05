import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabase } from "./mongodb"
import type { User } from "./models/User"
import { ObjectId } from "mongodb"

type CreateUserInput = {
  email: string
  password: string
  name: string
  phone: string
  role: "user" | "admin" | "franchise"
  sponsorId?: ObjectId
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  activationPaymentProof?: string
  activationStatus?: "pending" | "approved" | "rejected"
  activatedBy?: ObjectId
}
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}



import type { Db } from "mongodb"

/**
 * Generate a unique User ID in format: DS + 6 digits (e.g., DS123456)
 */
async function generateUserId(db: Db): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    // Generate 6-digit random number
    const randomNum = Math.floor(100000 + Math.random() * 900000) // 100000-999999
    const userId = `DS${randomNum}`

    // Check if this User ID already exists
    const existing = await db.collection("users").findOne({ userId })
    if (!existing) {
      return userId
    }

    attempts++
  }

  // Fallback: Use timestamp-based ID if random fails
  const timestamp = Date.now().toString().slice(-6)
  return `DS${timestamp}`
}

export async function createUser(userData: CreateUserInput): Promise<User> {
  const db = await getDatabase()
  const hashedPassword = await hashPassword(userData.password)

  // Generate User ID for non-admin users
  const userId = userData.role === "admin" ? undefined : await generateUserId(db)

  const newUser: User = {
    ...userData,
    userId,
    password: hashedPassword,
    joinDate: new Date(),
    lastActivity: new Date(),
    totalEarnings: 0,
    currentBalance: 0,
    normalWallet: 0,
    franchiseWallet: 0,
    shakingWallet: 0,
    greenPayouts: 0,
    blueStep: 0,
    bluePairs: { left: 0, right: 0 },
    goldActivated: false,
    boosterActive: true,
    boosterDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    leftDirects: 0,
    rightDirects: 0,
    totalTdsDeducted: 0,
  }

  const result = await db.collection<User>("users").insertOne(newUser)
  return { ...newUser, _id: result.insertedId }
}

