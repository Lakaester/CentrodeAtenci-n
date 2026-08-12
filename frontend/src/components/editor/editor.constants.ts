import type { ToolbarGroup } from "./editor.types";

export const TOOLBAR_GROUPS: ToolbarGroup[] = [
  {
    id: "format",
    actions: ["bold", "italic", "underline"],
  },
  {
    id: "list",
    actions: ["bullet-list", "ordered-list"],
  },
  {
    id: "indent",
    actions: ["outdent", "indent"],
  },
  {
    id: "align",
    actions: ["align-left", "align-center", "align-right", "justify"],
  },
  {
    id: "clear",
    actions: ["clear-format"],
  },
];

export const EXEC_COMMAND_MAP: Record<string, { command: string; value?: string }> = {
  bold: { command: "bold" },
  italic: { command: "italic" },
  underline: { command: "underline" },
  "bullet-list": { command: "insertUnorderedList" },
  "ordered-list": { command: "insertOrderedList" },
  indent: { command: "indent" },
  outdent: { command: "outdent" },
  "align-left": { command: "justifyLeft" },
  "align-center": { command: "justifyCenter" },
  "align-right": { command: "justifyRight" },
  justify: { command: "justifyFull" },
  "clear-format": { command: "removeFormat" },
};
