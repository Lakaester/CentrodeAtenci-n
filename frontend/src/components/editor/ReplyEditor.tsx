import { useState, useCallback } from "react";
import { Toolbar } from "./Toolbar";
import { EditorContent } from "./EditorContent";
import { EXEC_COMMAND_MAP } from "./editor.constants";
import type { ToolbarAction } from "./editor.types";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onSend?: () => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

function queryActiveFormats(): Set<string> {
  const active = new Set<string>();
  const fmt = (name: string) => {
    try { return document.queryCommandState(name); } catch { return false; }
  };
  if (fmt("bold")) active.add("bold");
  if (fmt("italic")) active.add("italic");
  if (fmt("underline")) active.add("underline");
  if (fmt("insertUnorderedList")) active.add("bullet-list");
  if (fmt("insertOrderedList")) active.add("ordered-list");
  if (fmt("justifyLeft")) active.add("align-left");
  if (fmt("justifyCenter")) active.add("align-center");
  if (fmt("justifyRight")) active.add("align-right");
  if (fmt("justifyFull")) active.add("justify");
  return active;
}

export function ReplyEditor({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  minHeight = 120,
  maxHeight = 360,
  className,
}: Props) {
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());

  const handleAction = useCallback(
    (action: ToolbarAction) => {
      const sel = window.getSelection();
      const hadRange = sel && sel.rangeCount > 0;
      const cmd = EXEC_COMMAND_MAP[action];
      if (!cmd) return;
      document.execCommand(cmd.command, false, cmd.value);
      if (hadRange) {
        const el = sel?.focusNode?.parentElement?.closest("[contenteditable]") as HTMLElement | null;
        if (el) onChange(el.innerHTML);
      }
      setActiveActions(queryActiveFormats());
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      setActiveActions(queryActiveFormats());
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSend?.();
      }
    },
    [onSend],
  );

  return (
    <div
      className={`overflow-hidden rounded border border-black-10 bg-white transition-colors focus-within:border-primary ${className ?? ""}`}
    >
      <Toolbar onAction={handleAction} activeActions={activeActions} />
      <EditorContent
        html={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onSelect={() => setActiveActions(queryActiveFormats())}
        placeholder={placeholder}
        disabled={disabled}
        minHeight={minHeight}
        maxHeight={maxHeight}
      />
    </div>
  );
}
