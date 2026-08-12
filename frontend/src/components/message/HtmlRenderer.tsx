import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Remove HTML attributes that force fixed widths on container elements */
function normalizeHtml(html: string): string {
  let result = html
    // Remove width="NUM" (tables, tds, divs, imgs, etc.)
    .replace(/\s+width="\d+"/gi, "")
    // Remove height="NUM" (preserve aspect ratio)
    .replace(/\s+height="\d+"/gi, "")
    // Remove max-width from inline style
    .replace(/max-width\s*:\s*\d+px\s*;?/gi, "")
    // Remove min-width from inline style
    .replace(/min-width\s*:\s*\d+px\s*;?/gi, "")
    // Override style width to 100%
    .replace(/style="([^"]*)width\s*:\s*\d+px([^"]*)"/gi, 'style="$1"');
  return result;
}

interface Props {
  html: string;
  className?: string;
}

export function HtmlRenderer({ html, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(100);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Pre-process HTML to remove fixed width constraints
    const cleanHtml = normalizeHtml(html);

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          body > table,
          body > div,
          body > center {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
          }
          td, th {
            word-break: break-word;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          * {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        </style>
      </head>
      <body>${cleanHtml}</body>
      </html>
    `);
    doc.close();

    const resize = () => {
      const h = doc.body?.scrollHeight ?? 100;
      setHeight(h + 20);
    };

    const images = doc.querySelectorAll("img");
    let loaded = 0;
    const total = images.length;

    if (total === 0) {
      resize();
    } else {
      images.forEach((img) => {
        if (img.complete) {
          loaded++;
          if (loaded === total) resize();
        } else {
          img.onload = () => { loaded++; if (loaded === total) resize(); };
          img.onerror = () => { loaded++; if (loaded === total) resize(); };
        }
      });
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="HTML content"
      className={cn("w-full overflow-hidden rounded border-0 bg-transparent", className)}
      style={{ height: `${height}px`, maxWidth: "100%" }}
      sandbox="allow-same-origin"
      scrolling="no"
    />
  );
}
