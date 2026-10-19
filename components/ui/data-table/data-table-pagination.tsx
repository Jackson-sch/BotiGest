"use client"

import { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-3 py-3 border-t border-border/40 text-xs text-muted-foreground">
      {/* Resumen de selección de filas */}
      <div className="flex-1 text-xs">
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <span>
            <strong className="text-foreground">
              {table.getFilteredSelectedRowModel().rows.length}
            </strong>{" "}
            de{" "}
            <strong className="text-foreground">
              {table.getFilteredRowModel().rows.length}
            </strong>{" "}
            fila(s) seleccionada(s).
          </span>
        ) : (
          <span>
            Total:{" "}
            <strong className="text-foreground font-mono">
              {table.getFilteredRowModel().rows.length}
            </strong>{" "}
            registros
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Selector de filas por página */}
        <div className="flex items-center gap-2">
          <span className="text-xs">Filas por pág.</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[68px] rounded-lg text-xs bg-background/80 border-border/60">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="rounded-xl border-border/70">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem
                  key={pageSize}
                  value={`${pageSize}`}
                  className="text-xs"
                >
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Indicador de página actual */}
        <div className="flex items-center justify-center text-xs font-mono">
          Pág. {table.getState().pagination.pageIndex + 1} de{" "}
          {Math.max(1, table.getPageCount())}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex rounded-lg border-border/60"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="Primera página"
          >
            <span className="sr-only">Primera página</span>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 rounded-lg border-border/60"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Página anterior"
          >
            <span className="sr-only">Página anterior</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 rounded-lg border-border/60"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Página siguiente"
          >
            <span className="sr-only">Página siguiente</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex rounded-lg border-border/60"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Última página"
          >
            <span className="sr-only">Última página</span>
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
