import { CheckIcon, PauseIcon, PlayIcon, RotateCcwIcon, Trash2Icon, XIcon } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useIsServerActionPending,
  useRemoveServer,
  useServerAction,
} from "@/hooks/use-server-mutation";
import { cn } from "@/lib/utils";
import type { ServerAction } from "@/types/server";

function ConfirmActionButton({
  children = "Confirm",
  variant = "default",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <PopoverClose
      render={
        <Button variant={variant} {...props}>
          <CheckIcon />
          {children}
        </Button>
      }
    />
  );
}

function CancelActionButton({
  children = "Cancel",
  variant = "secondary",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <PopoverClose
      render={
        <Button variant={variant} {...props}>
          <XIcon />
          {children}
        </Button>
      }
    />
  );
}

export function ServerActionDelete({
  id,
  onDelete,
  size,
  variant,
  className,
  children,
  ...props
}: {
  id: string;
  onDelete?: () => void;
} & React.ComponentProps<typeof Button>) {
  const [force, setForce] = React.useState(true);
  const removeAction = useRemoveServer();

  const handleDelete = () => {
    removeAction.mutate({ id, force });
    if (!onDelete) {
      return;
    }

    onDelete();
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size={size}
            variant={!variant ? "destructive" : variant}
            className={cn(className)}
            {...props}
          >
            {removeAction.isPending && !removeAction.isError ? (
              <Spinner />
            ) : (
              <React.Fragment>
                <Trash2Icon />
                {children}
              </React.Fragment>
            )}
          </Button>
        }
      />

      <PopoverContent className="flex w-fit flex-col items-center gap-1">
        <span className="flex flex-row items-center gap-4">
          <span>
            Really delete <code>{id.slice(0, 8)}</code>?
          </span>

          <span className="flex items-center gap-1">
            <Checkbox
              name="input-force"
              checked={force}
              onCheckedChange={() => setForce((prev) => !prev)}
            />
            <Label htmlFor="input-force">Force</Label>
          </span>
        </span>

        <ConfirmActionButton onClick={handleDelete} className="w-full" variant="destructive" />
        <CancelActionButton className="w-full" />
      </PopoverContent>
    </Popover>
  );
}

export function ServerActions({
  id,
  className,
  ...props
}: {
  id: string;
} & React.ComponentProps<typeof ButtonGroup>) {
  const isMobile = useIsMobile();

  const serverAction = useServerAction();

  const isStartPending = useIsServerActionPending(id, "start");
  const isStopPending = useIsServerActionPending(id, "stop");
  const isRestartPending = useIsServerActionPending(id, "restart");
  const hasActionPending = useIsServerActionPending(id);

  const handleAction = (action: ServerAction) => serverAction.mutate({ id, action });

  return (
    <ButtonGroup className={cn("transition-all shrink-0", className)} {...props}>
      <Button
        size={isMobile ? "icon" : "default"}
        variant="success"
        disabled={hasActionPending}
        onClick={() => handleAction("start")}
      >
        {isStartPending ? (
          <Spinner />
        ) : isMobile ? (
          <PlayIcon />
        ) : (
          <span className="flex flex-row items-center gap-1">
            <PlayIcon />
            Start
          </span>
        )}
      </Button>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              size={isMobile ? "icon" : "default"}
              variant="secondary"
              disabled={hasActionPending}
            >
              {isStopPending ? (
                <Spinner />
              ) : isMobile ? (
                <PauseIcon />
              ) : (
                <span className="flex flex-row items-center gap-1">
                  <PauseIcon />
                  Stop
                </span>
              )}
            </Button>
          }
        />

        <PopoverContent className="flex w-fit items-center gap-2">
          Really stop?
          <ButtonGroup>
            <ConfirmActionButton size="default" onClick={() => handleAction("stop")} />
            <CancelActionButton size="default" />
          </ButtonGroup>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              size={isMobile ? "icon" : "default"}
              variant="warning"
              disabled={hasActionPending}
            >
              {isRestartPending ? (
                <Spinner />
              ) : isMobile ? (
                <RotateCcwIcon />
              ) : (
                <span className="flex flex-row items-center gap-1">
                  <RotateCcwIcon />
                  Restart
                </span>
              )}
            </Button>
          }
        />

        <PopoverContent className="flex w-fit items-center gap-2">
          Really restart?
          <ButtonGroup>
            <ConfirmActionButton size="default" onClick={() => handleAction("restart")} />
            <CancelActionButton size="default" />
          </ButtonGroup>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  );
}
