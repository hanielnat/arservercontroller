import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ChevronsUpDownIcon,
  ContainerIcon,
  GroupIcon,
  LayoutDashboardIcon,
  LayoutListIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import { serverKeys } from "@/api/servers.keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { CrateServerDialog } from "@/features/dashboard/components/create-server-dialog";
import ServerCard from "@/features/dashboard/components/server-card";
import { ServerTable } from "@/features/dashboard/components/server-table";
import { useRemoveServer } from "@/hooks/use-server-mutation";
import { useServers } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";
import type { ServerOut } from "@/types/server";

function EmptyOverview() {
  return (
    <Empty className="h-full border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ContainerIcon />
        </EmptyMedia>

        <EmptyTitle>No Servers Found</EmptyTitle>

        <EmptyDescription>Start by creating your first server.</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <CrateServerDialog
          trigger={
            <Button size="lg">
              <PlusIcon />
              Create server
            </Button>
          }
        />
      </EmptyContent>
    </Empty>
  );
}

type SortingOrder = "descending" | "ascending";
type SortByOption = "updated" | "created" | "name";
type GroupByOption = "" | "status";

type GroupedServers = Partial<Record<string, ServerOut[]>>;

type ProcessedServersType = {
  list: ServerOut[];
  grouped?: GroupedServers;
};

interface ViewState {
  isGridLayout: boolean;
  search: string;
  sortBy: SortByOption;
  sortOrder: SortingOrder;
  groupBy: GroupByOption;
  onSearchChange: (value: string) => void;
  setIsGridLayout: React.Dispatch<React.SetStateAction<boolean>>;
  setGroupBy: React.Dispatch<React.SetStateAction<GroupByOption>>;
  setSortOrder: React.Dispatch<React.SetStateAction<SortingOrder>>;
  setSortBy: React.Dispatch<React.SetStateAction<SortByOption>>;
}

interface DashboardOverviewHeaderProps {
  totalCount: number;
  refetchPending: boolean;
  refetch: () => void;
  state: ViewState;
}

function DashboardOverviewHeader({
  totalCount,
  refetchPending,
  refetch,
  state,
}: DashboardOverviewHeaderProps) {
  return (
    <div className="mb-2 w-full">
      <div className="flex items-center gap-2">
        <ServerIcon />
        <h1 className="text-2xl">Servers</h1>
        <Badge variant="outline">{totalCount}</Badge>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <InputGroup className="max-w-50 md:max-w-80">
          <InputGroupInput
            placeholder="Search by name, addres or ID"
            value={state.search}
            onChange={(e) => state.onSearchChange(e.target.value)}
          />

          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <span className="flex max-w-fit gap-1">
          <div className="flex items-center gap-1.5">
            <Label className="text-muted-foreground truncate text-xs">Sort by</Label>
            <Select
              items={
                [
                  {
                    label: "Name",
                    value: "name" as const,
                  },
                  {
                    label: "Updated",
                    value: "updated" as const,
                  },
                  {
                    label: "Created",
                    value: "created" as const,
                  },
                ] satisfies { label: string; value: SortByOption }[]
              }
              value={state.sortBy}
              onValueChange={(value) => {
                if (value) {
                  state.setSortBy(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="created">Created</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Toggle
            variant="outline"
            onClick={() => state.setGroupBy((prev) => (prev === "status" ? "" : "status"))}
          >
            <GroupIcon className="group-aria-pressed/toggle:fill-foreground" />
            {state.groupBy === "" ? "Group by none" : `Group by ${state.groupBy}`}
          </Toggle>

          <Toggle
            variant="outline"
            onClick={() =>
              state.setSortOrder((prev) => (prev === "ascending" ? "descending" : "ascending"))
            }
          >
            <ChevronsUpDownIcon />
            Sort {state.sortOrder}
          </Toggle>
        </span>

        <ButtonGroup className="ml-auto">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => state.setIsGridLayout((prev) => !prev)}
          >
            {state.isGridLayout ? <LayoutDashboardIcon /> : <LayoutListIcon />}
          </Button>

          <Button size="lg" variant="secondary" disabled={refetchPending} onClick={() => refetch()}>
            <RefreshCwIcon />
          </Button>

          <Button
            size="lg"
            render={
              <Link to="/servers/create">
                <PlusIcon />
                Create Server
              </Link>
            }
          />
        </ButtonGroup>
      </div>
    </div>
  );
}

function ServerCardsGrid({
  servers,
  className,
}: { servers: ServerOut[] } & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {servers.map((server) => (
        <ServerCard key={server.serverConfigData.id} server={server} />
      ))}
    </div>
  );
}

function ServerCardsGrouped({ groups }: { groups: GroupedServers }) {
  return (
    <div className="my-4 flex flex-col gap-8">
      {Object.entries(groups).map(([groupKey, servers]) => (
        <section key={groupKey}>
          <h2 className="mb-3 flex items-center text-lg font-medium capitalize">
            {groupKey || "unknown"}
            <Badge variant="outline" className="ml-2">
              {servers?.length ?? 0}
            </Badge>
          </h2>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(servers ?? []).map((server) => (
              <ServerCard key={server.serverConfigData.id} server={server} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function DashboardOverview() {
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortByOption>("updated");
  const [sortOrder, setSortOrder] = useState<SortingOrder>("descending");
  const [groupBy, setGroupBy] = useState<GroupByOption>("");

  const { data, isPending, isError, error, refetch: refreshServers } = useServers();
  const servers = data?.data;

  const deleteServer = useRemoveServer();

  const qc = useQueryClient();
  const refetch = (offset = 0, limit = 10): void => {
    refreshServers();
    qc.invalidateQueries({ queryKey: [serverKeys.list(offset, limit)] });
  };

  const processedServers = useMemo((): ProcessedServersType => {
    if (!servers) {
      return {
        list: [],
      };
    }

    const q = search.trim().toLocaleLowerCase();
    let filtered: ServerOut[] | undefined;

    if (q) {
      filtered = servers.filter((s) => {
        const cfg = s.serverConfigData;
        return (
          cfg.name.toLocaleLowerCase().includes(q) ||
          cfg.id?.toLocaleLowerCase().includes(q) ||
          (cfg.bindAddress ?? "").includes(q) ||
          String(cfg.bindPort).includes(q) ||
          (cfg.status ?? "").includes(q)
        );
      });
    }

    const list = filtered ?? servers;

    const sorted = list.toSorted((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "ascending"
          ? a.serverConfigData.name.localeCompare(b.serverConfigData.name)
          : b.serverConfigData.name.localeCompare(a.serverConfigData.name);
      }

      if (sortBy === "created") {
        return sortOrder === "ascending" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      }

      if (sortBy === "updated") {
        return sortOrder === "ascending" ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt;
      }

      return 0;
    });

    if (groupBy === "") {
      return {
        list: sorted,
      };
    }

    const grouped = Object.groupBy(sorted, (sv) => sv.serverConfigData.status ?? "");

    return {
      list: sorted,
      grouped,
    };
  }, [servers, search, sortOrder, sortBy, groupBy]);

  return (
    <div className="h-full">
      {(data?.count ?? 0) > 0 && (
        <DashboardOverviewHeader
          refetchPending={isPending}
          refetch={refetch}
          totalCount={data?.count ?? 0}
          state={{
            isGridLayout,
            setIsGridLayout,
            search,
            onSearchChange: setSearch,
            sortBy,
            setSortBy,
            sortOrder,
            setSortOrder,
            groupBy,
            setGroupBy,
          }}
        />
      )}

      {data?.count === 0 ? (
        <EmptyOverview />
      ) : isPending ? (
        <div>Loading</div>
      ) : isError ? (
        <div>Error {error.message}</div>
      ) : isGridLayout ? (
        groupBy !== "" && processedServers.grouped ? (
          <ServerCardsGrouped groups={processedServers.grouped} />
        ) : (
          <ServerCardsGrid servers={processedServers.list} />
        )
      ) : (
        <ServerTable
          servers={processedServers.list}
          search={search}
          onSearchChange={setSearch}
          onEdit={(server) => {
            console.log("edit", server.serverConfigData.id);
          }}
          onDelete={(server) =>
            deleteServer.mutate({ id: server.serverConfigData.id, force: true })
          }
        />
      )}
    </div>
  );
}
