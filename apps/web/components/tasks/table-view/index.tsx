"use client"

import { useState, useMemo, useId, useEffect, useRef } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
  type Header,
  type ColumnSizingState,
  type ColumnSizingInfoState,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Add01Icon,
  Delete01Icon,
  FilterIcon,
  MoreVerticalIcon,
  Search01Icon,
  Tick02Icon,
} from "@/components/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { Cell } from "./cell"
import { ColumnHeader } from "./column-header"
import { AddColumnDialog } from "./add-column-dialog"
import type { Column, ColumnType, Task, TaskBoard } from "../../../lib/types"

const DEFAULT_COL_WIDTH = 180
const TITLE_COL_WIDTH = 280
const MIN_COL_WIDTH = 80

function defaultColWidth(col: Column) {
  if (col.width) return col.width
  return col.name.toLowerCase() === "title" ||
    (col.type === "text" && col.order === 1)
    ? TITLE_COL_WIDTH
    : DEFAULT_COL_WIDTH
}

const globalFilterFn: FilterFn<Task> = (row, _colId, filterValue: string) => {
  const lower = filterValue.toLowerCase()
  return Object.values(row.original.values).some((v) =>
    String(v ?? "")
      .toLowerCase()
      .includes(lower)
  )
}

const selectFilterFn: FilterFn<Task> = (row, colId, filterValues: string[]) => {
  if (!filterValues.length) return true
  const val = row.original.values[colId]
  if (Array.isArray(val))
    return (val as string[]).some((v) => filterValues.includes(v))
  return filterValues.includes(val as string)
}

interface TableViewProps {
  board: TaskBoard
  onAddTask: () => Promise<void>
  onUpdateTask: (
    taskId: string,
    values: Record<string, unknown>
  ) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onAddColumn: (name: string, type: ColumnType) => Promise<void>
  onRenameColumn: (columnId: string, name: string) => Promise<void>
  onDeleteColumn: (columnId: string) => Promise<void>
  onReorderColumns: (columnIds: string[]) => Promise<void>
  onChangeIcon: (columnId: string, icon: string | null) => Promise<void>
  onResizeColumn: (columnId: string, width: number) => Promise<void>
  onCreateOption: (columnId: string, label: string) => Promise<void>
  onUpdateOption: (optionId: string, color: string | null) => Promise<void>
}

function SortableColumnHead({
  header,
  children,
}: {
  header: Header<Task, unknown>
  children: (
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement>
  ) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.column.id,
  })
  return (
    <TableHead
      ref={setNodeRef}
      style={{
        width: header.column.getSize(),
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group relative h-8 border-r border-border p-0 last:border-r-0",
        isDragging && "opacity-40"
      )}
    >
      {children({
        ...attributes,
        ...listeners,
      } as React.HTMLAttributes<HTMLButtonElement>)}
      {/* Resize handle */}
      <div
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        className={cn(
          "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none",
          "opacity-0 transition-opacity group-hover:opacity-100",
          "bg-primary/40",
          header.column.getIsResizing() && "bg-primary opacity-100"
        )}
      />
    </TableHead>
  )
}

export function TableView({
  board,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onReorderColumns,
  onChangeIcon,
  onResizeColumn,
  onCreateOption,
  onUpdateOption,
}: TableViewProps) {
  const [addColOpen, setAddColOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [filterOpen, setFilterOpen] = useState(false)

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
    Object.fromEntries(
      board.columns
        .filter((c) => c.width !== null && c.width !== undefined)
        .map((c) => [c.id, c.width!])
    )
  )
  const [columnSizingInfo, setColumnSizingInfo] =
    useState<ColumnSizingInfoState>({
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false,
      columnSizingStart: [],
    })

  const prevResizingRef = useRef<string | false>(false)
  useEffect(() => {
    const prev = prevResizingRef.current
    const curr = columnSizingInfo.isResizingColumn
    prevResizingRef.current = curr
    if (prev && !curr) {
      const newWidth = columnSizing[prev as string]
      if (newWidth) onResizeColumn(prev as string, newWidth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSizingInfo.isResizingColumn])

  const dndId = useId()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = board.columns.findIndex((c) => c.id === active.id)
    const newIndex = board.columns.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(board.columns, oldIndex, newIndex)
    onReorderColumns(reordered.map((c) => c.id))
  }

  function removeFilterValue(colId: string, optId: string) {
    setColumnFilters((prev) => {
      const filter = prev.find((f) => f.id === colId)
      if (!filter) return prev
      const next = (filter.value as string[]).filter((v) => v !== optId)
      const without = prev.filter((f) => f.id !== colId)
      return next.length ? [...without, { id: colId, value: next }] : without
    })
  }

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "_select",
        size: 36,
        minSize: 36,
        maxSize: 36,
        enableResizing: false,
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex h-full min-h-[36px] items-center justify-center px-2">
            <input
              type="checkbox"
              checked={rowSelection[row.original.id] ?? false}
              onChange={(e) =>
                setRowSelection((prev) => ({
                  ...prev,
                  [row.original.id]: e.target.checked,
                }))
              }
              className="h-3.5 w-3.5 cursor-pointer accent-primary opacity-0 transition-opacity group-hover:opacity-100"
              style={{ opacity: rowSelection[row.original.id] ? 1 : undefined }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
      },
      ...board.columns.map(
        (col): ColumnDef<Task> => ({
          id: col.id,
          size: defaultColWidth(col),
          minSize: MIN_COL_WIDTH,
          enableResizing: true,
          accessorFn: (row) => row.values[col.id],
          enableSorting: col.type !== "multiselect",
          filterFn: selectFilterFn,
          header: () => (
            <ColumnHeader
              column={col}
              onRename={(name) => onRenameColumn(col.id, name)}
              onDelete={() => onDeleteColumn(col.id)}
              onChangeIcon={(icon) => onChangeIcon(col.id, icon)}
            />
          ),
          cell: ({ row }) => (
            <Cell
              column={col}
              task={row.original}
              onUpdate={(values) => onUpdateTask(row.original.id, values)}
              onCreateOption={onCreateOption}
              onUpdateOption={onUpdateOption}
            />
          ),
        })
      ),
      {
        id: "_actions",
        size: 36,
        minSize: 36,
        maxSize: 36,
        enableResizing: false,
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const statusCol = board.columns.find(
            (c) => c.name.toLowerCase() === "status" && c.type === "select"
          )
          const doneOption = statusCol?.options.find(
            (o) => o.label.toLowerCase() === "done"
          )
          const isDone =
            statusCol &&
            doneOption &&
            row.original.values[statusCol.id] === doneOption.id

          return (
            <div className="flex h-full min-h-[36px] items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVerticalIcon className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isDone ? (
                    <DropdownMenuItem
                      disabled
                      className="cursor-default gap-2 whitespace-nowrap bg-emerald-200/20 text-emerald-500 opacity-100 focus:bg-emerald-200/20 focus:text-emerald-500"
                    >
                      <Tick02Icon className="h-3.5 w-3.5 shrink-0" />
                      Already Done
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="gap-2 whitespace-nowrap text-muted-foreground"
                      onSelect={() => {
                        if (!statusCol || !doneOption) return
                        onUpdateTask(row.original.id, {
                          ...row.original.values,
                          [statusCol.id]: doneOption.id,
                        })
                      }}
                    >
                      <Tick02Icon className="h-3.5 w-3.5 shrink-0" />
                      Mark as done
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="gap-2 whitespace-nowrap text-destructive focus:text-destructive"
                    onSelect={() => onDeleteTask(row.original.id)}
                  >
                    <Delete01Icon className="h-3.5 w-3.5 shrink-0" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      board.columns,
      board.tasks,
      rowSelection,
      onDeleteTask,
      onUpdateTask,
      onRenameColumn,
      onDeleteColumn,
      onChangeIcon,
      onCreateOption,
      onUpdateOption,
    ]
  )

  const table = useReactTable({
    data: board.tasks,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      columnSizing,
      columnSizingInfo,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    globalFilterFn,
  })

  const selectCols = board.columns.filter((c) => c.type === "select")
  const activeFilterCount = columnFilters.length

  const filterChips = columnFilters.flatMap((filter) => {
    const col = board.columns.find((c) => c.id === filter.id)
    if (!col) return []
    return (filter.value as string[]).map((optId) => {
      const opt = col.options.find((o) => o.id === optId)
      return {
        colId: filter.id,
        optId,
        label: opt?.label ?? optId,
        color: opt?.color ?? null,
      }
    })
  })

  return (
    <div className="flex flex-col">
      {/* Utility bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        <div className="relative">
          <Search01Icon className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search tasks…"
            className="h-8 w-64 rounded-md border border-border bg-background pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm transition-colors hover:bg-muted",
                activeFilterCount > 0
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {filterChips.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            {selectCols.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No filterable columns
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {selectCols.map((col) => {
                  const active =
                    (columnFilters.find((f) => f.id === col.id)
                      ?.value as string[]) ?? []
                  return (
                    <div key={col.id}>
                      <p className="mb-1.5 text-xs font-medium">{col.name}</p>
                      <div className="flex flex-col gap-0.5">
                        {col.options.map((opt) => {
                          const checked = active.includes(opt.id)
                          return (
                            <label
                              key={opt.id}
                              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const next = checked
                                    ? active.filter((v) => v !== opt.id)
                                    : [...active, opt.id]
                                  setColumnFilters((prev) => {
                                    const without = prev.filter(
                                      (f) => f.id !== col.id
                                    )
                                    return next.length
                                      ? [
                                          ...without,
                                          { id: col.id, value: next },
                                        ]
                                      : without
                                  })
                                }}
                                className="accent-primary"
                              />
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    opt.color ?? "var(--muted-foreground)",
                                }}
                              />
                              {opt.label}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {activeFilterCount > 0 && (
                  <button
                    className="text-left text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setColumnFilters([])}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Active filter chips */}
        {filterChips.map(({ colId, optId, label, color }) => (
          <span
            key={`${colId}-${optId}`}
            className="flex h-8 items-center gap-1.5 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground"
          >
            {color && (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            {label}
            <button
              onClick={() => removeFilterValue(colId, optId)}
              className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
              title="Remove filter"
            >
              <svg
                viewBox="0 0 12 12"
                className="h-2.5 w-2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {/* Table */}
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={board.columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="overflow-x-auto">
            <Table style={{ tableLayout: "fixed" }}>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow
                    key={hg.id}
                    className="border-b border-border bg-muted/30 hover:bg-muted/30"
                  >
                    {hg.headers.map((header) =>
                      header.column.id === "_select" ? (
                        <TableHead
                          key={header.id}
                          style={{ width: header.column.getSize() }}
                          className="h-8 border-r border-border p-0 last:border-r-0"
                        />
                      ) : header.column.id === "_actions" ? (
                        <TableHead
                          key={header.id}
                          style={{ width: header.column.getSize() }}
                          className="h-8 border-r border-border p-0 last:border-r-0"
                        >
                          <button
                            className="flex h-8 w-full items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() => setAddColOpen(true)}
                            title="Add column"
                          >
                            <Add01Icon className="h-3.5 w-3.5" />
                          </button>
                        </TableHead>
                      ) : (
                        <SortableColumnHead key={header.id} header={header}>
                          {(dragHandleProps) => (
                            <ColumnHeader
                              column={
                                board.columns.find(
                                  (c) => c.id === header.column.id
                                )!
                              }
                              onRename={(name) =>
                                onRenameColumn(header.column.id, name)
                              }
                              onDelete={() => onDeleteColumn(header.column.id)}
                              onChangeIcon={(icon) =>
                                onChangeIcon(header.column.id, icon)
                              }
                              dragHandleProps={dragHandleProps}
                            />
                          )}
                        </SortableColumnHead>
                      )
                    )}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group border-b border-border hover:bg-muted/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="border-r border-border p-0 align-middle last:border-r-0"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SortableContext>
      </DndContext>

      {/* Add task */}
      <button
        className="flex h-9 w-full items-center gap-2 border-t border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        onClick={onAddTask}
      >
        <Add01Icon className="h-3.5 w-3.5 shrink-0" />
        Add task
      </button>

      <AddColumnDialog
        open={addColOpen}
        onOpenChange={setAddColOpen}
        onAdd={onAddColumn}
      />
    </div>
  )
}
