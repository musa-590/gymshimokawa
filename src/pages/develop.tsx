import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Switch } from '@radix-ui/react-switch'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { obtenerAlertaPago, guardarAlertaPago } from '@/lib/api/alerta-pago'
import { useUserRole } from '@/hooks/use-user-role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FormState {
  activado: boolean
  fecha_vencimiento: string
  dias_aviso: string
}

export function DevelopPage() {
  const { data: rol, isLoading: rolCargando } = useUserRole()
  const { data: alerta, isLoading } = useQuery({
    queryKey: ['alerta-pago'],
    queryFn: obtenerAlertaPago,
  })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ activado: false, fecha_vencimiento: '', dias_aviso: '7' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!alerta) return
    setForm({
      activado: alerta.activado,
      fecha_vencimiento: alerta.fecha_vencimiento ?? '',
      dias_aviso: String(alerta.dias_aviso),
    })
  }, [alerta])

  if (rolCargando || isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
      </div>
    )
  }
  if (rol !== 'admin') return <Navigate to="/dashboard" replace />

  const onSave = async () => {
    setSaving(true)
    try {
      await guardarAlertaPago({
        activado: form.activado,
        fecha_vencimiento: form.fecha_vencimiento || null,
        dias_aviso: Math.max(1, Math.floor(Number(form.dias_aviso) || 0)),
      })
      toast.success('Configuración de alerta guardada')
      queryClient.invalidateQueries({ queryKey: ['alerta-pago'] })
    } catch {
      toast.error('No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 p-4 flex items-center justify-center animate-fade-in">
      <Card className="w-full max-w-md card-hover animate-slide-up">
        <CardHeader>
          <CardTitle className="text-lg">Alerta de pago de la plataforma</CardTitle>
          <CardDescription>
            Ruta oculta de desarrollo. Configura el recordatorio que verán los usuarios del panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="text-sm font-semibold">Activar alerta</p>
              <p className="text-xs text-muted-foreground">El aviso solo se muestra si está activado y dentro del rango de días</p>
            </div>
            <Switch
              checked={form.activado}
              onCheckedChange={(v) => setForm((f) => ({ ...f, activado: v }))}
              className="inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input transition-colors data-[state=checked]:bg-yellow-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
            </Switch>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha de vencimiento</Label>
            <Input
              id="fecha"
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => setForm((f) => ({ ...f, fecha_vencimiento: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias">Avisar cuando falten (días)</Label>
            <Input
              id="dias"
              type="number"
              min={1}
              value={form.dias_aviso}
              onChange={(e) => setForm((f) => ({ ...f, dias_aviso: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft /> Regresar al dashboard
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-yellow-400 text-zinc-950 font-bold hover:bg-yellow-300"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
              ) : (
                <Save />
              )}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}