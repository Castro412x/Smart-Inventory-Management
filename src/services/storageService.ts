const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`

export async function uploadImage(file: File, publicId: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('public_id', publicId)

  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to upload image')
  }
  const data = await res.json()
  return data.secure_url as string
}

export async function deleteImage(_path: string) {}

export function generateImagePath(uid: string, fileName: string): string {
  const ext = fileName.split('.').pop()
  return `products/${uid}_${Date.now()}.${ext}`
}

export function generateProfilePath(uid: string, fileName: string): string {
  const ext = fileName.split('.').pop()
  return `profiles/${uid}_${Date.now()}.${ext}`
}
