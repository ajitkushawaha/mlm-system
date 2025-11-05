"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ReferralDashboard } from "@/components/referrals/referral-dashboard"
import { ReferralTree } from "@/components/referrals/referral-tree"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ReferralsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading referrals...</p>
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
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />

        <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                Referral Management
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                Manage your referral network, track earnings, and grow your trading business.
              </p>
            </div>

          {/* Referral Dashboard */}
          <ReferralDashboard />

          {/* Referral Tree */}
          <ReferralTree />
        </div>
      </main>
      </div>
    </div>
  )
}
