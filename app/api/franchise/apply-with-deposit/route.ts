import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { FranchiseApplication } from "@/lib/models/FranchiseApplication"

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
    
    // Valid franchise amounts
    const validAmounts = [100, 200, 500, 1000]
    if (!amount || isNaN(amount) || !validAmounts.includes(amount)) {
      return NextResponse.json(
        { error: `Franchise fee must be one of: $100, $200, $500, or $1000` },
        { status: 400 },
      )
    }
    
    // Calculate bonus based on amount
    const getBonusForAmount = (amt: number) => {
      if (amt === 100) return { bonusPercent: 10, bonusAmount: 10, totalCredit: 110 }
      if (amt === 200) return { bonusPercent: 10, bonusAmount: 20, totalCredit: 220 }
      if (amt === 500) return { bonusPercent: 15, bonusAmount: 75, totalCredit: 575 }
      if (amt === 1000) return { bonusPercent: 20, bonusAmount: 200, totalCredit: 1200 }
      return { bonusPercent: 0, bonusAmount: 0, totalCredit: amt }
    }
    
    const bonus = getBonusForAmount(amount)

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a franchise member or admin
    if (user.role === "franchise" || user.role === "admin") {
      return NextResponse.json({ error: "You are already a franchise member or admin" }, { status: 400 })
    }

    // Check if user already has a pending application
    const existingApplication = await db
      .collection<FranchiseApplication>("franchiseApplications")
      .findOne({ userId: user._id!, status: "pending" })

    if (existingApplication) {
      return NextResponse.json({ error: "You already have a pending franchise application" }, { status: 400 })
    }

    const transactionHash = body.transactionHash as string | undefined
    const notes = body.notes as string | undefined
    const network = body.network || "BEP20"
    const proofImage = body.proofImage as string | undefined // Base64 string

    // Validate transaction hash (required)
    if (!transactionHash || transactionHash.trim() === "") {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 },
      )
    }
    
    // Validate proof image (required)
    if (!proofImage || proofImage.trim() === "") {
      return NextResponse.json(
        { error: "Payment proof image is required" },
        { status: 400 },
      )
    }

    // Validate base64 string format if provided
    if (proofImage && proofImage.trim() !== "") {
      if (!proofImage.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Invalid image format. Please upload a valid image file" },
          { status: 400 },
        )
      }
      // Validate base64 size (approximately 5MB when decoded)
      const base64Size = (proofImage.length * 3) / 4
      if (base64Size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size should be less than 5MB" }, { status: 400 })
      }
    }

    // Update user status to pending
    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $set: {
          franchiseStatus: "pending",
          franchisePurchaseDate: new Date(),
        },
      },
    )

    // Create franchise application with deposit details
    const franchiseApplication: FranchiseApplication = {
      userId: user._id!,
      userName: user.name,
      userEmail: user.email,
      userIdString: user.userId,
      amount: amount,
      bonusPercent: bonus.bonusPercent,
      bonusAmount: bonus.bonusAmount,
      totalCredit: bonus.totalCredit,
      status: "pending",
      requestedAt: new Date(),
      transactionHash,
      proofImage: proofImage, // Store base64 string
      notes,
      currency: "USD",
      network,
    }

    await db.collection<FranchiseApplication>("franchiseApplications").insertOne(franchiseApplication)

    return NextResponse.json({
      message: "Franchise application submitted successfully with deposit details",
      application: franchiseApplication,
    })
  } catch (error) {
    console.error("Franchise application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

