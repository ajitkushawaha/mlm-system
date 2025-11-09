"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { EarningsOverview } from "@/components/dashboard/earnings-overview"
import { NetworkStats } from "@/components/dashboard/network-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

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
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex relative">
      <BackgroundBeams />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 w-full lg:w-auto">
        <DashboardHeader />

        <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                  Track your earnings, manage your connection, and grow your trading business.
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

            {/* Earnings Overview */}
            <EarningsOverview />

            {/* Connection Stats */}
            <NetworkStats />

            {/* Recent Activity */}
            <RecentActivity />

            {/* Contact Support Section - Only for regular and franchise users */}
            {user?.role !== "admin" && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Need Help?</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Contact our support team via Telegram for assistance
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border-2 border-primary/20 bg-white p-1 flex-shrink-0">
                    <img 
                      src="/contacttelegram.jpeg" 
                      alt="Telegram Contact QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Scan QR Code</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Contact via Telegram</p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
