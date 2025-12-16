"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Eye, EyeOff, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    username?: string
    email?: string
    password?: string
    confirm?: string
  }>({})

  const validateUsername = (value: string) => {
    if (!value) return "Username is required"
    if (value.length < 3) return "Username must be at least 3 characters"
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores"
    return ""
  }

  const validateEmail = (value: string) => {
    if (!value) return "Email is required"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return "Please enter a valid email"
    return ""
  }

  const validatePassword = (value: string) => {
    if (!value) return "Password is required"
    if (value.length < 6) return "Password must be at least 6 characters"
    return ""
  }

  const validateConfirm = (value: string, pwd: string) => {
    if (!value) return "Please confirm your password"
    if (value !== pwd) return "Passwords do not match"
    return ""
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    if (errors.username) {
      setErrors({ ...errors, username: validateUsername(value) || undefined })
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (errors.email) {
      setErrors({ ...errors, email: validateEmail(value) || undefined })
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (errors.password) {
      setErrors({ ...errors, password: validatePassword(value) || undefined })
    }
    if (errors.confirm && confirm) {
      setErrors({ ...errors, confirm: validateConfirm(confirm, value) || undefined })
    }
  }

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirm(value)
    if (errors.confirm) {
      setErrors({ ...errors, confirm: validateConfirm(value, password) || undefined })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const usernameError = validateUsername(username)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const confirmError = validateConfirm(confirm, password)

    if (usernameError || emailError || passwordError || confirmError) {
      setErrors({
        username: usernameError || undefined,
        email: emailError || undefined,
        password: passwordError || undefined,
        confirm: confirmError || undefined,
      })
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const data = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      router.push("/dashboard")
    } catch (err: any) {
      const errorMessage = err.message || "Signup failed. Please try again."
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
        action: (
          <ToastAction
            altText="Retry signup"
            onClick={() => {
              handleSubmit(e)
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

  const isValid =
    !errors.username &&
    !errors.email &&
    !errors.password &&
    !errors.confirm &&
    username &&
    email &&
    password &&
    confirm

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating your account...</p>
          </div>
        </div>
      )}
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Smart Study Assistant</span>
          </Link>

          <form onSubmit={handleSubmit}>
            <Card className="border-border shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                <CardDescription className="leading-relaxed">Start your learning journey today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    className={`h-11 ${errors.username ? "border-destructive" : ""}`}
                    value={username}
                    onChange={handleUsernameChange}
                    onBlur={() => setErrors({ ...errors, username: validateUsername(username) || undefined })}
                    required
                  />
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className={`h-11 ${errors.email ? "border-destructive" : ""}`}
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => setErrors({ ...errors, email: validateEmail(email) || undefined })}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className={`h-11 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => setErrors({ ...errors, password: validatePassword(password) || undefined })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm your password"
                      className={`h-11 pr-10 ${errors.confirm ? "border-destructive" : ""}`}
                      value={confirm}
                      onChange={handleConfirmChange}
                      onBlur={() => setErrors({ ...errors, confirm: validateConfirm(confirm, password) || undefined })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm && <p className="text-sm text-destructive">{errors.confirm}</p>}
                </div>
                <Button className="w-full" size="lg" type="submit" disabled={loading || !isValid}>
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </>
  )
}
