import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  flexRender,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  LogsIcon,
  MoreHorizontal,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ServerOut, ServerStatusEnum } from "@/types/server";

const features = tableFeatures({
  rowSortingFeature,
  globalFilteringFeature,
  columnFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
  },
  filterFns: {
    includesString: filterFn_includesString,
  },
});

interface ServerTableProps {
  servers: ServerOut[];
  search?: string;
  onSearchChange?: (value: string) => void;
  onEdit?: (server: ServerOut) => void;
  onShowLogs?: (server: ServerOut) => void;
  onDelete?: (server: ServerOut) => void;
}

export function ServerTable({
  servers,
  search,
  onSearchChange,
  onEdit,
  onShowLogs,
  onDelete,
  className,
  ...props
}: ServerTableProps & React.ComponentProps<"div">) {
  const [internalFilter, setInternalFilter] = useState("");
  const globalFilter = search ?? internalFilter;
  const setGlobalFilter = onSearchChange ?? setInternalFilter;

  const columns = useMemo<Array<ColumnDef<typeof features, ServerOut>>>(
    () => [
      {
        id: "id",
        accessorFn: (row) => row.serverConfigData.id,
        header: "ID",
        cell: (info) => (
          <span className="text-muted-foreground font-mono text-xs">
            {String(info.getValue() ?? "").slice(0, 8)}
          </span>
        ),
        enableGlobalFilter: true,
      },
      {
        id: "name",
        accessorFn: (row) => row.serverConfigData.name,
        header: "Name",
        cell: (info) => info.getValue<string>(),
        enableGlobalFilter: true,
      },
      {
        id: "status",
        accessorFn: (row) => row.serverConfigData.status,
        header: "Status",
        cell: (info) => {
          const value = info.getValue<string>() as ServerStatusEnum;
          return (
            <Badge
              variant={
                value === "running"
                  ? "default"
                  : value === "created" || value === "exited"
                    ? "outline"
                    : "destructive"
              }
            >
              {info.getValue<string>()}
            </Badge>
          );
        },
      },
      {
        id: "bindPort",
        accessorFn: (row) => row.serverConfigData.bindPort,
        header: "Bind Port",
        cell: (info) => info.getValue<number>(),
      },
      {
        id: "bindAddress",
        accessorFn: (row) => row.serverConfigData.bindAddress,
        header: "Bind Address",
        enableGlobalFilter: true,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const server = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                }
              />

              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => onEdit?.(server)}>
                    <PencilIcon className="size-4" />
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onShowLogs?.(server)}>
                    <LogsIcon />
                    Logs
                  </DropdownMenuItem>

                  <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(server)}>
                    <Trash2Icon className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onDelete],
  );

  const table = useTable({
    key: "servers-table",
    features,
    columns,
    data: servers,
    getRowId: (row) => row.serverConfigData.id ?? "Unknown",
    // global filter
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  useTanStackTableDevtools(table);

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {search === undefined && (
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Filter servers..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <Table className="border-separate border-spacing-y-2">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <Button
                          variant={"ghost"}
                          className={
                            header.column.getCanSort()
                              ? "flex items-center gap-1 select-none"
                              : undefined
                          }
                          onClick={header.column.getToggleSortingHandler()}
                          disabled={!header.column.getCanSort()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() &&
                            (sorted === "asc" ? (
                              <ArrowUpIcon className="size-3.5" />
                            ) : sorted === "desc" ? (
                              <ArrowDownIcon className="size-3.5" />
                            ) : (
                              <ChevronsUpDownIcon className="size-3.5 opacity-50" />
                            ))}
                        </Button>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="bg-card hover:bg-accent/40 rounded-md border shadow-sm"
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  No servers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Page {table.state.pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
