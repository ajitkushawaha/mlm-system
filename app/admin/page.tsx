"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Receipt, Play, UserCheck, Wallet, TrendingUp, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function AdminDashboard() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [runningCycle, setRunningCycle] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  const runPayoutCycle = async () => {
    setRunningCycle(true)
    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-cycle" }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Payout cycle completed! Processed: ${data.processed} users, Total: $${data.totalAmount}`)
      }
    } catch (error) {
      console.error("Failed to run payout cycle:", error)
    } finally {
      setRunningCycle(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshUser()
      // Reload the page to refresh all components
      window.location.reload()
    } catch (error) {
      console.error("Failed to refresh:", error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex relative">
      <BackgroundBeams />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />

        <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                  Manage users, payouts, franchise applications, and system operations.
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">User Management</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Manage all system users</p>
                  <Link href="/admin/users">
                    <Button size="sm" className="w-full text-xs sm:text-sm">
                      Manage Users
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Payout Management</CardTitle>
                  <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">View and manage payouts</p>
                  <Link href="/admin/payouts">
                    <Button size="sm" className="w-full text-xs sm:text-sm">
                      View Payouts
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Run Payout Cycle</CardTitle>
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Process all eligible payouts</p>
                  <Button size="sm" className="w-full text-xs sm:text-sm" onClick={runPayoutCycle} disabled={runningCycle}>
                    {runningCycle ? "Running..." : "Run Cycle"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Franchise Approvals</CardTitle>
                  <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Review franchise applications</p>
                  <Link href="/admin/franchise">
                    <Button size="sm" className="w-full text-xs sm:text-sm">
                      Review Applications
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Wallet Management</CardTitle>
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Manage user wallets</p>
                  <Link href="/admin/wallets">
                    <Button size="sm" className="w-full text-xs sm:text-sm">
                      Manage Wallets
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Investment Management</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Manage Staking Wallet investments</p>
                  <Link href="/admin/investments">
                    <Button size="sm" className="w-full text-xs sm:text-sm">
                      Manage Investments
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Withdrawal Requests</CardTitle>
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Review and process user withdrawals</p>
                  <Link href="/admin/withdrawals">
                    <Button size="sm" className="w-full text-xs sm:text-sm">
                      Review Requests
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="text-base sm:text-lg">System Status</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Current system health and operations</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 sm:p-4 border border-neutral-800 rounded-lg">
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Database</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">MongoDB connection</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-[10px] sm:text-xs">Online</Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 sm:p-4 border border-neutral-800 rounded-lg">
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Payout System</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Calculation engine</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-[10px] sm:text-xs">Active</Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 sm:p-4 border border-neutral-800 rounded-lg">
                    <div>
                      <p className="text-xs sm:text-sm font-medium">User Registration</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">New member signup</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-[10px] sm:text-xs">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="text-base sm:text-lg">Recent Admin Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest administrative actions and system events</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-2.5 sm:p-3 border border-neutral-800 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5 sm:mt-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium">System started successfully</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">All services are running normally</p>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">Just now</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-2.5 sm:p-3 border border-neutral-800 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 sm:mt-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium">Admin panel accessed</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Administrator {user.name} logged in</p>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">2 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
