import Button from './Button';

export default function TeamCard({ team, isDraft, onEdit, onDelete, isJudge, hasScored, onScore, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="bg-bg-surface border border-border-card rounded-md px-6 py-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-semibold tracking-tight text-text-primary">
              {team.name}
            </h3>
            {isJudge && hasScored && (
              <span className="inline-flex items-center gap-1 bg-accent-subtle text-accent text-xs font-medium px-2 py-0.5 rounded-pill">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Scored
              </span>
            )}
          </div>
          <p className="text-base text-text-secondary mt-1 whitespace-pre-line">
            {team.members}
          </p>

          {(team.demo_presentation_url || team.live_app_url) && (
            <div className="flex flex-wrap gap-3 mt-3">
              {team.demo_presentation_url && (
                <a
                  href={team.demo_presentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-sm font-medium text-accent
                    hover:opacity-80 transition-opacity duration-base
                    focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                    rounded-sm inline-flex items-center gap-1
                  "
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Presentation
                </a>
              )}
              {team.live_app_url && (
                <a
                  href={team.live_app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-sm font-medium text-accent
                    hover:opacity-80 transition-opacity duration-base
                    focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                    rounded-sm inline-flex items-center gap-1
                  "
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Live App
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {isDraft && (
            <>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label={`Move ${team.name} up`}
                className="p-2 rounded-sm border border-border-card transition-colors duration-base hover:bg-bg-page focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ visibility: isFirst ? 'hidden' : 'visible' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                aria-label={`Move ${team.name} down`}
                className="p-2 rounded-sm border border-border-card transition-colors duration-base hover:bg-bg-page focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ visibility: isLast ? 'hidden' : 'visible' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </>
          )}
          {isJudge && (
            <Button variant={hasScored ? 'secondary' : 'primary'} onClick={onScore}>
              {hasScored ? 'Edit Scores' : 'Score Team'}
            </Button>
          )}
          {isDraft && (
            <>
              <Button variant="secondary" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="danger" onClick={onDelete}>
                Remove
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
