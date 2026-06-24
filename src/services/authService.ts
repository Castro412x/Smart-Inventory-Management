import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export async function signUp(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email,
    displayName,
    photoURL: '',
    createdAt: new Date(),
  })
  return cred.user
}

export async function logIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function logOut() {
  await signOut(auth)
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export async function updateUserProfile(user: User, data: { displayName?: string; photoURL?: string }) {
  const profile: { displayName?: string; photoURL?: string } = {}
  if (data.displayName) profile.displayName = data.displayName
  if (data.photoURL) profile.photoURL = data.photoURL
  if (Object.keys(profile).length) await updateProfile(user, profile)
  await setDoc(doc(db, 'users', user.uid), data, { merge: true })
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}
