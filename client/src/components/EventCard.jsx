import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const borderColors = {
  draft: 'border-l-gray-300',
  active: 'border-l-accent',
  completed: 'border-l-green-400',
};

export default function EventCard({ event }) {
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link
      to={`/events/${event.id}`}
      className={`
        block bg-bg-surface border border-border-card rounded-md p-5 shadow-sm
        border-l-4 transition-shadow duration-base
        hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        ${borderColors[event.status] || borderColors.draft}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold tracking-tight text-text-primary truncate">
            {event.name}
          </h3>
          <p className="text-sm font-medium text-text-secondary mt-1">
            {formattedDate} &middot; {event.time_limit} min per demo
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>
    </Link>
  );
}
