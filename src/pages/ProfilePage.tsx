import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { updateUserProfile } from '@/services/authService'
import { uploadImage, deleteImage, generateProfilePath } from '@/services/storageService'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export function ProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(user?.photoURL || '')
  const [saving, setSaving] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be less than 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      let photoURL = user.photoURL || ''
      if (imageFile) {
        const path = generateProfilePath(user.uid, imageFile.name)
        photoURL = await uploadImage(imageFile, path)
        if (user.photoURL) {
          deleteImage(user.photoURL).catch(() => {})
        }
      }
      await updateUserProfile(user, { displayName, photoURL })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Profile</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
          </div>
          <div>
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-900/50 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100" />
            <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>

        <Input label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
        <Input label="Email" value={user?.email || ''} disabled />

        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
    </motion.div>
  )
}
