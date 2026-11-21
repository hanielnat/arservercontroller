import {
  ComputerIcon,
  ContainerIcon,
  CircleHelpIcon,
  MoonIcon,
  PaintbrushIcon,
  RefreshCwIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/hooks/providers/settings-provider";
import { useTheme } from "@/hooks/providers/theme-provider";
import { cn } from "@/lib/utils";

function SettingsPageHeader({ className }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex w-full items-center gap-2 text-xl font-medium", className)}>
      <Settings2Icon className="size-5 shrink-0" />
      <h1>Settings</h1>
    </div>
  );
}

function SettingTabHeader({
  Icon,
  title,
  description,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-1">
      <Icon size={16} className="mt-0.5 text-muted-foreground" />
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="mt-0.5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SettingRow({
  id,
  label,
  description,
  control,
}: {
  id: string;
  label: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <li
      className="
        grid gap-3 border-b py-4
        last:border-b-0 last:pb-0
        sm:grid-cols-[minmax(10rem,1fr)_minmax(12rem,20rem)] sm:items-center
      "
    >
      <div>
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      <div className="sm:justify-self-end">{control}</div>
    </li>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { settings, setSettings } = useSettings();

  return (
    <div>
      <SettingsPageHeader className="mb-4" />

      <Card>
        <Tabs defaultValue="interface" className="min-h-96 px-4 pt-2">
          <TabsList variant="line" className="no-scrollbar justify-start overflow-x-auto">
            <TabsTrigger value="interface">
              <PaintbrushIcon />
              Interface
            </TabsTrigger>

            <TabsTrigger value="queries">
              <RefreshCwIcon />
              Queries
            </TabsTrigger>

            <TabsTrigger value="docker">
              <ContainerIcon />
              Docker <Badge variant="ghost">WIP</Badge>
            </TabsTrigger>

            <TabsTrigger value="misc">
              <SlidersHorizontalIcon />
              Misc <Badge variant="ghost">WIP</Badge>
            </TabsTrigger>

            <TabsTrigger value="about">
              <CircleHelpIcon />
              About
            </TabsTrigger>
          </TabsList>

          <Separator className="mb-4 bg-card" />

          <TabsContent value="interface">
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              <SettingTabHeader
                Icon={PaintbrushIcon}
                title="Interface"
                description="Customize the appearance and server overview."
              />

              <ul>
                <SettingRow
                  id="theme"
                  label="Theme"
                  description="Choose the appearance used by the dashboard."
                  control={
                    <Select
                      items={[
                        { label: "Dark", value: "dark" },
                        { label: "Light", value: "light" },
                        { label: "System", value: "system" },
                      ]}
                      value={theme}
                      onValueChange={(value) => {
                        if (value) {
                          setTheme(value);
                        }
                      }}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue>
                          {theme === "dark" && <MoonIcon />}
                          {theme === "light" && <SunIcon />}
                          {theme === "system" && <ComputerIcon />}
                          {theme[0].toUpperCase() + theme.slice(1)}
                        </SelectValue>
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="dark">
                          <MoonIcon />
                          Dark
                        </SelectItem>

                        <SelectItem value="light">
                          <SunIcon />
                          Light
                        </SelectItem>

                        <SelectItem value="system">
                          <ComputerIcon />
                          System
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />

                <SettingRow
                  id="sort-by"
                  label="Sort servers by"
                  description="Choose the field used to order the server overview."
                  control={
                    <Select
                      items={[
                        { label: "Name", value: "name" },
                        { label: "Updated", value: "updated" },
                        { label: "Created", value: "created" },
                      ]}
                      value={settings.interface.sortBy}
                      onValueChange={(value) => {
                        if (value) {
                          setSettings((current) => ({
                            ...current,
                            interface: {
                              ...current.interface,
                              sortBy: value,
                            },
                          }));
                        }
                      }}
                    >
                      <SelectTrigger id="sort-by">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>

                        <SelectItem value="updated">Updated</SelectItem>

                        <SelectItem value="created">Created</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />

                <SettingRow
                  id="input-sort-order"
                  label="Descending sort order"
                  description="Reverse the selected server sort order."
                  control={
                    <Switch
                      id="input-sort-order"
                      checked={settings.interface.sortOrder === "descending"}
                      onCheckedChange={(checked) => {
                        const value = checked ? "descending" : "ascending";
                        setSettings((current) => ({
                          ...current,
                          interface: {
                            ...current.interface,
                            sortOrder: value,
                          },
                        }));
                      }}
                    />
                  }
                />

                <SettingRow
                  id="input-groupby"
                  label="Group by status"
                  description="Separate servers into status groups in the overview."
                  control={
                    <Switch
                      id="input-groupby"
                      checked={settings.interface.groupBy !== ""}
                      onCheckedChange={(checked) => {
                        const value = checked ? "status" : "";
                        setSettings((current) => ({
                          ...current,
                          interface: {
                            ...current.interface,
                            groupBy: value,
                          },
                        }));
                      }}
                    />
                  }
                />
              </ul>
            </CardContent>
          </TabsContent>

          <TabsContent value="queries">
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              <SettingTabHeader
                Icon={RefreshCwIcon}
                title="Queries"
                description="Control how often running server information is refreshed."
              />

              <ul>
                <SettingRow
                  id="input-polling"
                  label="Enable polling"
                  description="Periodically refresh running server status in the sidebar."
                  control={
                    <Switch
                      id="input-polling"
                      checked={settings.queries.pollingEnabled}
                      onCheckedChange={(checked) => {
                        setSettings((current) => ({
                          ...current,
                          queries: {
                            ...current.queries,
                            pollingEnabled: checked,
                          },
                        }));
                      }}
                    />
                  }
                />

                <SettingRow
                  id="polling-interval"
                  label="Polling interval"
                  description="Choose how often running server status is refreshed."
                  control={
                    <Select
                      items={[
                        { label: "5 seconds", value: 5000 },
                        { label: "10 seconds", value: 10000 },
                        { label: "30 seconds", value: 30000 },
                      ]}
                      value={settings.queries.pollingInterval}
                      disabled={!settings.queries.pollingEnabled}
                      onValueChange={(value) => {
                        if (typeof value === "number") {
                          setSettings((current) => ({
                            ...current,
                            queries: {
                              ...current.queries,
                              pollingInterval: value,
                            },
                          }));
                        }
                      }}
                    >
                      <SelectTrigger id="polling-interval">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={5000}>5 seconds</SelectItem>

                        <SelectItem value={10000}>10 seconds</SelectItem>

                        <SelectItem value={30000}>30 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
              </ul>
            </CardContent>
          </TabsContent>

          <TabsContent value="docker">
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              <SettingTabHeader
                Icon={ContainerIcon}
                title="Docker"
                description="Docker settings will be available in a future update."
              />

              <p className="text-muted-foreground">No Docker options need configuration yet.</p>
            </CardContent>
          </TabsContent>

          <TabsContent value="misc">
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              <SettingTabHeader
                Icon={SlidersHorizontalIcon}
                title="Miscellaneous"
                description="Additional dashboard preferences will appear here."
              />

              <p className="text-muted-foreground">No additional settings are available yet.</p>
            </CardContent>
          </TabsContent>

          <TabsContent value="about">
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              <SettingTabHeader
                Icon={CircleHelpIcon}
                title="About"
                description="Information about this ARServerController installation."
              />

              <p className="text-muted-foreground">ARServerController dashboard.</p>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
