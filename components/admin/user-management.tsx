"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Search, Users, TrendingUp, UserCheck, UserX } from "lucide-react"

export interface User {
  _id: string
  name: string
  email: string
  phone: string
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  joinDate: string
  totalEarnings: number
  leftDirects: number
  rightDirects: number
  boosterActive: boolean
  role?: "admin" | "user"
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  greenUsers: number
  blueUsers: number
  goldUsers: number
  totalEarnings: number
}

export function UserManagement() {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Fetch all users for client-side filtering
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAllUsers(data.users || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Client-side filtering and pagination
  useEffect(() => {
    let filtered = [...allUsers]

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.phone?.toLowerCase().includes(searchLower)
      )
    }

    // Apply level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter((u) => u.membershipLevel === levelFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => {
        if (statusFilter === "active") return u.isActive
        if (statusFilter === "inactive") return !u.isActive
        return true
      })
    }

    // Calculate pagination
    const itemsPerPage = 20
    const totalFiltered = filtered.length
    const calculatedTotalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage))
    setTotalPages(calculatedTotalPages)

    // Apply pagination
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = filtered.slice(startIndex, endIndex)

    setUsers(paginatedUsers)
  }, [allUsers, search, levelFilter, statusFilter, page])

  const updateUser = async (userId: string, action: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, data }),
      })

      if (response.ok) {
        // Refresh the list to get updated data
        fetchUsers()
      }
    } catch (error) {
      console.error("Failed to update user:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(amount)
  }

  const getMembershipColor = (level: string) => {
    switch (level) {
      case "gold":
        return "bg-yellow-500 text-white"
      case "blue":
        return "bg-blue-500 text-white"
      default:
        return "bg-green-500 text-white"
    }
  }

  if (loading) {
    return (
      <Card className="border-neutral-800 bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">All users combined</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Green IDs</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.greenUsers}</div>
              <p className="text-xs text-muted-foreground">Entry level members</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blue + Gold IDs</CardTitle>
              <UserX className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.blueUsers + stats.goldUsers}</div>
              <p className="text-xs text-muted-foreground">Advanced members</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage all users in the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="green">Green ID</SelectItem>
                <SelectItem value="blue">Blue ID</SelectItem>
                <SelectItem value="gold">Gold ID</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">User</TableHead>
                      <TableHead className="text-xs sm:text-sm">Level</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Earnings</TableHead>
                      <TableHead className="text-xs sm:text-sm">Network</TableHead>
                      <TableHead className="text-xs sm:text-sm">Joined</TableHead>
                      <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="text-xs sm:text-sm">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">{user.email}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">{user.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <Badge className={getMembershipColor(user.membershipLevel)}>
                            {user.membershipLevel.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.isActive ? "default" : "destructive"} className="text-[10px] sm:text-xs">
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {!user.boosterActive && (
                              <Badge variant="outline" className="text-orange-600 text-[10px] sm:text-xs">
                                Booster Off
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">{formatCurrency(user.totalEarnings)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          L: {user.leftDirects} | R: {user.rightDirects}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[10px] sm:text-xs"
                              onClick={() => updateUser(user._id, "toggle-status", { isActive: !user.isActive })}
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            {!user.boosterActive && (
                              <Button size="sm" variant="outline" className="text-[10px] sm:text-xs" onClick={() => updateUser(user._id, "reset-booster", {})}>
                                Reset Booster
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <Card key={user._id} className="border-neutral-800 bg-transparent">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-muted-foreground font-medium">User:</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-muted-foreground font-medium">Level:</span>
                        <Badge className={getMembershipColor(user.membershipLevel)}>
                          {user.membershipLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-muted-foreground font-medium">Status:</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.isActive ? "default" : "destructive"} className="text-xs">
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {!user.boosterActive && (
                            <Badge variant="outline" className="text-orange-600 text-xs">
                              Booster Off
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-muted-foreground font-medium">Earnings:</span>
                        <span className="text-sm font-semibold">{formatCurrency(user.totalEarnings)}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-muted-foreground font-medium">Network:</span>
                        <span className="text-sm">
                          L: {user.leftDirects} | R: {user.rightDirects}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-muted-foreground font-medium">Joined:</span>
                        <span className="text-sm">{new Date(user.joinDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col space-y-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => updateUser(user._id, "toggle-status", { isActive: !user.isActive })}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        {!user.boosterActive && (
                          <Button size="sm" variant="outline" className="w-full" onClick={() => updateUser(user._id, "reset-booster", {})}>
                            Reset Booster
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
