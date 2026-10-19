import { useQueryClient } from "@tanstack/react-query";
import {
  ContainerIcon,
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
import { CrateServerDialog } from "@/features/dashboard/components/create-server-dialog";
import ServerCard from "@/features/dashboard/components/server-card";
import { ServerTable } from "@/features/dashboard/components/server-table";
import { useMockRemoveServer } from "@/hooks/use-server-mutation";
import { useMockServers } from "@/hooks/use-servers";

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
            <Button size={"lg"}>
              <PlusIcon />
              Create server
            </Button>
          }
        />
      </EmptyContent>
    </Empty>
  );
}

interface DashboardOverviewHeaderProps {
  isGridLayout: boolean;
  totalCount: number;
  search: string;
  refetchPending: boolean;
  refetch: () => void;
  onSearchChange: (value: string) => void;
  setIsGridLayout: React.Dispatch<React.SetStateAction<boolean>>;
}

function DashboardOverviewHeader({
  isGridLayout,
  totalCount,
  search,
  refetchPending,
  refetch,
  onSearchChange,
  setIsGridLayout,
}: DashboardOverviewHeaderProps) {
  return (
    <div className="mb-2 align-middle">
      <div className="flex items-center gap-2">
        <ServerIcon />
        <h1 className="text-2xl">Servers</h1>
        <Badge variant={"outline"}>{totalCount}</Badge>
      </div>

      <div className="flex items-center justify-end">
        <InputGroup className="mr-2 ml-auto max-w-50">
          <InputGroupInput
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <ButtonGroup>
          <Button
            size={"lg"}
            variant={"secondary"}
            onClick={() => setIsGridLayout((prev) => !prev)}
          >
            {isGridLayout ? <LayoutDashboardIcon /> : <LayoutListIcon />}
          </Button>

          <Button
            size={"lg"}
            variant={"secondary"}
            disabled={refetchPending}
            onClick={() => refetch()}
          >
            <RefreshCwIcon />
          </Button>

          <CrateServerDialog
            trigger={
              <Button size={"lg"}>
                <PlusIcon />
                Create server
              </Button>
            }
          />
        </ButtonGroup>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [search, setSearch] = useState("");

  const { data, isPending, isError, error, refetch: refreshServers } = useMockServers();
  const servers = data?.data;

  const deleteServer = useMockRemoveServer();

  const qc = useQueryClient();
  const refetch = (offset = 0, limit = 10): void => {
    refreshServers();
    qc.invalidateQueries({ queryKey: [serverKeys.list(offset, limit)] });
  };

  const filteredServers = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    if (!q) {
      return servers;
    }

    return servers?.filter((s) => {
      const cfg = s.serverConfigData;
      return (
        cfg.name.toLocaleLowerCase().includes(q) ||
        cfg.id?.toLocaleLowerCase().includes(q) ||
        (cfg.bindAddress ?? "").includes(q) ||
        String(cfg.bindPort).includes(q) ||
        (cfg.status ?? "").includes(q)
      );
    });
  }, [servers, search]);

  return (
    <div className="h-full">
      {(data?.count ?? 0) > 0 && (
        <DashboardOverviewHeader
          isGridLayout={isGridLayout}
          setIsGridLayout={setIsGridLayout}
          search={search}
          refetchPending={isPending}
          refetch={refetch}
          onSearchChange={setSearch}
          totalCount={data?.count ?? 0}
        />
      )}

      {data?.count === 0 ? (
        <EmptyOverview />
      ) : isPending ? (
        <div>Loading</div>
      ) : isError ? (
        <div>Error {error.message}</div>
      ) : isGridLayout ? (
        <div className="my-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServers?.map((server) => (
            <ServerCard className="max-w-full" key={server.serverConfigData.id} server={server} />
          ))}
        </div>
      ) : (
        <ServerTable
          servers={servers ?? []}
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
