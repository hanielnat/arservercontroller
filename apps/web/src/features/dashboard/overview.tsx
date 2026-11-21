import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ChevronsUpDownIcon,
  ContainerIcon,
  GroupIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";

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
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import ServerCard from "@/features/dashboard/components/server-card";
import { useSettings } from "@/hooks/providers/settings-provider";
import { serversQueryOptions, useSuspenseServers } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";
import type { GroupByOption, SortByOption, SortingOrder } from "@/types/dashboard";
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
        <Button
          size="lg"
          render={
            <Link to={"/servers/create"}>
              <PlusIcon />
              Create server
            </Link>
          }
        />
      </EmptyContent>
    </Empty>
  );
}

type GroupedServers = Partial<Record<string, ServerOut[]>>;

type ProcessedServersType = {
  list: ServerOut[];
  grouped?: GroupedServers;
};

interface ViewState {
  search: string;
  sortBy: SortByOption;
  sortOrder: SortingOrder;
  groupBy: GroupByOption;
  onSearchChange: (value: string) => void;
  setGroupBy: (value: GroupByOption) => void;
  setSortOrder: (value: SortingOrder) => void;
  setSortBy: (value: SortByOption) => void;
}

interface DashboardOverviewHeaderProps {
  state: ViewState;
}

function DashboardOverviewHeader({ state }: DashboardOverviewHeaderProps) {
  const {
    data: totalCount,
    refetch,
    isFetching,
  } = useSuspenseQuery({
    ...serversQueryOptions(),
    select: (data) => data.count,
  });
  return (
    <div className="mb-2 w-full">
      <div className="flex items-center gap-2">
        <ServerIcon />
        <h1 className="text-2xl">Servers</h1>
        <Badge variant="outline">{totalCount}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <InputGroup className="w-full max-w-none sm:max-w-50 md:max-w-80">
          <InputGroupInput
            placeholder="Search by name, addres or ID"
            value={state.search}
            onChange={(e) => state.onSearchChange(e.target.value)}
          />

          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <span className="flex w-full flex-wrap gap-1 sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Label className="truncate text-xs text-muted-foreground">Sort by</Label>
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
            pressed={state.groupBy === "status"}
            onClick={() => state.setGroupBy(state.groupBy === "status" ? "" : "status")}
          >
            <GroupIcon className="group-aria-pressed/toggle:fill-foreground" />
            {state.groupBy === "" ? "Group by none" : `Group by ${state.groupBy}`}
          </Toggle>

          <Toggle
            variant="outline"
            pressed={state.sortOrder === "ascending"}
            onClick={() =>
              state.setSortOrder(state.sortOrder === "ascending" ? "descending" : "ascending")
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
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? <Spinner className="size-4" /> : <RefreshCwIcon />}
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
  const { settings, setSettings } = useSettings();
  const [search, setSearch] = useState("");
  const sortBy = settings.interface.sortBy;
  const sortOrder = settings.interface.sortOrder;
  const groupBy = settings.interface.groupBy;

  const setSortBy = (sortBy: SortByOption) => {
    setSettings((current) => ({
      ...current,
      interface: { ...current.interface, sortBy },
    }));
  };

  const setSortOrder = (sortOrder: SortingOrder) => {
    setSettings((current) => ({
      ...current,
      interface: { ...current.interface, sortOrder },
    }));
  };

  const setGroupBy = (groupBy: GroupByOption) => {
    setSettings((current) => ({
      ...current,
      interface: { ...current.interface, groupBy },
    }));
  };

  const { data } = useSuspenseServers();
  const servers = data.data;

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
          state={{
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
      ) : groupBy !== "" && processedServers.grouped ? (
        <ServerCardsGrouped groups={processedServers.grouped} />
      ) : (
        <ServerCardsGrid servers={processedServers.list} />
      )}
    </div>
  );
}
