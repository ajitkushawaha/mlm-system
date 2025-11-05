const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = process.env.DB_NAME || "mlm_system"

async function verifyAdmin() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db(DB_NAME)
    const usersCollection = db.collection("users")

    // Check if admin exists
    const admin = await usersCollection.findOne({ email: "admin@dreamstake.com" })
    
    if (!admin) {
      console.log("❌ Admin user NOT found!")
      console.log("Run: node scripts/create-admin-user.js")
      return
    }

    console.log("✅ Admin user found!")
    console.log("Email:", admin.email)
    console.log("Role:", admin.role || "not set")
    console.log("Is Active:", admin.isActive)

    // Test password
    if (admin.password) {
      const testPassword = await bcrypt.compare("admin123", admin.password)
      console.log("\nPassword test:")
      console.log("  Password 'admin123' matches:", testPassword ? "✅ YES" : "❌ NO")
      
      if (!testPassword) {
        console.log("\n⚠️  Password doesn't match! Updating password...")
        const newHash = await bcrypt.hash("admin123", 12)
        await usersCollection.updateOne(
          { email: "admin@dreamstake.com" },
          { $set: { password: newHash } }
        )
        console.log("✅ Password updated successfully!")
      }
    } else {
      console.log("❌ No password found! Setting password...")
      const newHash = await bcrypt.hash("admin123", 12)
      await usersCollection.updateOne(
        { email: "admin@dreamstake.com" },
        { $set: { password: newHash } }
      )
      console.log("✅ Password set successfully!")
    }

    // Ensure role is set
    if (!admin.role || admin.role !== "admin") {
      console.log("\n⚠️  Role not set to 'admin'! Updating...")
      await usersCollection.updateOne(
        { email: "admin@dreamstake.com" },
        { $set: { role: "admin" } }
      )
      console.log("✅ Role updated to 'admin'!")
    }

    // Ensure isActive is true
    if (!admin.isActive) {
      console.log("\n⚠️  User is not active! Updating...")
      await usersCollection.updateOne(
        { email: "admin@dreamstake.com" },
        { $set: { isActive: true } }
      )
      console.log("✅ User activated!")
    }

    console.log("\n✅ Admin user verified and ready!")
    console.log("\n📧 Login credentials:")
    console.log("   Email: admin@dreamstake.com")
    console.log("   Password: admin123")

  } catch (error) {
    console.error("Error:", error)
  } finally {
    await client.close()
  }
}

verifyAdmin()

