"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Brain, BookOpen, History, LogOut, User, X } from "lucide-react"
import { apiFetch } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const [topic, setTopic] = useState("")
  const [mathMode, setMathMode] = useState(false)
  const [recentTopics, setRecentTopics] = useState<{ topic: string; mode: string; date: string; id?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const data = await apiFetch("/api/history")
      const history = (data.history || []).map((item: any) => ({
        topic: item.topic,
        mode: item.mode,
        date: new Date(item.timestamp).toLocaleDateString(),
        id: item.id,
      }))
      setRecentTopics(history)
    } catch (err: any) {
      console.error(err)
      setRecentTopics([])
    }
  }

  const handleDeleteTopic = (index: number) => {
    setRecentTopics(recentTopics.filter((_, i) => i !== index))
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const handleStartLearning = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ topic: topic.trim(), mode: mathMode ? "math" : "normal" })
      const data = await apiFetch(`/study?${params.toString()}`)
      sessionStorage.setItem("studyData", JSON.stringify(data))
      router.push("/study")
    } catch (err: any) {
      setError(err.message || "Failed to fetch study materials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Smart Study Assistant</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What would you like to learn today?
            </h1>
            <p className="text-muted-foreground">Enter any topic to generate personalized study materials</p>
          </div>

          {/* Input Card */}
          <Card className="border-border shadow-md">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-base font-medium">
                  Topic or Subject
                </Label>
                <Input
                  id="topic"
                  type="text"
                  placeholder="e.g., Photosynthesis, World War II, Calculus..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="math-mode" className="text-base font-medium">
                    Math Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">Enable for mathematical and scientific notation</p>
                </div>
                <Switch id="math-mode" checked={mathMode} onCheckedChange={setMathMode} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" size="lg" disabled={!topic.trim() || loading} onClick={handleStartLearning}>
                {loading ? "Generating..." : "Start Learning"}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Topics */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Recent Topics</CardTitle>
              </div>
              <CardDescription>Continue where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTopics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No recent topics yet. Start learning to see your history here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTopics.map((item, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                    >
                      <Link href="/study" className="flex-1">
                        <div className="font-medium text-foreground">{item.topic}</div>
                        <div className="text-sm text-muted-foreground">{item.date}</div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteTopic(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
