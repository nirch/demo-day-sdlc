import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScoringsSummary } from '../services/scoreService';
import { selectWinner } from '../services/eventService';
import TeamSummaryRow from '../components/TeamSummaryRow';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';

export default function ScoringsSummaryPage() {
  const { id: eventId } = useParams();
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [winnerTeamId, setWinnerTeamId] = useState(null);
  const [selectingTeamIds, setSelectingTeamIds] = useState(() => new Set());
  const [errorTeamIds, setErrorTeamIds] = useState(() => new Set());
  const [confirmTeam, setConfirmTeam] = useState(null);

  // Requests in flight, and whether two or more ran at the same time.
  const inFlightRef = useRef(0);
  const overlappedRef = useRef(false);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorTeamIds(new Set());
    try {
      const data = await getScoringsSummary(eventId);
      setSummaryData(data);
      setWinnerTeamId(data.event.winnerTeamId ?? null);
    } catch {
      setError('Failed to load scoring summary');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleToggle = (teamId) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  const addTo = (setter, id) => setter((prev) => new Set(prev).add(id));
  const removeFrom = (setter, id) =>
    setter((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  // After overlapping requests the server's last write may differ from the last
  // response we received, so take the stored winner from the server.
  const syncWinner = async () => {
    try {
      const data = await getScoringsSummary(eventId);
      setWinnerTeamId(data.event.winnerTeamId ?? null);
    } catch {
      // Non-fatal: keep the winner from the responses we already applied.
    }
  };

  const handleSubmit = async (team) => {
    const teamId = team.id;

    inFlightRef.current += 1;
    if (inFlightRef.current > 1) overlappedRef.current = true;
    addTo(setSelectingTeamIds, teamId);
    removeFrom(setErrorTeamIds, teamId);

    try {
      await selectWinner(eventId, teamId);
      setWinnerTeamId(teamId);
    } catch {
      addTo(setErrorTeamIds, teamId);
    } finally {
      // Success closes the dialog; failure closes it too and shows the alert on the row.
      setConfirmTeam((prev) => (prev && prev.id === teamId ? null : prev));
      removeFrom(setSelectingTeamIds, teamId);
      inFlightRef.current -= 1;
    }

    if (inFlightRef.current === 0 && overlappedRef.current) {
      overlappedRef.current = false;
      await syncWinner();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-bg-surface border border-border-card rounded-md px-6 py-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded w-4" />
              <div className="h-5 bg-gray-200 rounded flex-1" />
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-base text-text-secondary mb-4">{error}</p>
        <Button variant="secondary" onClick={fetchSummary}>
          Retry
        </Button>
      </div>
    );
  }

  const { event, criteria, judges, teams } = summaryData;
  const hasNoScores = teams.every((t) => t.totalScores === 0);

  // Compared on the rounded averages the page shows. Ties all count as top.
  const scored = teams.filter((t) => t.averageScore !== null).map((t) => t.averageScore);
  const topAverage = scored.length > 0 ? Math.max(...scored) : null;
  const isTopScorer = (team) => team.averageScore !== null && team.averageScore === topAverage;

  const handleSelect = (team) => {
    removeFrom(setErrorTeamIds, team.id);
    if (isTopScorer(team)) {
      handleSubmit(team);
    } else {
      setConfirmTeam(team);
    }
  };

  // Escape and a backdrop click also call this, so ignore them while the request runs.
  const handleCancelConfirm = () => {
    if (confirmTeam && !selectingTeamIds.has(confirmTeam.id)) setConfirmTeam(null);
  };

  return (
    <div>
      <Link
        to={`/events/${eventId}`}
        className="
          text-sm font-medium text-text-secondary
          hover:text-text-primary transition-colors duration-base
          focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
          rounded-sm inline-block mb-4
        "
      >
        &larr; Back to {event.name}
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight text-text-primary mb-7">
        Scoring Summary
      </h1>

      {hasNoScores ? (
        <div className="bg-bg-surface border border-border-card rounded-md px-6 py-10 shadow-sm text-center">
          <p className="text-base text-text-secondary">
            No scores have been submitted yet. Judges need to complete scoring first.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Teams ranked by score">
          {teams.map((team, index) => (
            <TeamSummaryRow
              key={team.id}
              team={team}
              criteria={criteria}
              judges={judges}
              rank={index + 1}
              isExpanded={expandedTeamId === team.id}
              onToggle={() => handleToggle(team.id)}
              isWinner={team.id === winnerTeamId}
              isSelecting={selectingTeamIds.has(team.id)}
              hasSelectError={errorTeamIds.has(team.id)}
              onSelectWinner={() => handleSelect(team)}
            />
          ))}
        </ol>
      )}

      {confirmTeam && (
        <ConfirmDialog
          title={`Select ${confirmTeam.name} as winner?`}
          message="This team doesn't have the highest score. Are you sure you want to select it as the winner?"
          confirmLabel="Select Winner"
          variant="primary"
          isLoading={selectingTeamIds.has(confirmTeam.id)}
          onConfirm={() => handleSubmit(confirmTeam)}
          onCancel={handleCancelConfirm}
        />
      )}
    </div>
  );
}
