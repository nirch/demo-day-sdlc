export default function TextArea({ label, error, id, ...props }) {
  const textareaId = id || props.name;
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={textareaId}
        className="text-xs font-semibold uppercase tracking-[0.06em] text-text-muted"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`
          bg-bg-input text-text-primary text-lg font-medium
          px-3 py-2 rounded-sm
          border-[1.5px]
          transition-colors duration-fast
          focus:outline-none focus:border-accent focus:bg-bg-surface
          placeholder:text-text-muted
          resize-y min-h-[80px]
          ${error ? 'border-red-400 focus:border-red-500' : 'border-border-input'}
        `}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
