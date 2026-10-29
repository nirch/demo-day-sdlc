import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScoringsSummary } from '../services/scoreService';
import TeamSummaryRow from '../components/TeamSummaryRow';
import Button from '../components/Button';

export default function ScoringsSummaryPage() {
  const { id: eventId } = useParams();
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getScoringsSummary(eventId);
      setSummaryData(data);
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
            />
          ))}
        </ol>
      )}
    </div>
  );
}
