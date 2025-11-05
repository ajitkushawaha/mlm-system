"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-foreground">Profile</h1>

        <Card className="max-w-xl border-neutral-800 bg-transparent">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <CardTitle className="text-base sm:text-lg">Account</CardTitle>
            </div>
            {user?.membershipLevel && (
              <Badge className="text-xs sm:text-sm">{user.membershipLevel.toUpperCase()} ID</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground break-words">{user?.name || "—"}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground break-all">{user?.email || "—"}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium text-foreground">{user?.role || "user"}</span>
            </div>
            <div className="pt-2.5 sm:pt-3">
              <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto text-xs sm:text-sm">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


