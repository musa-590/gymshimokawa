import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/providers/supabase-provider'

export function useUserRole() {
  const { supabase, user } = useSupabase()

  return useQuery({
    queryKey: ['user-role', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, rol_id, roles(nombre)')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return (data as any).roles.nombre as string
    },
    staleTime: 5 * 60 * 1000,
  })
}
