export default function SkeletonCard() {
  return (
    <div className="bg-bg-surface border border-border-card rounded-md p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-5 bg-gray-200 rounded-pill w-16" />
      </div>
    </div>
  );
}
