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
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Profile</h1>

        <Card className="max-w-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Account</CardTitle>
            </div>
            {user?.membershipLevel && (
              <Badge>{user.membershipLevel.toUpperCase()} ID</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{user?.name || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{user?.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium text-foreground">{user?.role || "user"}</span>
            </div>
            <div className="pt-3">
              <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


