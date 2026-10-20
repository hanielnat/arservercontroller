import {
  CheckIcon,
  ChevronRightIcon,
  FormIcon,
  InfoIcon,
  ListIcon,
  LogsIcon,
  ServerPlusIcon,
  TerminalIcon,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { CreateServerForm } from "./components/create-server-form";

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

function CreateServerCreationProgress() {
  return <div>Logs...</div>;
}

export default function CreateServer() {
  const [step, setStep] = useState<Steps>("form");
  const [canProceed, setCanProceed] = useState(true);

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
    <>
      <CreateServerHeader />

      <div className="bg-muted/50 mx-auto w-full flex-1 rounded-md p-4 md:min-h-min">
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

        <div className="flex flex-1 flex-col">
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

              <CreateServerForm></CreateServerForm>
            </>
          ) : step === "logs" ? (
            <>
              <div className="mt-4 mb-6 flex flex-row items-center gap-4">
                <TerminalIcon />
                <div className="flex flex-col items-start">
                  <span className="text-xl">Server Creation Logs</span>
                </div>
              </div>

              <CreateServerCreationProgress />
            </>
          ) : (
            <>
              <div className="mt-4 mb-6 flex flex-row items-center gap-4">
                <ListIcon />
                <div className="flex flex-col items-start">
                  <span className="text-xl">Created Server Details</span>
                  <div className="text-muted-foreground text-sm">See what you created.</div>
                </div>
              </div>

              <div>Details...</div>
            </>
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
    </>
  );
}
