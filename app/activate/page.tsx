"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserCheck, Search, Loader2, CheckCircle, XCircle, Wallet } from "lucide-react"

interface InactiveUser {
  _id: string
  userId?: string
  name: string
  email: string
  phone: string
  joinDate: Date
  sponsorId?: string
}

export default function ActivatePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [searching, setSearching] = useState(false)
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([])
  const [selectedUser, setSelectedUser] = useState<InactiveUser | null>(null)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (!authLoading && user && user.role !== "franchise" && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  const searchUsers = async () => {
    setError("")
    setSuccess("")
    setSearching(true)

    try {
      // If search term is empty, show all inactive users
      const queryParam = searchTerm.trim() ? `?q=${encodeURIComponent(searchTerm.trim())}` : ""
      const response = await fetch(`/api/franchise/activate/search${queryParam}`)
      const data = await response.json()

      if (response.ok) {
        setInactiveUsers(data.users || [])
        if (data.users && data.users.length === 0) {
          setError(
            searchTerm.trim()
              ? "No inactive users found matching your search. Try searching by email, phone, or User ID (DS123456)."
              : "No inactive users found in the system.",
          )
        }
      } else {
        setError(data.error || "Search failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSearching(false)
    }
  }

  const handleActivate = async (userToActivate: InactiveUser) => {
    setError("")
    setSuccess("")
    setActivating(true)

    try {
      const response = await fetch("/api/franchise/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToActivate._id }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`User ${userToActivate.name} activated successfully! $10 deducted from your Franchise Wallet.`)
        setSelectedUser(userToActivate)
        setInactiveUsers([])
        setSearchTerm("")
        // Refresh user data to update franchiseWallet balance
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || "Activation failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setActivating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || (user.role !== "franchise" && user.role !== "admin")) {
    return null
  }

  const franchiseWallet = user.franchiseWallet ?? 0
  const canActivate = franchiseWallet >= 10

  return (
    <div className="min-h-screen bg-neutral-950 flex relative">
      <BackgroundBeams />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />

        <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                Activate Member
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                Activate inactive users by deducting $10 from your Franchise Wallet
              </p>
            </div>

            {/* Franchise Wallet Balance */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  Franchise Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-2xl sm:text-3xl font-bold text-accent">${franchiseWallet.toFixed(2)}</div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                  {canActivate
                    ? `You can activate ${Math.floor(franchiseWallet / 10)} user(s)`
                    : "Insufficient balance. Minimum $10 required to activate a user."}
                </p>
              </CardContent>
            </Card>

            {/* Search Form */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Search Inactive Users
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Search by email, phone, or user ID</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter email, phone, or user ID (leave empty to show all)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                      className="flex-1 text-xs sm:text-sm"
                    />
                    <Button onClick={searchUsers} disabled={searching} size="sm" className="text-xs sm:text-sm">
                      {searching ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>

                  {!canActivate && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Insufficient Franchise Wallet balance. You need at least $10 to activate a user.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {inactiveUsers.length > 0 && (
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-base sm:text-lg">Inactive Users Found</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{inactiveUsers.length} inactive user(s) found</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="space-y-3 sm:space-y-4">
                    {inactiveUsers.map((inactiveUser) => (
                      <div
                        key={inactiveUser._id}
                        className="border border-neutral-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm sm:text-base">{inactiveUser.name}</h3>
                          {inactiveUser.userId && (
                            <p className="text-xs sm:text-sm text-yellow-400 font-semibold">User ID: {inactiveUser.userId}</p>
                          )}
                          <p className="text-xs sm:text-sm text-muted-foreground">{inactiveUser.email}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{inactiveUser.phone}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            Joined: {new Date(inactiveUser.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleActivate(inactiveUser)}
                          disabled={activating || !canActivate}
                          size="sm"
                          className="text-xs sm:text-sm w-full sm:w-auto"
                        >
                          {activating && selectedUser?._id === inactiveUser._id ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              <span className="hidden sm:inline">Activating...</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Activate </span>($10)
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

