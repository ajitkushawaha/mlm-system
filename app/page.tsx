"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, TrendingUp, Award, Shield } from "lucide-react"
import Link from "next/link"
import { BinaryTreeDemo } from "@/components/network/binary-tree-demo"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { BackgroundLines } from "@/components/ui/background-lines"
import { AnimatedCard } from "@/components/ui/animated-card"
import { BeamEffect } from "@/components/ui/beam-effect"
import { ShineEffect } from "@/components/ui/shine-effect"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <BackgroundBeams />
      {/* Header */}
      <header className="border-b border-neutral-800/50 bg-transparent backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-gradient-beams">DreamStake</h1>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden min-h-[90vh]">
        <BackgroundLines className="absolute inset-0 h-full w-full bg-neutral-950">
          <BeamEffect />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none"></div>
        </BackgroundLines>
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30" variant="secondary">
              Trading & Staking Platform
            </Badge>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-7xl font-bold mb-6 text-gradient-beams relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            DreamStake Compensation Plan
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            A transparent, balanced growth plan designed to ensure fair earnings for all members through a binary system
            with Left and Right legs. Income is generated through direct joining, matching pairs, and ID upgrades across
            three membership levels.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto relative overflow-hidden group">
                <span className="relative z-10 flex items-center">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-4 h-4" />
                </span>
              </Button>
            </Link>
            <Link href="/compensation-plan">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                View Compensation Plan
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Example Flow */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient-beams mb-2">How It Works (Example)</h2>
            <p className="text-neutral-400 max-w-lg mx-auto my-2 text-sm text-center relative z-10">A simple example showing ROI, generation commission, and residual referral income.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <AnimatedCard delay={0}>
              <ShineEffect>
                <Card className="border-neutral-800 bg-gradient-to-br from-card to-neutral-900/50 hover:border-primary/40 transition-all">
                  <CardHeader>
                    <CardTitle className="text-primary">1) Staking ROI</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>You stake $5,000 → falls in 6% tier → you earn $300 monthly.</p>
                    <p className="text-xs">Rounded to 2 decimals; handled automatically.</p>
                  </CardContent>
                </Card>
              </ShineEffect>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <ShineEffect>
                <Card className="border-neutral-800 bg-gradient-to-br from-card to-neutral-900/50 hover:border-primary/40 transition-all">
                  <CardHeader>
                    <CardTitle className="text-accent">2) Generation Commission</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Your Level-1 joins with a package → you get $3 instantly.</p>
                    <p className="text-xs">Levels 2–5 get $1, $0.80, $0.70, $0.60 respectively.</p>
                  </CardContent>
                </Card>
              </ShineEffect>
            </AnimatedCard>
            <AnimatedCard delay={0.4}>
              <ShineEffect>
                <Card className="border-neutral-800 bg-gradient-to-br from-card to-neutral-900/50 hover:border-primary/40 transition-all">
                  <CardHeader>
                    <CardTitle className="text-primary">3) Residual Referral</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>Your Level-1 earns $500 staking income this month → you get 20% = $100.</p>
                    <p className="text-xs">Level 2 = 17%, Level 3 = 13%, Level 4 = 9%, Level 5 = 5% of staking income.</p>
                  </CardContent>
                </Card>
              </ShineEffect>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Compensation Plan Overview */}
      <section className="py-16 px-4 bg-neutral-950">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient-beams mb-4">Compensation Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transparent staking returns, generation commissions, and residual referral income.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 1. Staking Income */}
            <AnimatedCard delay={0}>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-600">Staking Income</CardTitle>
                  <Badge variant="secondary">Monthly ROI</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Passive income based on staked capital:</p>
                <ul className="space-y-2">
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>$100–$1,000 → 4% monthly</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>$1,000–$4,000 → 5% monthly</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>$4,000–$6,000 → 6% monthly</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>$6,000–$10,000 → 7% monthly</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>Above $10,000 → 8% monthly</li>
                </ul>
                <div className="pt-2">
                  <Link href="/payouts">
                    <Button size="sm" variant="outline">View Payouts</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>

            {/* 2. Generation Income */}
            <AnimatedCard delay={0.2}>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-400"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-600">Generation Income</CardTitle>
                  <Badge>Per Join</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Fixed commission up to 5 generations on package purchase:</p>
                <ul className="space-y-2">
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>1st Gen: $3</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>2nd Gen: $1</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>3rd Gen: $0.80</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>4th Gen: $0.70</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>5th Gen: $0.60</li>
                </ul>
                <div className="pt-2">
                  <Link href="/referrals">
                    <Button size="sm" variant="outline">Manage Referrals</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>

            {/* 3. Staking Referral */}
            <AnimatedCard delay={0.4}>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-accent/5 hover:shadow-lg hover:shadow-accent/20 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-amber-600">Staking Referral</CardTitle>
                  <Badge variant="secondary">Residual</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Earn a percentage of your referrals’ monthly staking income:</p>
                <ul className="space-y-2">
                  <li className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Level 1: 20%</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Level 2: 17%</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Level 3: 13%</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Level 4: 9%</li>
                  <li className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>Level 5: 5%</li>
                </ul>
                <p className="text-xs text-muted-foreground">Example: If a 1st-level referral earns $500 staking income → you get $100 (20%).</p>
                <div className="pt-2">
                  <Link href="/dashboard">
                    <Button size="sm">Go to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient-beams mb-4">Why Choose Our System?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatedCard delay={0}>
              <Card className="text-center border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4 ring-2 ring-primary/30">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 font-sans">Binary Structure</h3>
                  <p className="text-sm text-muted-foreground">Simple left and right leg system for balanced growth</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.15}>
              <Card className="text-center border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4 ring-2 ring-accent/30">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Progressive Earnings</h3>
                  <p className="text-sm text-muted-foreground">Increasing rewards as you advance through levels</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.3}>
              <Card className="text-center border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4 ring-2 ring-primary/30">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Rank Rewards</h3>
                  <p className="text-sm text-muted-foreground">Physical rewards including mobile, laptop, bike, and car</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.45}>
              <Card className="text-center border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4 ring-2 ring-accent/30">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Transparent System</h3>
                  <p className="text-sm text-muted-foreground">Clear rules and fair compensation for all members</p>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Network Tree Preview (Example Only) */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Your Network (Preview)</h2>
            <p className="text-muted-foreground">Example visualization of a binary tree. This is sample data to explain the flow.</p>
          </div>
          <BinaryTreeDemo />
          <div className="text-center mt-6">
            <Link href="/network">
              <Button variant="outline">Open Full Network</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 DreamStake. All rights reserved. Transparent staking returns and progressive earnings through our trading platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
