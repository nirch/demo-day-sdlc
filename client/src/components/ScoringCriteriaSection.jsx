import { useState, useEffect, useCallback } from 'react';
import * as criteriaService from '../services/criteriaService';
import CriteriaCard from './CriteriaCard';
import CriteriaForm from './CriteriaForm';
import ConfirmDialog from './ConfirmDialog';
import Button from './Button';

export default function ScoringCriteriaSection({ eventId, eventStatus }) {
  const [criteria, setCriteria] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCriterionId, setEditingCriterionId] = useState(null);
  const [deletingCriterion, setDeletingCriterion] = useState(null);
  const [actionError, setActionError] = useState(null);

  const isDraft = eventStatus === 'draft';

  const fetchCriteria = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await criteriaService.getCriteria(eventId);
      setCriteria(data);
    } catch {
      setFetchError('Couldn\u2019t load scoring criteria.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const handleAddSave = async (values) => {
    setActionError(null);
    await criteriaService.createCriterion(eventId, values);
    setShowAddForm(false);
    await fetchCriteria();
  };

  const handleEditSave = async (values) => {
    setActionError(null);
    await criteriaService.updateCriterion(eventId, editingCriterionId, values);
    setEditingCriterionId(null);
    await fetchCriteria();
  };

  const handleDeleteConfirm = async () => {
    setActionError(null);
    try {
      await criteriaService.deleteCriterion(eventId, deletingCriterion.id);
      setDeletingCriterion(null);
      await fetchCriteria();
    } catch (err) {
      setDeletingCriterion(null);
      const msg = err.response?.data?.error || 'Failed to delete criterion.';
      setActionError(msg);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const reordered = [...criteria];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    setCriteria(reordered);
    const orderedIds = reordered.map((c) => c.id);
    try {
      await criteriaService.reorderCriteria(eventId, orderedIds);
    } catch {
      await fetchCriteria();
    }
  };

  const handleMoveDown = async (index) => {
    if (index === criteria.length - 1) return;
    const reordered = [...criteria];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    setCriteria(reordered);
    const orderedIds = reordered.map((c) => c.id);
    try {
      await criteriaService.reorderCriteria(eventId, orderedIds);
    } catch {
      await fetchCriteria();
    }
  };

  if (isLoading) {
    return (
      <section className="mt-8" aria-label="Scoring Criteria">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-surface border border-border-card rounded-md px-6 py-5 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (fetchError) {
    return (
      <section className="mt-8" aria-label="Scoring Criteria">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary mb-4">
          Scoring Criteria
        </h2>
        <div className="text-center py-8">
          <p className="text-base text-text-secondary mb-4">{fetchError}</p>
          <Button variant="secondary" onClick={fetchCriteria}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-label="Scoring Criteria">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          Scoring Criteria ({criteria.length})
        </h2>
        {isDraft && !showAddForm && (
          <Button onClick={() => { setShowAddForm(true); setActionError(null); }}>
            Add Criterion
          </Button>
        )}
      </div>

      <p className="text-sm text-text-muted mb-4">
        Score range: 1–5 per criterion, equal weight
      </p>

      {actionError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-4 py-3 mb-4">
          {actionError}
        </div>
      )}

      {showAddForm && (
        <div className="mb-4">
          <CriteriaForm
            onSave={handleAddSave}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {criteria.length === 0 && !showAddForm ? (
        <div className="text-center py-8 bg-bg-surface border border-border-card rounded-md shadow-sm">
          <p className="text-base text-text-muted mb-4">
            No criteria defined. Add at least one criterion.
          </p>
          {isDraft && (
            <Button onClick={() => setShowAddForm(true)}>
              Add Criterion
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3" role="list" aria-live="polite">
          {criteria.map((criterion, index) => (
            <div key={criterion.id} role="listitem">
              {editingCriterionId === criterion.id ? (
                <CriteriaForm
                  criterion={criterion}
                  onSave={handleEditSave}
                  onCancel={() => setEditingCriterionId(null)}
                />
              ) : (
                <CriteriaCard
                  criterion={criterion}
                  isDraft={isDraft}
                  isFirst={index === 0}
                  isLast={index === criteria.length - 1}
                  onEdit={() => setEditingCriterionId(criterion.id)}
                  onDelete={() => setDeletingCriterion(criterion)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {deletingCriterion && (
        <ConfirmDialog
          title={`Delete ${deletingCriterion.name}?`}
          message="Delete criterion? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingCriterion(null)}
        />
      )}
    </section>
  );
}
