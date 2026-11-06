import { CheckIcon, CircleXIcon, CopyIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function CopyTextButton({
  value,
  onCopy,
  size = "icon",
  variant = "ghost",
  tooltipContent,
  children,
  className,
  ...props
}: {
  value: string;
  onCopy?: React.Dispatch<string>;
  tooltipContent?: React.ReactNode;
} & React.ComponentProps<typeof Button>) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const current = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(current);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch (error) {
      if (error instanceof DOMException) {
        toast.add({
          title: (
            <>
              <CircleXIcon />
              <span>Error copying to clipboard</span>
            </>
          ),
        });
      }

      throw error;
    }

    if (onCopy) {
      onCopy(value);
      return;
    }

    toast.add({
      type: "success",
      title: <span>Copied to clipboard</span>,
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size={size}
            variant={variant}
            onClick={handleCopy}
            className={cn("relative", copied ? "bg-primary!" : undefined, className)}
            {...props}
          >
            <span className="flex items-center justify-center">
              <CopyIcon
                className={cn("absolute transition-all", copied ? "opacity-0" : "opacity-100")}
              />
              <CheckIcon className={cn("transition-all", copied ? "opacity-100" : "opacity-0")} />
            </span>
            {children}
          </Button>
        }
      />

      <TooltipContent>{tooltipContent ? tooltipContent : <p>Copy to clipboard</p>}</TooltipContent>
    </Tooltip>
  );
}
