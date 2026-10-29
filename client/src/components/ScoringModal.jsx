import { useState, useEffect, useRef } from 'react';
import Button from './Button';
import * as scoreService from '../services/scoreService';

export default function ScoringModal({ team, criteria, eventId, onClose, onSuccess }) {
  const modalRef = useRef(null);
  const closeRef = useRef(null);

  const [selections, setSelections] = useState({});
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const allScored = criteria.length > 0 && criteria.every((c) => selections[c.id] != null);

  useEffect(() => {
    const fetchExisting = async () => {
      setIsLoading(true);
      try {
        const data = await scoreService.getScores(eventId, team.id);
        if (data.scores.length > 0) {
          const map = {};
          data.scores.forEach(({ criterionId, value }) => {
            map[criterionId] = value;
          });
          setSelections(map);
          setComment(data.comment || '');
          setIsEditMode(true);
        }
      } catch {
        // no existing scores — start fresh
      } finally {
        setIsLoading(false);
      }
    };

    fetchExisting();
  }, [eventId, team.id]);

  useEffect(() => {
    closeRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const scores = criteria.map((c) => ({ criterionId: c.id, value: selections[c.id] }));

    try {
      await scoreService.putScores(eventId, team.id, {
        scores,
        comment: comment.trim() || null,
      });
      onSuccess(team.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoring-modal-title"
        className="
          bg-bg-surface border border-border-card shadow-md
          w-full sm:max-w-lg mx-0 sm:mx-4
          rounded-t-lg sm:rounded-md
          flex flex-col max-h-[90dvh]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-card shrink-0">
          <h2
            id="scoring-modal-title"
            className="text-xl font-semibold tracking-tight text-text-primary"
          >
            {team.name}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close scoring modal"
            className="
              text-text-muted hover:text-text-primary
              transition-colors duration-base
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
              rounded-sm p-1 -mr-1
            "
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="h-11 w-11 bg-gray-200 rounded-sm" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6" aria-live="polite">
              {criteria.map((criterion) => {
                const selected = selections[criterion.id];
                const isUnscored = selected == null;

                return (
                  <fieldset key={criterion.id}>
                    <legend className="mb-2">
                      <span className="text-base font-semibold text-text-primary">
                        {criterion.name}
                      </span>
                      {criterion.description && (
                        <span className="block text-base text-text-secondary mt-0.5">
                          {criterion.description}
                        </span>
                      )}
                    </legend>

                    <div
                      className={`flex gap-2 ${isUnscored ? 'ring-1 ring-red-200 rounded-sm p-1 -m-1' : ''}`}
                      role="group"
                      aria-label={`Score for ${criterion.name}`}
                    >
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isSelected = selected === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setSelections((prev) => ({ ...prev, [criterion.id]: val }))
                            }
                            aria-pressed={isSelected}
                            aria-label={`${val} out of 5`}
                            className={`
                              min-h-[44px] min-w-[44px] rounded-sm text-md font-medium
                              transition-colors duration-base
                              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                              ${isSelected
                                ? 'bg-accent text-white'
                                : 'bg-transparent border border-border-card text-text-secondary hover:bg-bg-page'
                              }
                            `}
                          >
                            {val}
                          </button>
                        );
                      })}
                      <span className="self-center text-xs text-text-muted ml-1">
                        {selected == null ? 'Select a score' : selected === 1 ? 'Lowest' : selected === 5 ? 'Highest' : ''}
                      </span>
                    </div>
                  </fieldset>
                );
              })}

              {/* Comment */}
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="scoring-comment"
                  className="text-xs font-semibold uppercase tracking-[0.06em] text-text-muted"
                >
                  Comment (optional)
                </label>
                <textarea
                  id="scoring-comment"
                  rows={3}
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on this team's demo..."
                  className="
                    bg-bg-input text-text-primary text-base
                    px-3 py-2 rounded-sm
                    border-[1.5px] border-border-input
                    transition-colors duration-fast
                    focus:outline-none focus:border-accent focus:bg-bg-surface
                    placeholder:text-text-muted
                    resize-none
                  "
                />
                {comment.length > 800 && (
                  <p className="text-xs text-text-muted text-right">
                    {comment.length} / 1000
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-border-card shrink-0">
          {error && (
            <p className="text-sm text-red-500 mb-4" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!allScored || isLoading}
              isLoading={isSubmitting}
            >
              {isEditMode ? 'Update Scores' : 'Submit Scores'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
