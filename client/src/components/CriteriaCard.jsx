import Button from './Button';

export default function CriteriaCard({ criterion, isDraft, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div className="bg-bg-surface border border-border-card rounded-md px-6 py-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight text-text-primary">
            {criterion.name}
          </h3>
          <p className="text-base text-text-secondary mt-1">
            {criterion.description || (
              <span className="text-text-muted">No description</span>
            )}
          </p>
        </div>

        {isDraft && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label={`Move ${criterion.name} up`}
              className="
                p-2 rounded-sm border border-border-card
                text-text-secondary
                transition-colors duration-base
                hover:bg-bg-page
                focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label={`Move ${criterion.name} down`}
              className="
                p-2 rounded-sm border border-border-card
                text-text-secondary
                transition-colors duration-base
                hover:bg-bg-page
                focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <Button variant="secondary" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
