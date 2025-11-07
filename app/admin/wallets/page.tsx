"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Search, CheckCircle, XCircle, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminWalletsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<Array<{
    _id: string
    name: string
    email: string
    normalWallet: number
    franchiseWallet: number
    shakingWallet: number
    currentBalance: number
  }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({
    normalWallet: "",
    franchiseWallet: "",
    shakingWallet: "",
  })

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/wallets")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        setError("Failed to fetch users")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (userId: string, userData: {
    normalWallet: number
    franchiseWallet: number
    shakingWallet: number
    currentBalance: number
  }) => {
    setEditingUser(userId)
    setEditValues({
      normalWallet: (userData.normalWallet ?? userData.currentBalance ?? 0).toString(),
      franchiseWallet: (userData.franchiseWallet ?? 0).toString(),
      shakingWallet: (userData.shakingWallet ?? 0).toString(),
    })
  }

  const handleSave = async (userId: string) => {
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/wallets/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          normalWallet: parseFloat(editValues.normalWallet) || 0,
          franchiseWallet: parseFloat(editValues.franchiseWallet) || 0,
          shakingWallet: parseFloat(editValues.shakingWallet) || 0,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Wallet balances updated successfully")
        setEditingUser(null)
        fetchUsers()
      } else {
        setError(data.error || "Failed to update wallets")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    }
  }

  const handleCancel = () => {
    setEditingUser(null)
    setEditValues({ normalWallet: "", franchiseWallet: "", shakingWallet: "" })
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-beams mb-2 font-sans">
                Wallet Management
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 max-w-lg">
                View and manage all user wallet balances
              </p>
            </div>

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

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader>
              <CardTitle>User Wallets</CardTitle>
              <CardDescription>Search and manage wallet balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">User</TableHead>
                          <TableHead className="text-xs sm:text-sm">Email</TableHead>
                          <TableHead className="text-xs sm:text-sm">Main Wallet</TableHead>
                          <TableHead className="text-xs sm:text-sm">Franchise Wallet</TableHead>
                          <TableHead className="text-xs sm:text-sm">Staking Wallet</TableHead>
                          <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground text-xs sm:text-sm">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((userData) => (
                            <TableRow key={userData._id}>
                              <TableCell className="font-medium text-xs sm:text-sm">{userData.name}</TableCell>
                              <TableCell className="text-xs sm:text-sm">{userData.email}</TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {editingUser === userData._id ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editValues.normalWallet}
                                    onChange={(e) =>
                                      setEditValues({ ...editValues, normalWallet: e.target.value })
                                    }
                                    className="w-24 text-xs sm:text-sm"
                                  />
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                    <span>${(userData.normalWallet ?? userData.currentBalance ?? 0).toFixed(2)}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {editingUser === userData._id ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editValues.franchiseWallet}
                                    onChange={(e) =>
                                      setEditValues({ ...editValues, franchiseWallet: e.target.value })
                                    }
                                    className="w-24 text-xs sm:text-sm"
                                  />
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                                    <span>${(userData.franchiseWallet ?? 0).toFixed(2)}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {editingUser === userData._id ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editValues.shakingWallet}
                                    onChange={(e) =>
                                      setEditValues({ ...editValues, shakingWallet: e.target.value })
                                    }
                                    className="w-24 text-xs sm:text-sm"
                                  />
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                                    <span>${(userData.shakingWallet ?? 0).toFixed(2)}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {editingUser === userData._id ? (
                                  <div className="flex gap-2">
                                    <Button size="sm" className="text-[10px] sm:text-xs" onClick={() => handleSave(userData._id)}>
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-[10px] sm:text-xs" onClick={handleCancel}>
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="outline" className="text-[10px] sm:text-xs" onClick={() => handleEdit(userData._id, userData)}>
                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((userData) => (
                        <Card key={userData._id} className="border-neutral-800 bg-transparent">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-muted-foreground font-medium">User:</span>
                              <div className="text-right">
                                <div className="text-sm font-medium">{userData.name}</div>
                                <div className="text-xs text-muted-foreground">{userData.email}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-muted-foreground font-medium">Main Wallet:</span>
                              {editingUser === userData._id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValues.normalWallet}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, normalWallet: e.target.value })
                                  }
                                  className="w-32 text-sm"
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Wallet className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-semibold">
                                    ${(userData.normalWallet ?? userData.currentBalance ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-muted-foreground font-medium">Franchise Wallet:</span>
                              {editingUser === userData._id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValues.franchiseWallet}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, franchiseWallet: e.target.value })
                                  }
                                  className="w-32 text-sm"
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Wallet className="w-4 h-4 text-accent" />
                                  <span className="text-sm font-semibold">
                                    ${(userData.franchiseWallet ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-muted-foreground font-medium">Staking Wallet:</span>
                              {editingUser === userData._id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editValues.shakingWallet}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, shakingWallet: e.target.value })
                                  }
                                  className="w-32 text-sm"
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Wallet className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm font-semibold">
                                    ${(userData.shakingWallet ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2 pt-2">
                              {editingUser === userData._id ? (
                                <>
                                  <Button size="sm" className="w-full" onClick={() => handleSave(userData._id)}>
                                    Save Changes
                                  </Button>
                                  <Button size="sm" variant="outline" className="w-full" onClick={handleCancel}>
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" className="w-full" onClick={() => handleEdit(userData._id, userData)}>
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit Balances
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
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

