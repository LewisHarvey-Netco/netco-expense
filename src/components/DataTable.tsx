import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (id: string) => void
  emptyMessage?: string
  tableClassName?: string
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data to display.',
  tableClassName,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <Table className={cn('table-fixed', tableClassName)}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} className={col.className}>
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow
            key={item.id}
            data-row-id={item.id}
            className={cn(
              onRowClick && 'cursor-pointer',
              'hover:bg-muted/50'
            )}
            onClick={() => onRowClick?.(item.id)}
          >
            {columns.map((col) => (
              <TableCell key={`${item.id}-${col.key}`} className={col.className}>
                {col.render(item)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
