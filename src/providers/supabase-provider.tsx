import { useEffect, useState, createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import supabase from '@/lib/supabase'

interface SupabaseContextValue {
  supabase: typeof supabase
  user: User | null
  loading: boolean
}

const SupabaseContext = createContext<SupabaseContextValue>({
  supabase,
  user: null,
  loading: true,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <SupabaseContext.Provider value={{ supabase, user: session?.user ?? null, loading }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  return useContext(SupabaseContext)
}
