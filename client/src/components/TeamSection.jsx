import { useState, useEffect, useCallback } from 'react';
import * as teamService from '../services/teamService';
import * as criteriaService from '../services/criteriaService';
import * as scoreService from '../services/scoreService';
import TeamCard from './TeamCard';
import TeamForm from './TeamForm';
import ConfirmDialog from './ConfirmDialog';
import ScoringModal from './ScoringModal';
import Button from './Button';

export default function TeamSection({ eventId, eventStatus, readOnly = false, isJudge = false }) {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [deletingTeam, setDeletingTeam] = useState(null);

  const [criteria, setCriteria] = useState([]);
  const [scoredTeamIds, setScoredTeamIds] = useState({});
  const [scoringTeam, setScoringTeam] = useState(null);

  const isDraft = eventStatus === 'draft' && !readOnly;

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await teamService.getTeams(eventId);
      setTeams(data);
    } catch {
      setFetchError('Couldn\u2019t load teams.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (!isJudge) return;

    const fetchJudgeData = async () => {
      try {
        const [fetchedCriteria, summary] = await Promise.all([
          criteriaService.getCriteria(eventId),
          scoreService.getScoresSummary(eventId),
        ]);
        setCriteria(fetchedCriteria.sort((a, b) => a.sort_order - b.sort_order));
        setScoredTeamIds(summary);
      } catch {
        // non-fatal — scoring will still work, just without pre-loaded data
      }
    };

    fetchJudgeData();
  }, [eventId, isJudge]);

  const handleAddSave = async (values) => {
    await teamService.createTeam(eventId, values);
    setShowAddForm(false);
    await fetchTeams();
  };

  const handleEditSave = async (values) => {
    await teamService.updateTeam(eventId, editingTeamId, values);
    setEditingTeamId(null);
    await fetchTeams();
  };

  const handleDeleteConfirm = async () => {
    await teamService.deleteTeam(eventId, deletingTeam.id);
    setDeletingTeam(null);
    await fetchTeams();
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const reordered = [...teams];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    setTeams(reordered);
    const orderedIds = reordered.map((t) => t.id);
    try {
      await teamService.reorderTeams(eventId, orderedIds);
    } catch {
      await fetchTeams();
    }
  };

  const handleMoveDown = async (index) => {
    if (index === teams.length - 1) return;
    const reordered = [...teams];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    setTeams(reordered);
    const orderedIds = reordered.map((t) => t.id);
    try {
      await teamService.reorderTeams(eventId, orderedIds);
    } catch {
      await fetchTeams();
    }
  };

  const handleScoringSuccess = (teamId) => {
    setScoredTeamIds((prev) => ({ ...prev, [teamId]: true }));
    setScoringTeam(null);
  };

  if (isLoading) {
    return (
      <section className="mt-8" aria-label="Teams">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-bg-surface border border-border-card rounded-md px-6 py-5 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (fetchError) {
    return (
      <section className="mt-8" aria-label="Teams">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary mb-4">
          Teams
        </h2>
        <div className="text-center py-8">
          <p className="text-base text-text-secondary mb-4">{fetchError}</p>
          <Button variant="secondary" onClick={fetchTeams}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-label="Teams">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          Teams ({teams.length})
        </h2>
        {isDraft && !showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            Add Team
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-4">
          <TeamForm
            onSave={handleAddSave}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {teams.length === 0 && !showAddForm ? (
        <div className="text-center py-8 bg-bg-surface border border-border-card rounded-md shadow-sm">
          <p className="text-base text-text-muted mb-4">
            No teams yet — add your first team
          </p>
          {isDraft && (
            <Button onClick={() => setShowAddForm(true)}>
              Add Team
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3" role="list" aria-live="polite">
          {teams.map((team, index) => (
            <div key={team.id} role="listitem">
              {editingTeamId === team.id ? (
                <TeamForm
                  team={team}
                  onSave={handleEditSave}
                  onCancel={() => setEditingTeamId(null)}
                />
              ) : (
                <TeamCard
                  team={team}
                  isDraft={isDraft}
                  onEdit={() => setEditingTeamId(team.id)}
                  onDelete={() => setDeletingTeam(team)}
                  isJudge={isJudge}
                  hasScored={!!scoredTeamIds[team.id]}
                  onScore={() => setScoringTeam(team)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  isFirst={index === 0}
                  isLast={index === teams.length - 1}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {deletingTeam && (
        <ConfirmDialog
          title={`Remove ${deletingTeam.name}?`}
          message="This can't be undone."
          confirmLabel="Remove"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingTeam(null)}
        />
      )}

      {scoringTeam && (
        <ScoringModal
          team={scoringTeam}
          criteria={criteria}
          eventId={eventId}
          onClose={() => setScoringTeam(null)}
          onSuccess={handleScoringSuccess}
        />
      )}
    </section>
  );
}
