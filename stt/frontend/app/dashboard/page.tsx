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
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [topic, setTopic] = useState("")
  const [mathMode, setMathMode] = useState(false)
  const [recentTopics, setRecentTopics] = useState<{ topic: string; mode: string; date: string; id?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<{ id: string; index: number; topic: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    // Load user data
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error("Failed to parse user data", e)
      }
    }
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setHistoryLoading(true)
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
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleDeleteClick = (id: string, index: number, topic: string) => {
    setTopicToDelete({ id, index, topic })
    setDeleteDialogOpen(true)
  }

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return
    try {
      await apiFetch(`/api/history/${topicToDelete.id}`, { method: "DELETE" })
      setRecentTopics(recentTopics.filter((_, i) => i !== topicToDelete.index))
      toast({
        title: "Topic deleted",
        description: "The topic has been removed from your history.",
      })
      setDeleteDialogOpen(false)
      setTopicToDelete(null)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: err.message || "Could not delete topic. Please try again.",
      })
    }
  }

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true)
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
      const errorMessage = err.message || "Failed to fetch study materials"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Failed to Generate Study Materials",
        description: errorMessage,
        action: (
          <ToastAction
            altText="Retry study generation"
            onClick={() => {
              handleStartLearning()
            }}
          >
            Retry
          </ToastAction>
        ),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && topic.trim()) {
      e.preventDefault()
      handleStartLearning()
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.username ? (
                  <DropdownMenuItem className="flex flex-col items-start gap-1">
                    <span className="text-xs text-muted-foreground">Username</span>
                    <span className="font-medium">{user.username}</span>
                  </DropdownMenuItem>
                ) : null}
                {user?.email ? (
                  <DropdownMenuItem className="flex flex-col items-start gap-1">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <span className="font-medium">{user.email}</span>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={handleLogoutClick}>
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
                  onKeyDown={handleTopicKeyDown}
                  className="h-12 text-base"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="math-mode" className="text-base font-medium">
                    Math Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">Enable for mathematical and scientific notation</p>
                </div>
                <Switch id="math-mode" checked={mathMode} onCheckedChange={setMathMode} disabled={loading} />
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
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : recentTopics.length === 0 ? (
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
                      key={item.id || index}
                      className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                    >
                      <Link href="/study" className="flex-1" onClick={() => {
                        // Load topic data if available
                        const stored = sessionStorage.getItem("studyData")
                        if (!stored) {
                          // Could fetch here or redirect to dashboard
                        }
                      }}>
                        <div className="font-medium text-foreground">{item.topic}</div>
                        <div className="text-sm text-muted-foreground">{item.date}</div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => item.id && handleDeleteClick(item.id, index, item.topic)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{topicToDelete?.topic}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTopic} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your study materials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
