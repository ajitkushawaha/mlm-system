import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { WithdrawalRequest } from "@/lib/models/WithdrawalRequest"
import { writeFile } from "fs/promises"
import { join } from "path"

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

    const formData = await request.formData()
    const amount = parseFloat(formData.get("amount") as string)

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: "Valid withdrawal amount is required" }, { status: 400 })
    }

    if (amount < 10) {
      return NextResponse.json({ error: "Minimum withdrawal amount is $10" }, { status: 400 })
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

    // Get bank details
    const bankName = formData.get("bankName") as string
    const accountNumber = formData.get("accountNumber") as string
    const accountHolderName = formData.get("accountHolderName") as string
    const ifscCode = formData.get("ifscCode") as string
    const branchName = formData.get("branchName") as string
    const saveForLater = formData.get("saveForLater") === "true"

    // Validate: Either bank details OR passbook image
    const hasBankDetails = bankName && accountNumber && accountHolderName && ifscCode
    const passbookFile = formData.get("bankPassbook") as File | null

    if (!hasBankDetails && !passbookFile) {
      return NextResponse.json(
        { error: "Please provide bank details or upload bank passbook image" },
        { status: 400 },
      )
    }

    // Handle file upload for bank passbook
    let bankPassbookImageUrl: string | undefined
    if (passbookFile && passbookFile.size > 0) {
      // Validate file type
      if (!passbookFile.type.startsWith("image/")) {
        return NextResponse.json({ error: "Bank passbook must be an image file" }, { status: 400 })
      }

      // Validate file size (5MB)
      if (passbookFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size should be less than 5MB" }, { status: 400 })
      }

      // Save file
      const bytes = await passbookFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const fileName = `passbook-${decoded.userId}-${Date.now()}.${passbookFile.name.split(".").pop()}`
      const uploadDir = join(process.cwd(), "public", "uploads", "withdrawals")
      
      // Ensure directory exists
      const { mkdir } = await import("fs/promises")
      await mkdir(uploadDir, { recursive: true })

      const filePath = join(uploadDir, fileName)
      await writeFile(filePath, buffer)

      bankPassbookImageUrl = `/uploads/withdrawals/${fileName}`
    }

    // Create withdrawal request
    const withdrawalRequest: WithdrawalRequest = {
      userId: user._id!,
      userName: user.name,
      userEmail: user.email,
      amount,
      status: "pending",
      requestedAt: new Date(),
      bankName: bankName || undefined,
      accountNumber: accountNumber || undefined,
      accountHolderName: accountHolderName || undefined,
      ifscCode: ifscCode || undefined,
      branchName: branchName || undefined,
      bankPassbookImage: bankPassbookImageUrl,
      currency: "USD",
    }

    await db.collection<WithdrawalRequest>("withdrawalRequests").insertOne(withdrawalRequest)

    // Save bank details to user profile if requested
    if (saveForLater && hasBankDetails) {
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

