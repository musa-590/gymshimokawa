import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Lock, Mail, Zap } from 'lucide-react'
import { useSupabase } from '@/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginForm {
  email: string
  password: string
}

export function LoginPage() {
  const { supabase } = useSupabase()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Bienvenido')
    navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 p-4">
      {/* Fondo animado */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: 'linear-gradient(135deg, #f9b310 0%, #121212 30%, #1a1a1a 60%, #f9b310 100%)',
          backgroundSize: '300% 300%',
          animation: 'gradient-shift 12s ease-in-out infinite',
        }}
      />
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-yellow-400/20 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-yellow-600/10 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute inset-0 bg-zinc-950/60" />

      <Card className="relative w-full max-w-sm animate-slide-up card-hover border-yellow-400/20 bg-zinc-900/80 text-white backdrop-blur-xl shadow-2xl">
        <CardHeader className="items-center text-center">
          <div className="relative mb-3">
            <div className="absolute -inset-3 rounded-full bg-yellow-400/25 blur-xl animate-glow-pulse" />
            <img
              src="/logo.png"
              alt="Logo GYM SHIMOKAWA"
              className="relative h-20 w-20 rounded-full border-2 border-yellow-400 object-cover animate-float"
            />
          </div>
          <CardTitle className="text-xl font-bold">
            <span className="text-gradient-gold">GYM</span> SHIMOKAWA
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Sistema de gestión para tu gimnasio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2 animate-fade-in stagger-1">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@gym.com"
                  className="pl-9 border-zinc-700 bg-zinc-800/60 text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-yellow-400/30"
                  {...register('email', { required: 'El email es obligatorio' })}
                />
              </div>
              {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-2 animate-fade-in stagger-2">
              <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 border-zinc-700 bg-zinc-800/60 text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-yellow-400/30"
                  {...register('password', { required: 'La contraseña es obligatoria' })}
                />
              </div>
              {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-400 text-zinc-950 font-bold hover:bg-yellow-300 btn-press animate-fade-in stagger-3"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
                  Ingresando...
                </>
              ) : (
                <>
                  <Zap /> Ingresar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
