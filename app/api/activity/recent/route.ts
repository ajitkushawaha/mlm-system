import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Transaction, GenerationMeta, ReferralMeta, ActivationMeta, TransferMeta } from "@/lib/models/Transaction"
import type { User } from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const db = await getDatabase()
    const userIdString = new ObjectId(decoded.userId).toString()
    const userId = new ObjectId(decoded.userId)

    // Get recent transactions (all types) ordered by most recent
    const transactions = await db
      .collection<Transaction>("transactions")
      .find({
        userId: userIdString,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // Get user to check network info
    const user = await db.collection<User>("users").findOne({ _id: userId })

    // Format transactions for activity feed
    const activities = await Promise.all(
      transactions.map(async (transaction) => {
        let description = ""
        let type: "payout" | "referral" | "upgrade" | "bonus" = "bonus"

        switch (transaction.type) {
          case "generation": {
            const genMeta = transaction.meta as GenerationMeta
            const level = genMeta.level || 1
            // Try to get downline user info
            let downlineName = ""
            let downlineUser: User | null = null
            if (genMeta.downlineUserId) {
              try {
                downlineUser = await db
                  .collection<User>("users")
                  .findOne({ _id: new ObjectId(genMeta.downlineUserId) })
                downlineName = downlineUser?.name || ""
              } catch {
                // Ignore errors
              }
            }
            
            // Level 1 (direct referral) should show "New member joined" or "Direct bonus"
            if (level === 1 && user && downlineUser) {
              if (user.leftChild?.toString() === genMeta.downlineUserId) {
                description = downlineName
                  ? `Direct bonus from referral (${downlineName} joined left leg)`
                  : `New member joined your left leg`
              } else if (user.rightChild?.toString() === genMeta.downlineUserId) {
                description = downlineName
                  ? `Direct bonus from referral (${downlineName} joined right leg)`
                  : `New member joined your right leg`
              } else {
                description = downlineName
                  ? `Direct bonus from referral (${downlineName})`
                  : `Direct bonus from referral`
              }
            } else {
              description = downlineName
                ? `Generation commission from Level ${level} (${downlineName})`
                : `Generation commission from Level ${level}`
            }
            type = "bonus"
            break
          }
          case "referral": {
            const refMeta = transaction.meta as ReferralMeta
            // Try to get referral user info
            let referralName = ""
            if (refMeta.referralUserId) {
              try {
                const referralUser = await db
                  .collection<User>("users")
                  .findOne({ _id: new ObjectId(refMeta.referralUserId) })
                referralName = referralUser?.name || ""
              } catch {
                // Ignore errors
              }
            }
            description = referralName
              ? `Referral income from Level ${refMeta.level || "N/A"} (${referralName})`
              : `Referral income from Level ${refMeta.level || "N/A"}`
            type = "referral"
            break
          }
          case "roi": {
            description = `ROI from Staking Wallet investment`
            type = "payout"
            break
          }
          case "activation": {
            const actMeta = transaction.meta as ActivationMeta
            // Try to get activated user info
            let activatedName = ""
            if (actMeta.activatedUserId) {
              try {
                const activatedUser = await db
                  .collection<User>("users")
                  .findOne({ _id: new ObjectId(actMeta.activatedUserId) })
                activatedName = activatedUser?.name || ""
              } catch {
                // Ignore errors
              }
            }
            description = activatedName
              ? `Activation commission from Level ${actMeta.level || "N/A"} (${activatedName})`
              : `Activation commission from Level ${actMeta.level || "N/A"}`
            type = "bonus"
            break
          }
          case "transfer": {
            const transferMeta = transaction.meta as TransferMeta
            if (transferMeta.fromWallet === "normal" && transferMeta.toWallet === "staking") {
              description = `Investment transferred to Staking Wallet`
            } else if (transferMeta.fromWallet === "staking" && transferMeta.toWallet === "normal") {
              description = `Withdrawal from Staking Wallet`
            } else if (transferMeta.fromWallet === "franchise" && transferMeta.toWallet === "normal") {
              description = transferMeta.note || `User activation payment`
            } else if (transferMeta.transferType === "admin" && transferMeta.note?.includes("Withdrawal approved")) {
              // Withdrawal transaction - show as negative
              description = transferMeta.note || `Withdrawal approved`
            } else if (transferMeta.transferType === "admin" && transferMeta.note?.includes("Deposit approved")) {
              // Deposit transaction - show as positive
              description = transferMeta.note || `Deposit approved`
            } else {
              description = transferMeta.note || `Wallet transfer: ${transferMeta.fromWallet} → ${transferMeta.toWallet}`
            }
            type = "bonus"
            break
          }
          case "franchise": {
            description = `Franchise application approved`
            type = "upgrade"
            break
          }
          default: {
            description = transaction.meta?.note || "Transaction"
            type = "bonus"
          }
        }

        // Determine if this is a debit (negative) or credit (positive) transaction
        let displayAmount: number | undefined = undefined
        let isDebit = false
        const transferMeta = transaction.meta as TransferMeta | undefined
        
        if (transaction.type === "transfer") {
          // For transfers, check if it's a withdrawal (negative) or deposit (positive)
          if (transferMeta?.note?.includes("Withdrawal approved")) {
            // Withdrawal - show as negative
            displayAmount = Math.abs(transaction.amount) // Amount is already negative in DB
            isDebit = true
          } else if (transferMeta?.note?.includes("Deposit approved")) {
            // Deposit - show as positive
            displayAmount = transaction.amount
            isDebit = false
          } else if (transferMeta?.fromWallet === "franchise" && transferMeta?.toWallet === "normal") {
            // User activation - franchise wallet deduction (DEBIT)
            displayAmount = transaction.amount
            isDebit = true
          } else if (transferMeta?.fromWallet === "normal" && transferMeta?.toWallet === "staking") {
            // Investment - don't show amount (internal transfer)
            displayAmount = undefined
            isDebit = false
          } else if (transferMeta?.toWallet === "normal") {
            // Credit to normal wallet - show as positive
            displayAmount = transaction.amount
            isDebit = false
          }
        } else {
          // All other transaction types (roi, referral, generation, activation) are credits
          displayAmount = transaction.amount
          isDebit = false
        }

        return {
          id: transaction._id?.toString() || "",
          type,
          description,
          amount: displayAmount,
          isDebit: isDebit,
          timestamp: transaction.createdAt,
          status: "completed" as const,
        }
      }),
    )

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Recent activity error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

