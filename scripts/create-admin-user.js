const { MongoClient, ObjectId } = require("mongodb")
const bcrypt = require("bcryptjs")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "mlm_system"

async function createAdminUser() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db(DB_NAME)
    const usersCollection = db.collection("users")

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: "admin@mlmpro.com" })
    if (existingAdmin) {
      console.log("Admin user already exists")
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12)

    const adminUser = {
      email: "admin@mlmpro.com",
      password: hashedPassword,
      name: "System Administrator",
      phone: "+1234567890",
      membershipLevel: "gold",
      isActive: true,
      joinDate: new Date(),
      lastActivity: new Date(),
      totalEarnings: 0,
      currentBalance: 0,
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
    console.log("Admin user created successfully:", result.insertedId)
    console.log("Login credentials:")
    console.log("Email: admin@mlmpro.com")
    console.log("Password: admin123")
  } catch (error) {
    console.error("Error creating admin user:", error)
  } finally {
    await client.close()
  }
}

createAdminUser()
