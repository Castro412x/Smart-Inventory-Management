import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, Timestamp } from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '.env')
const envRaw = readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
for (const line of envRaw.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const categories = [
  'Drinks', 'Noodles', 'Biscuits', 'Toiletries', 'Toothpaste',
  'Books', 'Sweets', 'Bags', 'Sanitary Pads', 'Soaps',
  'Beverages', 'Eggs', 'Air Freshener',
]

async function seed() {
  const snap = await getDocs(collection(db, 'categories'))
  const existing = new Set(snap.docs.map(d => d.data().name.toLowerCase()))
  const toAdd = categories.filter(c => !existing.has(c.toLowerCase()))
  await Promise.all(toAdd.map(name => addDoc(collection(db, 'categories'), { name, createdAt: Timestamp.now() })))
  console.log(`Added ${toAdd.length} categories`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
