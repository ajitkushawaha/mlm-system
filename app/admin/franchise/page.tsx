"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { FranchiseApprovals } from "@/components/admin/franchise-approvals"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function FranchiseApprovalsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex relative">
      <BackgroundBeams />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <FranchiseApprovals />
        </main>
      </div>
    </div>
  )
}

