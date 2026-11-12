import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import CodeMirror, {
  EditorView,
  type BasicSetupOptions,
  type Extension,
} from "@uiw/react-codemirror";
import type React from "react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

type CodeTextAreaProps = {
  value: string;
  lang: "json" | "plaintext";
  title?: string;
  wrapLines?: boolean;
  disabled?: boolean;
  error?: boolean;
  height?: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"div">, "onChange">;

export function CodeTextArea({
  value,
  lang,
  title,
  wrapLines,
  disabled = false,
  error = false,
  height = "100%",
  onChange,
  className,
  ...props
}: CodeTextAreaProps) {
  const extensions: Extension[] = useMemo(() => {
    let result = [];

    if (lang === "json") {
      result.push(json());
    }

    if (wrapLines) {
      result.push(EditorView.lineWrapping);
    }

    return result;
  }, [lang, wrapLines]);

  const basicSetup: BasicSetupOptions = {
    lineNumbers: true,
    foldGutter: false,
    closeBrackets: true,
    highlightSpecialChars: true,
  };

  return (
    <div
      title={title}
      className={cn(
        "h-full min-h-0 overflow-hidden rounded-md border border-input shadow-sm",
        "focus-within:ring-1 focus-within:ring-ring",
        error && "border-destructive focus-within:ring-destructive",
        className,
      )}
      {...props}
    >
      <CodeMirror
        extensions={extensions}
        value={value}
        theme={vscodeDark}
        editable={!disabled}
        basicSetup={basicSetup}
        onChange={onChange}
        height={height}
        className="h-full min-h-0 flex-1 overflow-auto [&_.cm-editor]:h-full"
      />
    </div>
  );
}
