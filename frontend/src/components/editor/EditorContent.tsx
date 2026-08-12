import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Props {
  html: string;
  onChange: (html: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  onSelect?: () => void;
}

export function EditorContent({
  html,
  onChange,
  onKeyDown,
  onSelect,
  placeholder = "Escriba su respuesta...",
  disabled,
  minHeight = 120,
  maxHeight = 360,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prevHtmlRef = useRef(html);

  const updateHeight = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const h = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${h}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [minHeight, maxHeight]);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
  }, [html]);

  useEffect(() => {
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [html, updateHeight]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = () => onSelect?.();
    el.addEventListener("keyup", handle);
    el.addEventListener("mouseup", handle);
    return () => {
      el.removeEventListener("keyup", handle);
      el.removeEventListener("mouseup", handle);
    };
  }, [onSelect]);

  const handleInput = () => {
    if (!ref.current) return;
    const content = ref.current.innerHTML;
    if (content !== prevHtmlRef.current) {
      prevHtmlRef.current = content;
      onChange(content);
    }
    updateHeight();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  };

  return (
    <div
      ref={ref}
      contentEditable={!disabled}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Editor de respuesta"
      data-placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={onKeyDown}
      onPaste={handlePaste}
      className={cn(
        "w-full overflow-hidden px-4 py-3 text-sm leading-relaxed text-black-85 outline-none transition-colors",
        "empty:before:pointer-events-none empty:before:text-black-25 empty:before:content-[attr(data-placeholder)]",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      style={{ minHeight, maxHeight, fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.6 }}
    />
  );
}
