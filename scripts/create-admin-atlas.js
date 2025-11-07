const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

// Use the MongoDB Atlas connection
// Update cluster name if different (e.g., cluster0, cluster1, etc.)
const MONGODB_URI = "mongodb+srv://mlmAjit:LAXQqzWI9PsZKAXZ@cluster0.mongodb.net/mlm_system?retryWrites=true&w=majority"
const DB_NAME = "mlm_system"

async function createAdminUser() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB Atlas")
    console.log("Database:", DB_NAME)

    const db = client.db(DB_NAME)
    const usersCollection = db.collection("users")

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: "admin@dreamstake.com" })
    if (existingAdmin) {
      console.log("ℹ️  Admin user already exists in MongoDB Atlas")
      console.log("\n📧 Login credentials:")
      console.log("   Email: admin@dreamstake.com")
      console.log("   Password: admin123")
      
      // Verify password
      const testPassword = await bcrypt.compare("admin123", existingAdmin.password)
      if (!testPassword) {
        console.log("\n⚠️  Password doesn't match! Updating...")
        const newHash = await bcrypt.hash("admin123", 12)
        await usersCollection.updateOne(
          { email: "admin@dreamstake.com" },
          { $set: { password: newHash } }
        )
        console.log("✅ Password updated!")
      }
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12)

    const adminUser = {
      email: "admin@dreamstake.com",
      password: hashedPassword,
      name: "System Administrator",
      phone: "+1234567890",
      membershipLevel: "gold",
      isActive: true,
      joinDate: new Date(),
      lastActivity: new Date(),
      totalEarnings: 0,
      currentBalance: 0,
      normalWallet: 0,
      franchiseWallet: 0,
      shakingWallet: 0,
      greenPayouts: 0,
      blueStep: 10,
      bluePairs: { left: 100000, right: 100000 },
      goldActivated: true,
      boosterActive: true,
      leftDirects: 0,
      rightDirects: 0,
      totalTdsDeducted: 0,
      role: "admin",
    }

    const result = await usersCollection.insertOne(adminUser)
    console.log("✅ Admin user created successfully in MongoDB Atlas!")
    console.log("   ID:", result.insertedId)
    console.log("\n📧 Login credentials:")
    console.log("   Email: admin@dreamstake.com")
    console.log("   Password: admin123")
    console.log("\n🔗 Login URL: http://localhost:3000/login")
    console.log("\n⚠️  Please change the password after first login!")
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
    console.log("\nMake sure:")
    console.log("1. MongoDB Atlas connection string is correct in .env.local")
    console.log("2. Your IP is whitelisted in MongoDB Atlas")
    console.log("3. Network access is enabled")
  } finally {
    await client.close()
  }
}

createAdminUser()

