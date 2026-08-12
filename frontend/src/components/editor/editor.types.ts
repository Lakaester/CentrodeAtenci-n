export type ToolbarAction =
  | "bold"
  | "italic"
  | "underline"
  | "bullet-list"
  | "ordered-list"
  | "indent"
  | "outdent"
  | "align-left"
  | "align-center"
  | "align-right"
  | "justify"
  | "clear-format";

export interface ToolbarGroup {
  id: string;
  actions: ToolbarAction[];
}
