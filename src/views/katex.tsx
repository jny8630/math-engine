import { useLayoutEffect, useRef } from 'preact/hooks';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function Katex({
  source,
  displayMode = false,
}: {
  source: string;
  displayMode?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(source, ref.current, { displayMode, throwOnError: false });
    } catch {
      ref.current.textContent = source;
    }
  }, [source, displayMode]);
  return <span ref={ref} class={displayMode ? 'katex-block' : 'katex-inline'} />;
}

// Render a string with embedded \( ... \) inline math expressions.
export function MathText({ text }: { text: string }) {
  const parts = text.split(/(\\\([\s\S]+?\\\))/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('\\(') && p.endsWith('\\)')) {
          return <Katex key={i} source={p.slice(2, -2)} />;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
