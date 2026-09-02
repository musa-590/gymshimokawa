import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export interface Column<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  className?: string
  hideInCard?: boolean
}

export function CrudTable<T>({
  columns, rows, getKey, onEdit, onDelete, renderActions, onRowClick, emptyText = 'No hay registros',
}: {
  columns: Column<T>[]
  rows: T[]
  getKey: (row: T) => string
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  renderActions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  emptyText?: string
}) {
  if (!rows.length) {
    return <p className="text-muted-foreground py-8 text-center">{emptyText}</p>
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>{c.label}</TableHead>
              ))}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={getKey(row)}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-accent' : ''}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>{c.render(row)}</TableCell>
                ))}
                <TableCell className="text-right">
                  {renderActions ? (
                    <div className="flex justify-end">{renderActions(row)}</div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(row) }}>
                          <Pencil />
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(row) }}>
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <div
            key={getKey(row)}
            onClick={() => onRowClick?.(row)}
            className={`rounded-xl border bg-card p-4 shadow-sm space-y-2 animate-slide-up ${onRowClick ? 'cursor-pointer' : ''}`}
          >
            {columns.filter((c) => !c.hideInCard).map((c) => (
              <div key={c.key} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-muted-foreground shrink-0">{c.label}</span>
                <span className="text-right font-medium">{c.render(row)}</span>
              </div>
            ))}
            {renderActions ? (
              <div className="flex justify-end pt-2 border-t">{renderActions(row)}</div>
            ) : (onEdit || onDelete) && (
              <div className="flex justify-end gap-2 pt-2 border-t">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(row) }}>
                    <Pencil /> Editar
                  </Button>
                )}
                {onDelete && (
                  <Button variant="outline" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(row) }}>
                    <Trash2 /> Eliminar
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export { Badge }
