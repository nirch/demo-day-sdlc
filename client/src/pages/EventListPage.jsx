import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as eventService from '../services/eventService';
import EventCard from '../components/EventCard';
import SkeletonCard from '../components/SkeletonCard';
import Button from '../components/Button';

export default function EventListPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch {
      setError('Failed to load events. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          Events
        </h1>
        <Link to="/events/new">
          <Button>Create Event</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-base text-text-secondary mb-4">{error}</p>
          <Button variant="secondary" onClick={fetchEvents}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-base text-text-muted mb-4">
            No events yet. Create your first one.
          </p>
          <Link to="/events/new">
            <Button>Create Event</Button>
          </Link>
        </div>
      )}

      {!isLoading && !error && events.length > 0 && (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
