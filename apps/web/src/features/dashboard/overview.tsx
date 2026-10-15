import {
  ContainerIcon,
  LayoutDashboardIcon,
  LayoutListIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
} from "lucide-react";
import React, { useState } from "react";

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
import { SCHEMA_VERSION } from "@/lib/consts";
import type { ServerOut } from "@/types/server";

let servers: ServerOut[] = [
  {
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
    serverConfigData: {
      version: SCHEMA_VERSION,
      name: "Test",
      bindPort: 2001,
      a2sPort: 19999,
      rconPort: 17777,
      bindAddress: "0.0.0.0",
      commandLine: ["-logLevel", "spam"],
      environment: {
        AGENT_DEBUG: "1",
      },
      extraPorts: undefined,
      status: "running",
      reforgerConfig: {
        test: "test",
      },
    },
  },
  {
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
    serverConfigData: {
      version: SCHEMA_VERSION,
      name: "Test",
      bindPort: 2001,
      a2sPort: 19999,
      rconPort: 17777,
      bindAddress: "0.0.0.0",
      commandLine: ["-logLevel", "spam"],
      environment: {
        AGENT_DEBUG: "1",
      },
      extraPorts: undefined,
      status: "running",
      reforgerConfig: {
        test: "test",
      },
    },
  },
  {
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
    serverConfigData: {
      version: SCHEMA_VERSION,
      name: "Test",
      bindPort: 2001,
      a2sPort: 19999,
      rconPort: 17777,
      bindAddress: "0.0.0.0",
      commandLine: ["-logLevel", "spam"],
      environment: {
        AGENT_DEBUG: "1",
      },
      extraPorts: undefined,
      status: "running",
      reforgerConfig: {
        test: "test",
      },
    },
  },
  {
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
    serverConfigData: {
      version: SCHEMA_VERSION,
      name: "Test",
      bindPort: 2001,
      a2sPort: 19999,
      rconPort: 17777,
      bindAddress: "0.0.0.0",
      commandLine: ["-logLevel", "spam"],
      environment: {
        AGENT_DEBUG: "1",
      },
      extraPorts: undefined,
      status: "running",
      reforgerConfig: {
        test: "test",
      },
    },
  },
  {
    createdAt: new Date().valueOf(),
    updatedAt: new Date().valueOf(),
    serverConfigData: {
      version: SCHEMA_VERSION,
      name: "Test",
      bindPort: 2001,
      a2sPort: 19999,
      rconPort: 17777,
      bindAddress: "0.0.0.0",
      commandLine: ["-logLevel", "spam"],
      environment: {
        AGENT_DEBUG: "1",
      },
      extraPorts: undefined,
      status: "running",
      reforgerConfig: {
        test: "test",
      },
    },
  },
];

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

function TableLayoutOverview() {
  return <ServerTable servers={servers} />;
}

function GridLayoutOverview() {
  return (
    <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      {servers.map((server) => (
        <ServerCard className="max-w-full" key={server.serverConfigData.id} server={server} />
      ))}
    </div>
  );
}

function DashboardOverviewHeader({
  isGridLayout,
  setIsGridLayout,
}: {
  isGridLayout: boolean;
  setIsGridLayout: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="mb-2 align-middle">
      <div className="flex items-center gap-2">
        <ServerIcon />
        <h1 className="text-2xl">Servers</h1>
        <Badge variant={"outline"}>{servers.length}</Badge>
      </div>

      <div className="flex items-center justify-end">
        <InputGroup className="mr-2 ml-auto max-w-50">
          <InputGroupInput placeholder="Search" />

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

          <Button size={"lg"} variant={"secondary"}>
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

  return (
    <div className="h-full">
      {servers.length > 0 && (
        <DashboardOverviewHeader isGridLayout={isGridLayout} setIsGridLayout={setIsGridLayout} />
      )}
      {servers.length === 0 ? (
        <EmptyOverview />
      ) : isGridLayout ? (
        <>
          <GridLayoutOverview />
        </>
      ) : (
        <>
          <TableLayoutOverview />
        </>
      )}
    </div>
  );
}
