export default function TeamSummaryRow({ team, criteria, judges, rank, isExpanded, onToggle }) {
  const judgeScoreMap = {};
  for (const score of team.scores) {
    if (!judgeScoreMap[score.judgeId]) judgeScoreMap[score.judgeId] = {};
    judgeScoreMap[score.judgeId][score.criterionId] = score.value;
  }

  const commentMap = {};
  for (const c of team.comments) {
    commentMap[c.judgeId] = c.comment;
  }

  const judgesWithScores = judges.filter((j) => team.scores.some((s) => s.judgeId === j.id));
  const judgesWithNoScores = judges.filter((j) => !team.scores.some((s) => s.judgeId === j.id));
  const missingJudgeIds = new Set(judgesWithNoScores.map((j) => j.id));

  const hasAnyScore = team.totalScores > 0;

  return (
    <li className="bg-bg-surface border border-border-card rounded-md shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="
          w-full flex items-center gap-4 px-6 py-5 text-left
          hover:bg-bg-page transition-colors duration-base
          focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        "
      >
        <span className="text-sm text-text-muted w-6 shrink-0 text-right">{rank}</span>

        <span className="flex-1 text-xl font-semibold tracking-tight text-text-primary">
          {team.name}
        </span>

        <span className="text-base text-text-secondary shrink-0">
          {hasAnyScore ? `${team.averageScore} / 5` : 'No scores'}
        </span>

        {judges.length > 0 && (
          <span
            className={`
              shrink-0 text-xs font-medium px-2 py-0.5 rounded-sm
              ${team.isComplete
                ? 'bg-accent-subtle text-accent'
                : 'bg-red-50 text-red-600'
              }
            `}
          >
            {team.isComplete ? 'Complete' : `Incomplete (${judgesWithScores.length}/${judges.length} judges)`}
          </span>
        )}

        <svg
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-base ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border-card">
          {!hasAnyScore ? (
            <p className="text-base text-text-muted pt-5">No scores submitted for this team yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto mt-5">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left pr-4 pb-2 text-xs font-semibold uppercase tracking-[0.06em] text-text-muted w-40" />
                      {judges.map((judge) => (
                        <th
                          key={judge.id}
                          className="text-center pb-2 px-3 min-w-[80px]"
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-text-muted block">
                            {judge.name}
                          </span>
                          {missingJudgeIds.has(judge.id) && (
                            <span className="text-xs text-red-500 block mt-0.5">Missing</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((criterion) => (
                      <tr key={criterion.id} className="border-t border-border-card">
                        <td className="pr-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                          {criterion.name}
                        </td>
                        {judges.map((judge) => {
                          const value = judgeScoreMap[judge.id]?.[criterion.id];
                          return (
                            <td key={judge.id} className="text-center px-3 py-2 text-base text-text-primary">
                              {value !== undefined ? value : (
                                <span className="text-text-muted">&mdash;</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {team.comments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-text-muted mb-3">
                    Comments
                  </h3>
                  <div className="flex flex-col gap-3">
                    {judges
                      .filter((j) => commentMap[j.id])
                      .map((judge) => (
                        <div key={judge.id}>
                          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                            {judge.name}
                          </span>
                          <p className="text-base text-text-secondary mt-1">{commentMap[judge.id]}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}
