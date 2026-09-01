import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

export function Pagination({
  page, pageSize, total, onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground">
        Mostrando {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft /> Anterior
        </Button>
        <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Siguiente <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
