import { TOOLBAR_GROUPS } from "./editor.constants";
import { ToolbarButton } from "./ToolbarButton";
import type { ToolbarAction } from "./editor.types";

interface Props {
  onAction: (action: ToolbarAction) => void;
  activeActions: Set<string>;
}

export function Toolbar({ onAction, activeActions }: Props) {
  return (
    <div className="flex items-center gap-0.5 border-b border-black-10 bg-white px-2 py-1">
      {TOOLBAR_GROUPS.map((group, i) => (
        <div key={group.id} className="flex items-center gap-0.5">
          {i > 0 && <div className="mx-1 h-5 w-px bg-black-10" />}
          {group.actions.map((action) => (
            <ToolbarButton
              key={action}
              action={action}
              active={activeActions.has(action)}
              onClick={() => onAction(action)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
