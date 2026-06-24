import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAEsXvH4lEL4nhK1oJ4rQ_teByftjhO14I',
  authDomain: 'smart-inventory-system-4c4ec.firebaseapp.com',
  projectId: 'smart-inventory-system-4c4ec',
  storageBucket: 'smart-inventory-system-4c4ec.firebasestorage.app',
  messagingSenderId: '1053001889519',
  appId: '1:1053001889519:web:727469c1f2b06fb80f8d1a',
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
