import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { WithdrawalRequest } from "@/lib/models/WithdrawalRequest"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const amount = parseFloat(body.amount)

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: "Valid withdrawal amount is required" }, { status: 400 })
    }

    if (amount < 10) {
      return NextResponse.json({ error: "Minimum withdrawal amount is $10" }, { status: 400 })
    }

    if (amount % 10 !== 0) {
      return NextResponse.json({ error: "Withdrawal amount must be a multiple of $10 (e.g., $10, $20, $30, etc.)" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const availableBalance = user.normalWallet ?? user.currentBalance ?? 0

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` },
        { status: 400 },
      )
    }

    // Get withdrawal method
    const withdrawalMethod = body.withdrawalMethod || "bank"

    // Get bank details (if bank method)
    const bankName = body.bankName as string
    const accountNumber = body.accountNumber as string
    const accountHolderName = body.accountHolderName as string
    const ifscCode = body.ifscCode as string
    const branchName = body.branchName as string
    const saveForLater = body.saveForLater === true
    const bankPassbookImage = body.bankPassbookImage as string // Base64 string

    // Get crypto details (if crypto method)
    const cryptoWalletAddress = body.cryptoWalletAddress as string
    const cryptoNetwork = body.cryptoNetwork as string
    const cryptoQrCodeImage = body.cryptoQrCodeImage as string // Base64 string

    // Validate based on withdrawal method
    if (withdrawalMethod === "bank") {
      const hasBankDetails = bankName && accountNumber && accountHolderName && ifscCode
      if (!hasBankDetails) {
        return NextResponse.json(
          { error: "Please provide all required bank details" },
          { status: 400 },
        )
      }
      if (!bankPassbookImage || bankPassbookImage.trim() === "") {
        return NextResponse.json(
          { error: "Please upload bank passbook image" },
          { status: 400 },
        )
      }
      // Validate base64 string format
      if (!bankPassbookImage.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Invalid image format. Please upload a valid image file" },
          { status: 400 },
        )
      }
      // Validate base64 size (approximately 5MB when decoded)
      const base64Size = (bankPassbookImage.length * 3) / 4
      if (base64Size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size should be less than 5MB" }, { status: 400 })
      }
    } else if (withdrawalMethod === "crypto") {
      // Wallet address is required
      if (!cryptoWalletAddress || cryptoWalletAddress.trim() === "") {
        return NextResponse.json(
          { error: "Please provide crypto wallet address" },
          { status: 400 },
        )
      }
      // QR code is required
      if (!cryptoQrCodeImage || cryptoQrCodeImage.trim() === "") {
        return NextResponse.json(
          { error: "Please upload crypto wallet QR code" },
          { status: 400 },
        )
      }
      // Validate base64 string format
      if (!cryptoQrCodeImage.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Invalid image format. Please upload a valid image file" },
          { status: 400 },
        )
      }
      // Validate base64 size (approximately 5MB when decoded)
      const base64Size = (cryptoQrCodeImage.length * 3) / 4
      if (base64Size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size should be less than 5MB" }, { status: 400 })
      }
      if (!cryptoNetwork || !["BEP20", "ERC20", "TRC20"].includes(cryptoNetwork)) {
        return NextResponse.json(
          { error: "Please select a valid crypto network" },
          { status: 400 },
        )
      }
      // Validate wallet address format
      if (cryptoNetwork === "BEP20" || cryptoNetwork === "ERC20") {
        if (!cryptoWalletAddress.startsWith("0x") || cryptoWalletAddress.length < 26) {
          return NextResponse.json(
            { error: "Invalid wallet address. BEP20/ERC20 addresses should start with 0x and be at least 26 characters" },
            { status: 400 },
          )
        }
      } else if (cryptoNetwork === "TRC20") {
        if (!cryptoWalletAddress.startsWith("T") || cryptoWalletAddress.length < 26) {
          return NextResponse.json(
            { error: "Invalid wallet address. TRC20 addresses should start with T and be at least 26 characters" },
            { status: 400 },
          )
        }
      }
    } else {
      return NextResponse.json(
        { error: "Invalid withdrawal method. Please select Bank Account or Crypto" },
        { status: 400 },
      )
    }

    // Create withdrawal request
    const withdrawalRequest: WithdrawalRequest = {
      userId: user._id!,
      userName: user.name,
      userEmail: user.email,
      amount,
      status: "pending",
      requestedAt: new Date(),
      withdrawalMethod: withdrawalMethod as "bank" | "crypto",
      bankName: withdrawalMethod === "bank" ? (bankName || undefined) : undefined,
      accountNumber: withdrawalMethod === "bank" ? (accountNumber || undefined) : undefined,
      accountHolderName: withdrawalMethod === "bank" ? (accountHolderName || undefined) : undefined,
      ifscCode: withdrawalMethod === "bank" ? (ifscCode || undefined) : undefined,
      branchName: withdrawalMethod === "bank" ? (branchName || undefined) : undefined,
      bankPassbookImage: withdrawalMethod === "bank" ? bankPassbookImage : undefined, // Store base64 string
      cryptoWalletAddress: withdrawalMethod === "crypto" ? (cryptoWalletAddress || undefined) : undefined,
      cryptoNetwork: withdrawalMethod === "crypto" ? (cryptoNetwork as "BEP20" | "ERC20" | "TRC20") : undefined,
      cryptoQrCodeImage: withdrawalMethod === "crypto" ? cryptoQrCodeImage : undefined, // Store base64 string
      currency: "USD",
    }

    await db.collection<WithdrawalRequest>("withdrawalRequests").insertOne(withdrawalRequest)

    // Save bank details to user profile if requested (only for bank method)
    if (withdrawalMethod === "bank" && saveForLater && bankName && accountNumber && accountHolderName && ifscCode) {
      await db.collection<User>("users").updateOne(
        { _id: user._id },
        {
          $set: {
            savedBankDetails: {
              bankName,
              accountNumber,
              accountHolderName,
              ifscCode,
              branchName: branchName || undefined,
              savedAt: new Date(),
            },
          },
        },
      )
    }

    return NextResponse.json({
      message: "Withdrawal request submitted successfully",
      request: withdrawalRequest,
    })
  } catch (error) {
    console.error("Withdrawal request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

