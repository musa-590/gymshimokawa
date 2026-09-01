import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { LogIn, LogOut, Search } from 'lucide-react'
import {
  buscarPersona, registrarEntrada, registrarSalida, listarAsistencias,
} from '@/lib/api/asistencia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudTable, type Column } from '@/components/crud-table'
import { Badge } from '@/components/ui/badge'
import * as Tabs from '@radix-ui/react-tabs'

type Tipo = 'clientes' | 'personal'

const hoy = new Date().toISOString().split('T')[0]

export function AsistenciaPage() {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState<Tipo>('clientes')
  const [dni, setDni] = useState('')

  const { data: asistencias, isLoading } = useQuery({
    queryKey: ['asistencias', tipo, hoy],
    queryFn: () => listarAsistencias(hoy, hoy, tipo),
  })

  const registrarMutation = useMutation({
    mutationFn: async () => {
      const persona = await buscarPersona(tipo, dni.trim())
      if (!persona) throw new Error('DNI no encontrado')
      return registrarEntrada(tipo, persona.id, persona.dni)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['asistencias'] })
      if (res.tipo === 'ya_registrado') toast('Ya tiene entrada registrada', { icon: 'ℹ️' })
      else toast.success('Entrada registrada')
      setDni('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const salidaMutation = useMutation({
    mutationFn: (id: string) => registrarSalida(tipo, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asistencias'] })
      toast.success('Salida registrada')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const label = tipo === 'clientes' ? 'cliente' : 'personal'

  const columns: Column<any>[] = [
    { key: 'dni', label: 'DNI', render: (a) => <span className="font-medium">{a.dni}</span> },
    {
      key: 'nombre',
      label: label === 'cliente' ? 'Cliente' : 'Personal',
      render: (a) => a.cliente?.nombre ?? a.persona?.nombre ?? '—',
    },
    {
      key: 'entrada',
      label: 'Entrada',
      render: (a) => (
        <span className="capitalize">
          {new Date(a.hora_entrada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'salida',
      label: 'Salida',
      render: (a) => a.hora_salida
        ? new Date(a.hora_salida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        : '—',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (a) => a.hora_salida
        ? <Badge variant="secondary">Salida</Badge>
        : <Badge variant="success">Dentro</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>
        <p className="text-sm text-muted-foreground">Control de entrada y salida</p>
      </div>

      <Tabs.Root value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
        <Tabs.List className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <Tabs.Trigger
            value="clientes"
            className="inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          >
            Clientes
          </Tabs.Trigger>
          <Tabs.Trigger
            value="personal"
            className="inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          >
            Personal
          </Tabs.Trigger>
        </Tabs.List>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`DNI del ${label}...`}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
              onKeyDown={(e) => e.key === 'Enter' && dni.length === 8 && registrarMutation.mutate()}
              className="pl-9 w-56"
            />
          </div>
          <Button onClick={() => registrarMutation.mutate()} disabled={dni.length !== 8 || registrarMutation.isPending}>
            <LogIn /> Registrar entrada
          </Button>
        </div>
      </Tabs.Root>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asistencias de hoy</CardTitle>
          <CardDescription>{asistencias?.length ?? 0} registros</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <CrudTable
              columns={columns}
              rows={asistencias ?? []}
              getKey={(a) => a.id}
              emptyText="Sin asistencias hoy"
              renderActions={(a) => !a.hora_salida && (
                <Button
                  variant="outline" size="sm"
                  onClick={() => salidaMutation.mutate(a.id)}
                  disabled={salidaMutation.isPending}
                >
                  <LogOut /> Registrar salida
                </Button>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
