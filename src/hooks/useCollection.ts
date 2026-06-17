import { useState, useEffect } from 'react'
import { QueryConstraint, onSnapshot } from 'firebase/firestore'
import { collection, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useCollection<T>(
  path: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, path), ...constraints)
    const unsub = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T)))
      setLoading(false)
    }, () => {
      setLoading(false)
    })
    return unsub
  }, [path])

  return { data, loading }
}
