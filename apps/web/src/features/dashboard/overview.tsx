import { Link } from "@tanstack/react-router";
import {
  ContainerIcon,
  LayoutDashboardIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
} from "lucide-react";

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

export interface MockServer {
  id: string;
  ip: string;
  name: string;
  browserName?: string;
  cpu: number;
  ram: number;
  players: number;
  status: string;
  bindPort: number;
  uptime: number;
}

const uuid = "29a9f1a7-4f55-4b3c-978d-46d698d257bb";
const ip = "127.0.0.1";

let servers: MockServer[] = [
  {
    id: uuid,
    ip: ip,
    name: "Test",
    browserName: "test",
    cpu: 50,
    ram: 4.2,
    players: 1,
    status: "healthy",
    bindPort: 2002,
    uptime: 4,
  },
  {
    id: uuid,
    ip: ip,
    name: "Training Server",
    browserName: "NA-02 Training Server",
    cpu: 23,
    ram: 2.8,
    players: 6,
    status: "healthy",
    bindPort: 2005,
    uptime: 10,
  },
  {
    id: uuid,
    ip: ip,
    name: "Op Server",
    browserName: "NA-01 Public Operations Server",
    cpu: 0,
    ram: 0,
    players: 0,
    status: "stopped",
    bindPort: 2004,
    uptime: 0,
  },
  {
    id: uuid,
    ip: ip,
    name: "test",
    browserName: "testtesttesttesttesttesttesttesttesttest",
    cpu: 100,
    ram: 14.2,
    players: 1,
    status: "healthy",
    bindPort: 2001,
    uptime: 4,
  },
];

export default function DashboardOverview() {
  return (
    <div className="h-full">
      {servers.length === 0 ? (
        <Empty className="h-full border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ContainerIcon />
            </EmptyMedia>

            <EmptyTitle>No Servers Found</EmptyTitle>

            <EmptyDescription>Start by creating your first server.</EmptyDescription>
          </EmptyHeader>

          <EmptyContent>
            <Button variant="outline" size="sm" render={<Link to={"/create-server"} />}>
              Create Server
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
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
                <Button size={"lg"} variant={"secondary"}>
                  <LayoutDashboardIcon />
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

          <div className="my-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {servers.map((server) => (
              <ServerCard className="max-w-full" key={server.id} server={server} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
