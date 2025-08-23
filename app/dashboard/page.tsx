"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EarningsOverview } from "@/components/dashboard/earnings-overview"
import { NetworkStats } from "@/components/dashboard/network-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground">
              Track your earnings, manage your network, and grow your MLM business.
            </p>
          </div>

          {/* Earnings Overview */}
          <EarningsOverview />

          {/* Network Stats */}
          <NetworkStats />

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </main>
    </div>
  )
}
