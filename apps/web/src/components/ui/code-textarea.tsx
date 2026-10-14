import { Editor } from "@sugar-high/react";
import { vscode } from "@sugar-high/react/themes";
import type React from "react";

import { useTheme } from "@/hooks/providers/theme-provider";
import { cn } from "@/lib/utils";

type CodeTextAreaProps = {
  value: string;
  lang: "json" | "plaintext";
  title?: string;
  disabled?: boolean;
  error?: boolean;
  minHeight?: string;
  maxHeight?: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"div">, "onChange">;

export function CodeTextArea({
  value,
  lang,
  title,
  disabled = false,
  error = false,
  minHeight = "200px",
  maxHeight = "400px",
  onChange,
  className,
  style,
  ...props
}: CodeTextAreaProps) {
  const theme = useTheme();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input shadow-sm",
        "focus-within:ring-1 focus-within:ring-ring",
        error && "border-destructive focus-within:ring-destructive",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      style={{
        minHeight,
        maxHeight,
        height: maxHeight ? undefined : minHeight,
        ...style,
      }}
      {...props}
    >
      <Editor
        lang={lang}
        value={value}
        title={title}
        onChange={onChange}
        lineNumbers={true}
        controls={false}
        theme={vscode}
        fontSize="12px"
        style={{
          colorScheme: theme.theme,
          minHeight: "100%",
          maxHeight: "100%",
        }}
        textareaProps={{
          disabled,
          spellCheck: false,
          autoCapitalize: "off",
          autoComplete: "off",
          autoCorrect: "off",
        }}
      />
    </div>
  );
}
