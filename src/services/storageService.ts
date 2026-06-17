import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytesResumable(storageRef, file)
  return getDownloadURL(snapshot.ref)
}

export async function deleteImage(path: string) {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

export function generateImagePath(uid: string, fileName: string): string {
  const ext = fileName.split('.').pop()
  return `products/${uid}_${Date.now()}.${ext}`
}

export function generateProfilePath(uid: string, fileName: string): string {
  const ext = fileName.split('.').pop()
  return `profiles/${uid}_${Date.now()}.${ext}`
}
