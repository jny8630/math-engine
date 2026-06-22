import { useEffect, useRef, useState } from 'preact/hooks';
import type { AnswerForm } from '../types';

// Free-response answer input that adapts to the expected answer form.
// Exposes a single string `value` to the parent (the engine's `submit` action
// just needs a string — parseAnswer handles form conversion).

export type AnswerInputProps = {
  form: AnswerForm;
  onSubmit: (value: string) => void;
  // Reset whenever this changes (e.g. on retry, new problem).
  resetKey: string | number;
  autoFocus?: boolean;
};

export function AnswerInput({ form, onSubmit, resetKey, autoFocus = true }: AnswerInputProps) {
  switch (form.kind) {
    case 'fraction':
      return <FractionInput onSubmit={onSubmit} resetKey={resetKey} autoFocus={autoFocus} />;
    case 'decimal':
      return (
        <SingleInput
          onSubmit={onSubmit}
          resetKey={resetKey}
          autoFocus={autoFocus}
          inputMode="decimal"
          placeholder={`number (${form.places} decimal place${form.places === 1 ? '' : 's'})`}
        />
      );
    case 'integer':
      return (
        <SingleInput
          onSubmit={onSubmit}
          resetKey={resetKey}
          autoFocus={autoFocus}
          inputMode="numeric"
          placeholder="whole number"
        />
      );
    case 'currency':
      return (
        <SingleInput
          onSubmit={onSubmit}
          resetKey={resetKey}
          autoFocus={autoFocus}
          inputMode="decimal"
          placeholder="$ amount"
          prefix="$"
        />
      );
  }
}

function SingleInput({
  onSubmit,
  resetKey,
  autoFocus,
  inputMode,
  placeholder,
  prefix,
}: {
  onSubmit: (v: string) => void;
  resetKey: string | number;
  autoFocus?: boolean;
  inputMode: 'numeric' | 'decimal';
  placeholder: string;
  prefix?: string;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue('');
    if (autoFocus) inputRef.current?.focus();
  }, [resetKey, autoFocus]);

  function submit(e: Event) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(prefix ? `${prefix}${value}` : value);
  }

  return (
    <form onSubmit={submit} class="answer-form">
      {prefix && <span class="answer-prefix">{prefix}</span>}
      <input
        ref={inputRef}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        autoCorrect="off"
        spellcheck={false}
        placeholder={placeholder}
        value={value}
        onInput={(e) => setValue((e.currentTarget as HTMLInputElement).value)}
        class="answer-input"
      />
      <button type="submit" class="answer-submit" disabled={!value.trim()}>
        Submit
      </button>
    </form>
  );
}

function FractionInput({
  onSubmit,
  resetKey,
  autoFocus,
}: {
  onSubmit: (v: string) => void;
  resetKey: string | number;
  autoFocus?: boolean;
}) {
  const [num, setNum] = useState('');
  const [den, setDen] = useState('');
  const numRef = useRef<HTMLInputElement>(null);
  const denRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNum('');
    setDen('');
    if (autoFocus) numRef.current?.focus();
  }, [resetKey, autoFocus]);

  function submit(e: Event) {
    e.preventDefault();
    if (!num.trim()) return;
    const value = den.trim() ? `${num}/${den}` : num;
    onSubmit(value);
  }

  return (
    <form onSubmit={submit} class="answer-form fraction">
      <input
        ref={numRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="num"
        value={num}
        onInput={(e) => setNum((e.currentTarget as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === '/') {
            e.preventDefault();
            denRef.current?.focus();
          }
        }}
        class="answer-input frac-input"
      />
      <span class="frac-bar">/</span>
      <input
        ref={denRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="den"
        value={den}
        onInput={(e) => setDen((e.currentTarget as HTMLInputElement).value)}
        class="answer-input frac-input"
      />
      <button type="submit" class="answer-submit" disabled={!num.trim()}>
        Submit
      </button>
    </form>
  );
}
