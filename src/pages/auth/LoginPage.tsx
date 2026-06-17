import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { logIn } from '@/services/authService'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await logIn(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      const msg = e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : e.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome Back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} placeholder="••••••••" />
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" loading={loading} className="w-full">Sign In</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
