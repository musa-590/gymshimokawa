import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Download, FileSpreadsheet, Users, ShoppingCart, DollarSign,
  ClipboardCheck, Shield, ChevronDown, ChevronRight, Check,
} from 'lucide-react'
import { tables, getTableGroups, exportSelectedTables, exportSingleTable, type TableInfo } from '@/lib/api/exportar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const groupIcons: Record<string, typeof Users> = {
  Clientes: Users,
  Ventas: ShoppingCart,
  Finanzas: DollarSign,
  Operaciones: ClipboardCheck,
  Sistema: Shield,
}

const groupColors: Record<string, string> = {
  Clientes: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Ventas: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Finanzas: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Operaciones: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  Sistema: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export function ExportarPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set(tables.map(t => t.id)))
  const [expanded, setExpanded] = useState<Set<string>>(new Set(Object.keys(getTableGroups())))
  const [exportando, setExportando] = useState(false)

  const { data: counts } = useQuery({
    queryKey: ['export-counts'],
    queryFn: async () => {
      const result: Record<string, number> = {}
      for (const t of tables) {
        try {
          const data = await t.query()
          result[t.id] = data.length
        } catch {
          result[t.id] = 0
        }
      }
      return result
    },
  })

  const totalRegistros = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0
  const groups = getTableGroups()

  const toggleGroup = (group: string) => {
    const groupTables = groups[group]
    const allSelected = groupTables.every(t => selected.has(t.id))
    setSelected(prev => {
      const next = new Set(prev)
      groupTables.forEach(t => allSelected ? next.delete(t.id) : next.add(t.id))
      return next
    })
  }

  const toggleTable = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleExpand = (group: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group); else next.add(group)
      return next
    })
  }

  const handleExportAll = async () => {
    if (selected.size === 0) return toast.error('Seleccioná al menos una tabla')
    setExportando(true)
    try {
      await exportSelectedTables(Array.from(selected))
      toast.success(`Exportado: ${selected.size} tablas`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setExportando(false)
    }
  }

  const handleExportGroup = async (group: string) => {
    const groupIds = groups[group].map(t => t.id)
    setExportando(true)
    try {
      await exportSelectedTables(groupIds)
      toast.success(`Exportado: ${group}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setExportando(false)
    }
  }

  const handleExportSingle = (table: TableInfo) => {
    setExportando(true)
    try {
      const data = counts && counts[table.id] === 0 ? [] : undefined
      if (data !== undefined) {
        exportSingleTable(table, data)
      } else {
        table.query().then(d => exportSingleTable(table, d))
      }
      toast.success(`Exportado: ${table.label}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
          Exportar Datos
        </h1>
        <p className="text-sm text-muted-foreground">Descargá la base de datos completa en un solo archivo Excel</p>
      </div>

      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-5">
          <div className="flex-1">
            <p className="font-semibold text-lg">
              gym_shimokawa_{new Date().toISOString().split('T')[0]}.xlsx
            </p>
            <p className="text-sm text-muted-foreground">
              {selected.size} hojas · {totalRegistros.toLocaleString('es-PE')} registros totales
            </p>
          </div>
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            disabled={exportando || selected.size === 0}
            onClick={handleExportAll}
          >
            <Download className="h-4 w-4" />
            {exportando ? 'Exportando...' : 'Exportar todo'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {Object.entries(groups).map(([group, groupTables]) => {
          const Icon = groupIcons[group] ?? Shield
          const colorClass = groupColors[group] ?? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
          const isExpanded = expanded.has(group)
          const allSelected = groupTables.every(t => selected.has(t.id))
          const someSelected = groupTables.some(t => selected.has(t.id))
          const groupCount = groupTables.reduce((sum, t) => sum + (counts?.[t.id] ?? 0), 0)

          return (
            <Card key={group} className="overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleExpand(group)}
              >
                <button className="text-muted-foreground">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <div className={`p-1.5 rounded-lg border ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <span className="font-medium flex-1">{group}</span>

                <Badge variant="outline" className="text-xs">
                  {groupCount.toLocaleString('es-PE')} filas
                </Badge>

                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); toggleGroup(group) }}
                >
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    allSelected ? 'bg-emerald-500 border-emerald-500 text-white'
                    : someSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                    : 'border-muted-foreground'
                  }`}>
                    {allSelected && <Check className="h-3 w-3" />}
                    {someSelected && !allSelected && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  </div>
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={(e) => { e.stopPropagation(); handleExportGroup(group) }}
                  disabled={exportando}
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </div>

              {isExpanded && (
                <div className="border-t">
                  {groupTables.map((table) => {
                    const isSelected = selected.has(table.id)
                    const count = counts?.[table.id] ?? 0
                    return (
                      <div
                        key={table.id}
                        className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-accent/30 transition-colors"
                      >
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => toggleTable(table.id)}
                        >
                          <div className={`h-4.5 w-4.5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </div>
                        </button>

                        <span className="flex-1 text-sm">{table.label}</span>

                        <span className="text-xs text-muted-foreground">
                          {count.toLocaleString('es-PE')} filas
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={exportando}
                          onClick={() => handleExportSingle(table)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
