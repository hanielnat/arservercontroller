import {
  CheckIcon,
  ChevronRightIcon,
  FormIcon,
  InfoIcon,
  ListIcon,
  LogsIcon,
  ServerPlusIcon,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CreateServerForm } from "@/features/dashboard/components/create-server-form";
import { ServerCreationProgress } from "@/features/dashboard/components/server-creation-progress";
import { ServerProperties } from "@/features/dashboard/components/server-properties";
import { useServers } from "@/hooks/use-servers";
import { cn } from "@/lib/utils";

type Steps = "form" | "logs" | "result" | "done";
const stepOrder: Steps[] = ["form", "logs", "result", "done"];

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
        currentStep ? "bg-primary" : undefined,
        className,
      )}
      variant="ghost"
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
  const [canProceed, setCanProceed] = useState(true);
  const [createdServerId, setCreatedServerId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const setIsCreatingRef = useRef(setIsCreating);
  const setIsDoneRef = useRef(setIsDone);

  useEffect(() => {
    setIsCreatingRef.current = setIsCreating;
    setIsDoneRef.current = setIsDone;
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

  const handleSetIsDone = useCallback((val: boolean) => {
    setIsDoneRef.current(val);
  }, []);

  const isStepDisabled = (targetStep: Steps) => {
    const currentIndex = stepOrder.indexOf(step);
    const targetIndex = stepOrder.indexOf(targetStep);
    return targetIndex > currentIndex + 1;
  };

  const handleReset = () => {
    setCanProceed(false);
    setStep("form");
  };

  const handleCancel = () => {
    setCanProceed(false);
    setStep("form");
  };

  const handleNext = () => {
    if (step === "done") {
      return;
    }

    if (!canProceed) {
      return;
    }

    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CreateServerHeader />

      <div className="bg-muted/50 mx-auto mt-4 flex min-h-0 w-full flex-1 flex-col rounded-md p-4 md:w-[70%]">
        <Progress value={stepOrder.indexOf(step) * (100 / 3)} className="mx-auto mb-2" />
        <div className="mb-4 flex flex-col gap-2">
          <div className="mx-auto flex flex-col items-center sm:flex-row">
            <StepButton
              currentStep={step === "form" ? step : undefined}
              onClick={() => setStep("form")}
            >
              <FormIcon />
              <div className="flex flex-col items-start">
                <span className="text-md">Server Configuration</span>
                <span className="text-muted-foreground">IP address, name, bind port, mods...</span>
              </div>
            </StepButton>

            <ChevronRightIcon />

            <StepButton
              currentStep={step === "logs" ? step : undefined}
              disabled={isStepDisabled("logs")}
              onClick={() => setStep("logs")}
            >
              <LogsIcon />
              <div className="flex flex-col items-start">
                <span className="text-md">Creation Progress</span>
                <span className="text-muted-foreground">Docker container creation process</span>
              </div>
            </StepButton>

            <ChevronRightIcon />

            <StepButton
              currentStep={step === "result" ? step : undefined}
              disabled={isStepDisabled("result")}
              onClick={() => setStep("result")}
            >
              <CheckIcon />
              <div className="flex flex-col items-start">
                <span className="text-md">Server Details</span>
                <span className="text-muted-foreground">Details of the created server</span>
              </div>
            </StepButton>
          </div>
        </div>

        <Separator className="" />

        <div className="flex min-h-0 flex-1 flex-col">
          {step === "form" ? (
            <>
              <div className="mt-4 mb-6 flex flex-row items-center gap-4">
                <InfoIcon />
                <div className="flex flex-col items-start">
                  <span className="text-xl">Fill in server data</span>
                  <div className="text-muted-foreground text-sm">
                    Define server properties like connection port and display name.
                  </div>
                </div>
              </div>

              <CreateServerForm onCreationRequested={handleCreationStarted} />
            </>
          ) : step === "logs" ? (
            <ServerCreationProgress
              id={createdServerId}
              isCreating={isCreating}
              isDone={isDone}
              onSetIsCreating={handleSetIsCreating}
              onSetIsDone={handleSetIsDone}
            />
          ) : (
            <CreatedServerDetails id={createdServerId} />
          )}

          <div className="mt-4 flex justify-end">
            <ButtonGroup className="">
              <Button variant="secondary" disabled={step !== "form"} onClick={handleReset}>
                Reset
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Cancel
              </Button>

              {step === "form" ? (
                <Button type="submit" form="create-server-form">
                  Submit
                </Button>
              ) : (
                <Button disabled={step === "done"} onClick={handleNext}>
                  {step !== "done" ? "Next" : "Done"}
                </Button>
              )}
            </ButtonGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
