import { useEffect, useState, createContext, useContext } from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import supabase from '@/lib/supabase'

interface SupabaseContextValue {
  supabase: typeof supabase
  user: User | null
  loading: boolean
  authEvent: AuthChangeEvent | null
}

const SupabaseContext = createContext<SupabaseContextValue>({
  supabase,
  user: null,
  loading: true,
  authEvent: null,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setAuthEvent(event)
      setSession(newSession)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <SupabaseContext.Provider value={{ supabase, user: session?.user ?? null, loading, authEvent }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  return useContext(SupabaseContext)
}
