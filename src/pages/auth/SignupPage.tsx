import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUp } from '@/services/authService'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function SignupPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await signUp(data.email, data.password, data.displayName)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      if (e.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists')
      } else {
        toast.error(e.message || 'Signup failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="card-gradient rounded-2xl border border-gray-200/70 dark:border-gray-700/50 shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-gray-800 dark:text-gray-100">Create Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-body">Get started with SmartStock</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" {...register('displayName')} error={errors.displayName?.message} placeholder="John Doe" />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} placeholder="••••••••" />
          <Input label="Confirm Password" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="••••••••" />
          <Button type="submit" loading={loading} className="w-full">Create Account</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 font-body">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-600 dark:text-accent-400 hover:text-accent-700 font-semibold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
