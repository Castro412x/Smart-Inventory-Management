import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPassword } from '@/services/authService'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await resetPassword(data.email)
      setSent(true)
      toast.success('Password reset email sent!')
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="card-gradient rounded-2xl border border-gray-200/70 dark:border-gray-700/50 shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-gray-800 dark:text-gray-100">Reset Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-body">
            {sent ? 'Check your email for the reset link' : 'Enter your email to receive a reset link'}
          </p>
        </div>
        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
            <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
          </form>
        ) : (
          <div className="text-center">
            <Link to="/login" className="text-accent-600 dark:text-accent-400 hover:text-accent-700 font-semibold transition-colors">Back to Sign In</Link>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 font-body">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
