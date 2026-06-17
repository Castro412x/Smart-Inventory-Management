import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600">404</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Page not found</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
