import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function InputChat() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 200)}px`;
    el.style.overflowY = el.scrollHeight > 200 ? "auto" : "hidden";
  };

  useEffect(() => {
    resize();
  }, [input]);

  return (
    <div className="shrink-0 border-t border-black-10 bg-white p-3">
      <div className="mb-2 flex gap-1.5 overflow-x-auto">
        {["Gracias", "Claro", "Un momento", "Entiendo", "¿Podría confirmar?", "Lo reviso"].map((rta) => (
          <button
            key={rta}
            className="shrink-0 rounded-full border border-black-10 px-2.5 py-1 text-[10px] text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary"
          >
            {rta}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2 rounded-xl border border-black-10 bg-light px-3 py-2">
        <div className="flex shrink-0 items-center gap-1 self-center">
          <button className="text-black-25 transition-colors hover:text-black-45">
            <Paperclip size={15} />
          </button>
          <button className="text-black-25 transition-colors hover:text-black-45">
            <Smile size={15} />
          </button>
          <button className="text-black-25 transition-colors hover:text-black-45">
            <Zap size={15} />
          </button>
          <div className="mx-1 h-5 w-px bg-black-10" />
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escriba un mensaje..."
          rows={1}
          className="flex-1 resize-none overflow-hidden bg-transparent text-sm leading-relaxed text-black-85 outline-none placeholder:text-black-25"
          style={{ minHeight: 44, maxHeight: 200 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              e.preventDefault();
              if (input.trim()) {
                setInput("");
              }
            }
          }}
        />
        <button
          disabled={!input.trim()}
          className={cn(
            "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
            input.trim()
              ? "bg-primary text-white hover:bg-primary-85"
              : "bg-black-10 text-black-25",
          )}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
