import { useRef, useEffect, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
  maxHeight?: number;
}

export function AutoResizeTextarea({
  className,
  minHeight = 120,
  maxHeight = 320,
  onChange,
  value,
  ...props
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        resize();
        onChange?.(e);
      }}
      className={cn(
        "w-full resize-none overflow-hidden rounded border border-black-10 bg-white px-4 py-3 text-sm leading-relaxed text-black-85 placeholder:text-black-25 outline-none transition-colors focus:border-primary",
        className,
      )}
      style={{ minHeight, maxHeight }}
      {...props}
    />
  );
}
