import { useMemo } from 'react'
import toast from 'react-hot-toast'

export function useToast() {
  return useMemo(() => ({
    success: (msg: string) => toast.success(msg, { duration: 3000 }),
    error: (msg: string) => toast.error(msg, { duration: 5000 }),
    info: (msg: string) => toast(msg, { duration: 3000 }),
    warning: (msg: string) => toast(msg, { icon: '⚠️', duration: 4000 }),
  }), [])
}
