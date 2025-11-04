# DreamStake - Project Work Process Documentation

## 🎯 Project Overview

**DreamStake** is a trading and staking platform built on a binary MLM (Multi-Level Marketing) structure. The system allows users to:
- Earn passive income through staking
- Build a referral network in a binary tree structure
- Generate income through three main streams: Staking Income, Generation Commission, and Referral Income

---

## 📋 Table of Contents

1. [User Registration & Authentication Flow](#user-registration--authentication-flow)
2. [Binary Network Structure](#binary-network-structure)
3. [Income Streams](#income-streams)
4. [Transaction System](#transaction-system)
5. [Admin Features](#admin-features)
6. [Technical Architecture](#technical-architecture)

---

## 1. User Registration & Authentication Flow

### Registration Process

**Step 1: User Registration (`/app/register/page.tsx`)**
- User provides:
  - Name, Email, Phone, Password
  - Optional: Sponsor Code (referral code of an existing user)

**Step 2: Backend Processing (`/app/api/auth/register/route.ts`)**
```javascript
1. Validates required fields
2. Checks if email already exists
3. If sponsor code provided:
   - Validates sponsor exists
   - Links user to sponsor in binary tree
4. Creates new user with default values:
   - membershipLevel: "green"
   - isActive: true
   - Initial balance: $0
   - Binary tree placement (left/right)
```

**Step 3: Binary Tree Placement**
- If sponsor has no left child → place on left
- If sponsor has left but no right → place on right
- Updates sponsor's `leftDirects` or `rightDirects` count
- Activates "Booster" if sponsor has both left and right directs

### Authentication Flow

**Login (`/app/api/auth/login/route.ts`)**
1. Validates email and password
2. Verifies password hash using bcrypt
3. Generates JWT token
4. Sets HTTP-only cookie (7-day expiry)
5. Returns user data (without password)

**Session Management (`/hooks/use-auth.tsx`)**
- Uses React Context for global auth state
- Automatically checks `/api/auth/me` on mount
- Redirects to login if not authenticated
- Provides `user`, `loading`, `login`, `logout` functions

---

## 2. Binary Network Structure

### Binary Tree Model

Each user has:
```typescript
{
  leftChild: ObjectId | undefined    // Left leg direct referral
  rightChild: ObjectId | undefined   // Right leg direct referral
  leftDirects: number                // Count of left leg members
  rightDirects: number                // Count of right leg members
  sponsorId: ObjectId | undefined     // Who referred this user
}
```

### Network Building

**Tree Construction (`/app/api/network/tree/route.ts`)**
- Recursively builds binary tree from current user
- Maximum depth: 3 levels (configurable)
- Shows: Name, Email, Membership Level, Earnings, Position (left/right)

**Referral Tree (`/app/api/referrals/tree/route.ts`)**
- Shows referral chain (sponsor → direct referrals → their referrals)
- Maximum 5 levels deep
- Used for referral income calculations

### Network Statistics (`/app/api/network/stats/route.ts`)

Calculates:
- **Total Network Size**: All members in your binary tree
- **Left Leg Size**: All members in left subtree
- **Right Leg Size**: All members in right subtree
- **Potential Pairs**: `min(leftLegSize, rightLegSize)` (for matching bonuses)
- **Balance Ratio**: `leftLegSize / rightLegSize`
- **Direct Referrals**: `leftDirects + rightDirects`

---

## 3. Income Streams

### 3.1 Staking Income (Passive ROI)

**Calculation (`lib/mlmLogic.ts` → `calculateStakingIncome`)**

Staking tier system:
- **$100 - $1,000**: 4% monthly ROI
- **$1,000 - $4,000**: 5% monthly ROI
- **$4,000 - $6,000**: 6% monthly ROI
- **$6,000 - $10,000**: 7% monthly ROI
- **Above $10,000**: 8% monthly ROI

**Example:**
- User stakes $5,000
- Falls in 6% tier
- Monthly income: $5,000 × 0.06 = **$300/month**

**Recording:** `recordStakingIncome()` creates transaction with type `"staking"`

---

### 3.2 Generation Commission (One-time)

**Calculation (`lib/mlmLogic.ts` → `calculateGenerationCommission`)**

When someone in your downline purchases a package, you earn fixed commission based on generation level:

| Generation Level | Commission |
|-----------------|------------|
| 1st Generation  | $3.00      |
| 2nd Generation  | $1.00      |
| 3rd Generation  | $0.80      |
| 4th Generation  | $0.70      |
| 5th Generation  | $0.60      |

**How it works:**
1. User purchases a package
2. System traces upline chain (sponsor → sponsor's sponsor → ... up to 5 levels)
3. Each upline receives their level's commission
4. Instant credit to `currentBalance`

**API Endpoint:** `/api/referrals/credit` (called when package purchased)

**Recording:** `recordGenerationCommission()` creates transaction with type `"generation"`

---

### 3.3 Referral Income (Residual - Ongoing)

**Calculation (`lib/mlmLogic.ts` → `calculateReferralIncome`)**

You earn a percentage of your referrals' monthly staking income:

| Referral Level | Percentage | Example Calculation |
|---------------|------------|---------------------|
| Level 1       | 20%        | Ref earns $500 → You get $100 |
| Level 2       | 17%        | Ref earns $500 → You get $85 |
| Level 3       | 13%        | Ref earns $500 → You get $65 |
| Level 4       | 9%         | Ref earns $500 → You get $45 |
| Level 5       | 5%         | Ref earns $500 → You get $25 |

**How it works:**
1. Monthly payout cycle runs
2. For each referral's staking income:
   - System identifies referral level (1-5)
   - Calculates your commission percentage
   - Credits to your account

**Recording:** `recordReferralIncome()` creates transaction with type `"referral"`

---

## 4. Transaction System

### Transaction Types

**Database Schema (`lib/models/Transaction.ts`)**
```typescript
Transaction {
  userId: string
  type: "staking" | "generation" | "referral"
  amount: number
  currency: "USD"
  createdAt: Date
  meta: {
    // Staking: { amountStaked, roiRate, period }
    // Generation: { level, downlineUserId, packageAmount }
    // Referral: { level, referralUserId, referralProfit, commissionRate }
  }
}
```

### Transaction Flow

**1. Staking Income**
```javascript
recordStakingIncome(userId, amountStaked, period, currency)
  ↓
calculateStakingIncome(amountStaked) // Calculate ROI
  ↓
Create transaction record
  ↓
Update user.currentBalance += income
```

**2. Generation Commission**
```javascript
processNewStakePayouts(purchaserUserId, packageAmount, uplineChain)
  ↓
For each upline (level 1-5):
  recordGenerationCommission(uplineUserId, level, packageAmount, purchaserUserId)
    ↓
  calculateGenerationCommission(level) // Get fixed amount
    ↓
  Create transaction
    ↓
  Update upline.currentBalance += commission
```

**3. Referral Income**
```javascript
recordReferralIncome(uplineUserId, level, referralProfit, referralUserId)
  ↓
calculateReferralIncome(level, referralProfit) // Calculate percentage
  ↓
Create transaction
  ↓
Update upline.currentBalance += commission
```

### Payout System

**Payout History (`/app/payouts/page.tsx`)**
- Displays all transactions grouped by type
- Shows: Date, Type, Amount, Details
- Filters: All, Staking, Generation, Referral

**Balance Management:**
- `currentBalance`: Available for withdrawal
- `totalEarnings`: Lifetime cumulative earnings
- All transactions automatically update both fields

---

## 5. Admin Features

### Admin Dashboard (`/app/admin/page.tsx`)

**Features:**
1. **User Management** (`/app/admin/users/page.tsx`)
   - View all users
   - Activate/deactivate users
   - View user details (network, earnings, transactions)

2. **Payout Management** (`/app/api/admin/payouts/route.ts`)
   - View all payouts
   - Run payout cycles
   - Process withdrawals

3. **Run Payout Cycle** (`/app/api/admin/run-payout-cycle/route.ts`)
   - Calculates all staking incomes
   - Processes referral income for all levels
   - Credits accounts automatically

### Admin Access
- Role-based: `user.role === "admin"`
- Protected routes check authentication + role
- Full access to user data and transactions

---

## 6. Technical Architecture

### Frontend Stack

**Framework:** Next.js 15.2.4 (App Router)
**Language:** TypeScript
**Styling:**
- Tailwind CSS v4.0
- Shadcn/ui components
- Framer Motion (animations)

**Key Features:**
- Server-side rendering (SSR)
- Client-side navigation
- Protected routes with middleware
- Responsive design

### Backend Stack

**Database:** MongoDB
**Authentication:** JWT tokens (HTTP-only cookies)
**Password Hashing:** bcryptjs
**API Routes:** Next.js API routes

**Database Collections:**
- `users`: User profiles, network structure, balances
- `transactions`: All income/expense records

### Key Libraries

```json
{
  "framer-motion": "^12.23.24",    // Animations
  "mongodb": "^6.18.0",            // Database
  "bcryptjs": "^3.0.2",            // Password hashing
  "jsonwebtoken": "^9.0.2",        // JWT tokens
  "recharts": "^3.1.2",            // Charts/graphs
  "@tabler/icons-react": "^3.35.0" // Icons
}
```

### File Structure

```
/app
  /api           # API routes (authentication, referrals, payouts)
  /dashboard     # Main dashboard page
  /network       # Binary tree visualization
  /payouts       # Transaction history
  /referrals     # Referral management
  /admin         # Admin panel

/components
  /dashboard     # Dashboard components
  /network       # Network visualization
  /payouts       # Payout components
  /referrals     # Referral components
  /ui            # Reusable UI components

/lib
  /mlmLogic.ts   # Core business logic (calculations)
  /auth.ts       # Authentication utilities
  /models/       # TypeScript interfaces
  /mongodb.ts    # Database connection
```

---

## 7. User Journey Example

### Complete Flow

**1. Registration**
```
User visits homepage → Clicks "Get Started"
→ Fills registration form with sponsor code
→ Account created, placed in binary tree
→ Redirected to login
```

**2. Login & Dashboard**
```
User logs in → JWT cookie set
→ Redirected to dashboard
→ Views:
   - Total earnings overview
   - Network statistics
   - Recent transactions
```

**3. Building Network**
```
User gets referral link → Shares with others
→ New users register with sponsor code
→ Automatically placed in left/right leg
→ User's network stats update
```

**4. Staking**
```
User purchases staking package (e.g., $5,000)
→ Staking income calculated: $300/month
→ Transaction recorded
→ Balance updated
→ Monthly income generated automatically
```

**5. Generation Commission**
```
User A refers User B
→ User B purchases package
→ User A gets $3 (Level 1 commission)
→ If User A's sponsor exists, they get $1 (Level 2)
→ Chain continues up 5 levels
```

**6. Referral Income**
```
Monthly payout cycle runs
→ System checks all referrals' staking income
→ User gets:
   - 20% of Level 1 referrals' income
   - 17% of Level 2 referrals' income
   - ... and so on
→ Transactions created and balances updated
```

**7. Withdrawal**
```
User views payout history
→ Sees all transactions
→ Can request withdrawal (if admin feature enabled)
→ Admin processes and updates balance
```

---

## 8. Key Business Rules

### Membership Levels
- **Green**: Entry level (default)
- **Blue**: Upgrade available (not fully implemented)
- **Gold**: Premium level (not fully implemented)

### Booster System
- Activated when user has both left AND right direct referrals
- Provides additional benefits (implementation depends on business requirements)

### Binary Tree Rules
- Maximum 2 direct children (left + right)
- Placement: Left first, then right
- Unlimited depth (practical limit for visualization: 3-5 levels)
- Network size can grow infinitely

### Income Rules
- **Staking**: Minimum $100 to earn ROI
- **Generation**: Only 5 levels deep
- **Referral**: Only 5 levels deep
- All amounts in **USD**
- All calculations rounded to 2 decimal places

---

## 9. Security Features

1. **Password Hashing**: bcryptjs with salt rounds
2. **JWT Tokens**: HTTP-only cookies (prevents XSS)
3. **Role-Based Access**: Admin vs User roles
4. **Input Validation**: All API endpoints validate inputs
5. **Authentication Middleware**: Protects routes automatically

---

## 10. Future Enhancements (Potential)

- Membership level upgrades (Green → Blue → Gold)
- Physical rewards system (mobile, laptop, bike, car)
- Pair matching bonuses
- Advanced analytics and reporting
- Email notifications
- Mobile app
- Automated withdrawal processing
- Tax deduction calculations (TDS)

---

## Summary

**DreamStake** is a comprehensive MLM platform that:
- ✅ Manages user registration and authentication
- ✅ Builds binary network structures
- ✅ Calculates and distributes three income streams
- ✅ Tracks all transactions transparently
- ✅ Provides admin tools for management
- ✅ Offers beautiful, modern UI with animations

The system is designed to be transparent, automated, and scalable for managing a large network of traders and stakers.

