import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as eventService from '../services/eventService';
import useForm from '../hooks/useForm';
import Input from '../components/Input';
import TextArea from '../components/TextArea';
import Button from '../components/Button';

const today = () => new Date().toISOString().split('T')[0];

const validate = (values) => {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Event name is required';
  }

  if (!values.date) {
    errors.date = 'Date is required';
  } else if (values.date < today()) {
    errors.date = 'Date must be today or in the future';
  }

  const limit = Number(values.time_limit);
  if (!values.time_limit && values.time_limit !== 0) {
    errors.time_limit = 'Time limit is required';
  } else if (!Number.isInteger(limit) || limit < 1 || limit > 60) {
    errors.time_limit = 'Time limit must be between 1 and 60 minutes';
  }

  return errors;
};

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const onSubmit = useCallback(async (values) => {
    setServerError(null);
    try {
      await eventService.createEvent({
        name: values.name.trim(),
        date: values.date,
        time_limit: Number(values.time_limit),
        description: values.description.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.error;
      if (Array.isArray(message)) {
        setServerError(message.map((e) => e.message).join('. '));
      } else {
        setServerError(message || 'Failed to create event. Try again.');
      }
    }
  }, [navigate]);

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      name: '',
      date: '',
      time_limit: '7',
      description: '',
    },
    validate,
    onSubmit,
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-text-primary mb-7">
        Create Event
      </h1>

      <div className="bg-bg-surface border border-border-card rounded-md px-6 py-5 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Event Name"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            placeholder="Spring 2026 Demo Day"
          />

          <Input
            label="Date"
            name="date"
            type="date"
            value={values.date}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.date}
            min={today()}
          />

          <Input
            label="Time Limit (minutes per demo)"
            name="time_limit"
            type="number"
            value={values.time_limit}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.time_limit}
            min="1"
            max="60"
            placeholder="7"
          />

          <TextArea
            label="Description (optional)"
            name="description"
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.description}
            placeholder="Details about this demo day..."
          />

          {serverError && (
            <p className="text-xs text-red-500" role="alert">
              {serverError}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <Button type="submit" isLoading={isSubmitting}>
              Create Event
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
