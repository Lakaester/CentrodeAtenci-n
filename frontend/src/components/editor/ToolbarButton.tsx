import { Bold, Italic, Underline, List, ListOrdered, IndentIncrease, IndentDecrease, AlignLeft, AlignCenter, AlignRight, AlignJustify, RemoveFormatting } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolbarAction } from "./editor.types";

interface Props {
  action: ToolbarAction;
  active?: boolean;
  onClick: () => void;
}

const ICONS: Record<ToolbarAction, typeof Bold> = {
  bold: Bold,
  italic: Italic,
  underline: Underline,
  "bullet-list": List,
  "ordered-list": ListOrdered,
  indent: IndentIncrease,
  outdent: IndentDecrease,
  "align-left": AlignLeft,
  "align-center": AlignCenter,
  "align-right": AlignRight,
  justify: AlignJustify,
  "clear-format": RemoveFormatting,
};

const LABELS: Record<ToolbarAction, string> = {
  bold: "Negrita",
  italic: "Cursiva",
  underline: "Subrayado",
  "bullet-list": "Lista con viñetas",
  "ordered-list": "Lista numerada",
  indent: "Aumentar sangría",
  outdent: "Disminuir sangría",
  "align-left": "Alinear izquierda",
  "align-center": "Centrar",
  "align-right": "Alinear derecha",
  justify: "Justificar",
  "clear-format": "Limpiar formato",
};

export function ToolbarButton({ action, active, onClick }: Props) {
  const Icon = ICONS[action];

  return (
    <button
      type="button"
      onClick={onClick}
      title={LABELS[action]}
      aria-label={LABELS[action]}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-black-45 transition-colors hover:bg-black-5 hover:text-black-85",
        active && "bg-[#E0F2FE] text-primary",
      )}
    >
      <Icon size={14} />
    </button>
  );
}
