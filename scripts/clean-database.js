const { MongoClient, ObjectId } = require("mongodb")

// MongoDB connection string - Update with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://garrydhillon981_db_user:EVuP4MYhevH1H10G@cluster0.05sc6ov.mongodb.net/mlm_system?retryWrites=true&w=majority"
const DB_NAME = "mlm_system"

async function cleanDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB Atlas")
    const db = client.db(DB_NAME)

    // Find admin user
    const adminUser = await db.collection("users").findOne({ role: "admin" })
    
    if (!adminUser) {
      console.error("❌ Admin user not found! Cannot proceed with database cleanup.")
      console.error("Please ensure an admin user exists before cleaning the database.")
      process.exit(1)
    }

    const adminId = adminUser._id
    console.log(`\n📋 Found admin user: ${adminUser.email} (ID: ${adminId})`)
    console.log("\n⚠️  WARNING: This will delete ALL data except the admin user!")
    console.log("   - All users (except admin)")
    console.log("   - All transactions")
    console.log("   - All withdrawal requests")
    console.log("   - All deposit requests")
    console.log("   - All franchise applications")
    console.log("   - All activation requests")
    console.log("   - All connection tree data")
    console.log("\n⏳ Starting database cleanup...\n")

    // Delete all users except admin
    const usersResult = await db.collection("users").deleteMany({ _id: { $ne: adminId } })
    console.log(`✅ Deleted ${usersResult.deletedCount} users (admin kept)`)

    // Delete all transactions
    const transactionsResult = await db.collection("transactions").deleteMany({})
    console.log(`✅ Deleted ${transactionsResult.deletedCount} transactions`)

    // Delete all withdrawal requests
    const withdrawalRequestsResult = await db.collection("withdrawalRequests").deleteMany({})
    console.log(`✅ Deleted ${withdrawalRequestsResult.deletedCount} withdrawal requests`)

    // Delete all deposit requests
    const depositRequestsResult = await db.collection("depositRequests").deleteMany({})
    console.log(`✅ Deleted ${depositRequestsResult.deletedCount} deposit requests`)

    // Delete all franchise applications
    const franchiseApplicationsResult = await db.collection("franchiseApplications").deleteMany({})
    console.log(`✅ Deleted ${franchiseApplicationsResult.deletedCount} franchise applications`)

    // Delete all activation requests
    const activationRequestsResult = await db.collection("activationRequests").deleteMany({})
    console.log(`✅ Deleted ${activationRequestsResult.deletedCount} activation requests`)

    // Reset admin user data (keep only essential fields)
    await db.collection("users").updateOne(
      { _id: adminId },
      {
        $set: {
          normalWallet: 0,
          franchiseWallet: 0,
          shakingWallet: 0,
          investmentAmount: 0,
          totalEarnings: 0,
          currentBalance: 0,
          leftDirects: 0,
          rightDirects: 0,
          greenPayouts: 0,
          blueStep: 0,
        },
        $unset: {
          investmentDate: "",
          lastRoiCreditDate: "",
          lastDailyRoiCreditDate: "",
          savedBankDetails: "",
          sponsorId: "",
          leftChildId: "",
          rightChildId: "",
        }
      }
    )
    console.log("✅ Reset admin user wallet balances and stats")

    console.log("\n✅ Database cleanup completed successfully!")
    console.log(`\n📧 Admin credentials:`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Password: (unchanged)`)
    console.log(`\n🔗 Login URL: https://www.dreamstake.in/login`)

  } catch (error) {
    console.error("❌ Error cleaning database:", error)
    process.exit(1)
  } finally {
    await client.close()
    console.log("\n✅ Database connection closed")
  }
}

// Run the cleanup
cleanDatabase()

