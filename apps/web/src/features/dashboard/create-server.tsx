import { useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  ChevronRightIcon,
  FormIcon,
  ListIcon,
  LogsIcon,
  ServerPlusIcon,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CreateServerForm } from "@/features/dashboard/components/create-server-form";
import { ServerCreationProgress } from "@/features/dashboard/components/server-creation-progress";
import { ServerProperties } from "@/features/dashboard/components/server-properties";
import { useServers } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";

type Steps = "form" | "logs" | "result";
const stepOrder: Steps[] = ["form", "logs", "result"];

function StepButton({
  currentStep,
  disabled,
  onClick,
  className,
  children,
  ...props
}: { currentStep?: Steps } & React.ComponentProps<"button">) {
  return (
    <Button
      className={cn(
        "flex flex-row items-center gap-2",
        "px-3 py-8",
        currentStep ? "bg-primary hover:dark:bg-primary/50!" : undefined,
        !disabled ? "text-secondary dark:text-primary-foreground" : undefined,
        className,
      )}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}

function CreateServerHeader() {
  return (
    <div className="flex align-middle">
      <div className="flex items-center gap-2">
        <ServerPlusIcon />
        <span className="text-bold text-2xl">Create a Server</span>
      </div>
    </div>
  );
}

function CreatedServerDetails({ id }: { id: string }) {
  const { data: servers, isPending } = useServers(0, 100);
  const server = servers?.data.find((item) => item.serverConfigData.id === id);

  return (
    <>
      <div className="mt-4 mb-6 flex flex-row items-center gap-4">
        <ListIcon />
        <div className="flex flex-col items-start">
          <span className="text-xl">Created Server Details</span>
          <div className="text-muted-foreground text-sm">
            {server?.serverConfigData.name ??
              (isPending ? "Loading server details..." : "Server details unavailable.")}
          </div>
        </div>
      </div>

      {server && <ServerProperties config={server.serverConfigData} />}
    </>
  );
}

export function CreateServer() {
  const [step, setStep] = useState<Steps>("form");
  const [createdServerId, setCreatedServerId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const setIsCreatingRef = useRef(setIsCreating);
  const setIsDoneRef = useRef(setIsDone);
  const setIsSuccessfulRef = useRef(setIsSuccessful);

  const navigate = useNavigate();

  useEffect(() => {
    setIsCreatingRef.current = setIsCreating;
    setIsDoneRef.current = setIsDone;
    setIsSuccessfulRef.current = setIsSuccessful;
  }, []);

  const handleCreationStarted = useCallback((id: string) => {
    if (!id) {
      return;
    }

    setCreatedServerId(id);
    setIsCreatingRef.current(true);
    setStep("logs");
  }, []);

  const handleSetIsCreating = useCallback((value: boolean) => {
    setIsCreatingRef.current(value);
  }, []);

  const handleSetIsDone = useCallback((value: boolean) => {
    setIsDoneRef.current(value);
  }, []);

  const handleSetIsSuccessful = useCallback((value: boolean) => {
    setIsSuccessfulRef.current(value);
  }, []);

  const isStepDisabled = (targetStep: Steps) => {
    const currentIndex = stepOrder.indexOf(step);
    const targetIndex = stepOrder.indexOf(targetStep);
    return currentIndex !== targetIndex;
  };

  const handleNext = () => {
    if (step === "result") {
      navigate({
        from: "/servers/create",
        to: "/",
      });

      return;
    }

    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > stepOrder.length - 1) {
      return;
    }

    setStep(stepOrder[currentIndex + 1]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CreateServerHeader />

      <div className="bg-secondary dark:bg-card mt-4 flex min-h-0 w-full flex-1 flex-col rounded-md p-4 md:mx-auto md:w-[98%] lg:w-[80%] xl:w-[70%]">
        <Progress
          value={(stepOrder.indexOf(step) * 100) / (stepOrder.length - 1)}
          className="mb-2 w-full"
        />

        <div className="mb-4 flex flex-col gap-2">
          <div className="mx-auto flex flex-col items-center sm:flex-row">
            <StepButton
              currentStep={step === "form" ? step : undefined}
              disabled={isStepDisabled("form")}
              onClick={() => setStep("form")}
              className="w-full md:w-fit"
            >
              <FormIcon className="size-8" />
              <div className="flex flex-col items-start">
                <span className="text-md">Server Configuration</span>
                <span
                  className={cn(
                    !isStepDisabled("form")
                      ? "text-muted/50 dark:text-muted-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  IP address, name, bind port, mods...
                </span>
              </div>
            </StepButton>

            <ChevronRightIcon className="rotate-90 md:-rotate-0" />

            <StepButton
              currentStep={step === "logs" ? step : undefined}
              disabled={isStepDisabled("logs")}
              onClick={() => setStep("logs")}
              className="w-full md:w-fit"
            >
              <LogsIcon className="size-8" />
              <div className="flex flex-col items-start">
                <span className="text-md">Creation Progress</span>
                <span
                  className={cn(
                    !isStepDisabled("logs")
                      ? "text-muted/50 dark:text-muted-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Docker container creation process
                </span>
              </div>
            </StepButton>

            <ChevronRightIcon className="rotate-90 md:-rotate-0" />

            <StepButton
              currentStep={step === "result" ? step : undefined}
              disabled={isStepDisabled("result")}
              onClick={() => setStep("result")}
              className="w-full md:w-fit"
            >
              <CheckIcon className="size-8" />
              <div className="flex flex-col items-start">
                <span className="text-md">Server Details</span>
                <span
                  className={cn(
                    !isStepDisabled("result")
                      ? "text-muted/50 dark:text-muted-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Details of the created server
                </span>
              </div>
            </StepButton>
          </div>
        </div>

        <Separator className="" />

        <div className="flex min-h-0 flex-1 flex-col">
          {step === "form" ? (
            <CreateServerForm onCreationRequested={handleCreationStarted} />
          ) : step === "logs" ? (
            <ServerCreationProgress
              id={createdServerId}
              isCreating={isCreating}
              isDone={isDone}
              onSetIsCreating={handleSetIsCreating}
              onSetIsDone={handleSetIsDone}
              onSetIsSuccessful={handleSetIsSuccessful}
            />
          ) : (
            <CreatedServerDetails id={createdServerId} />
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="reset"
              form="create-server-form"
              variant="secondary"
              disabled={step !== "form"}
            >
              Reset
            </Button>

            {step === "form" ? (
              <Button type="submit" form="create-server-form">
                Submit
              </Button>
            ) : isDone && !isSuccessful ? (
              <Button onClick={() => navigate({ from: "/servers/create", to: "/" })}>
                Go Back
              </Button>
            ) : (
              <Button disabled={isCreating || !isSuccessful} onClick={handleNext}>
                {step === "result" ? "Done" : "Next"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
