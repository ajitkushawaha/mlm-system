"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  phone: string
  role: "user" | "admin" | "franchise"
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  boosterActive: boolean
  boosterDeadline?: string
  totalEarnings: number
  currentBalance: number
  normalWallet?: number
  franchiseWallet?: number
  shakingWallet?: number
  leftDirects: number
  rightDirects: number
  greenPayouts: number
  blueStep: number
  franchiseStatus?: "pending" | "approved" | "rejected"
  savedBankDetails?: {
    bankName?: string
    accountNumber?: string
    accountHolderName?: string
    ifscCode?: string
    branchName?: string
    savedAt?: string
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        await checkAuth()
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      // Handle error silently
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
