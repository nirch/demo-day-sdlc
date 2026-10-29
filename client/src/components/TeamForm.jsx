import useForm from '../hooks/useForm';
import Input from './Input';
import TextArea from './TextArea';
import Button from './Button';
import { useState } from 'react';

const URL_REGEX = /^https?:\/\/.+/;

function validateTeam(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Team name is required';
  else if (values.name.trim().length > 100) errors.name = 'Team name must be 100 characters or fewer';
  if (!values.members.trim()) errors.members = 'Members are required';
  if (values.demo_presentation_url.trim() && !URL_REGEX.test(values.demo_presentation_url.trim())) {
    errors.demo_presentation_url = 'Must be a valid URL (starting with http:// or https://)';
  }
  if (values.live_app_url.trim() && !URL_REGEX.test(values.live_app_url.trim())) {
    errors.live_app_url = 'Must be a valid URL (starting with http:// or https://)';
  }
  return errors;
}

export default function TeamForm({ team, onSave, onCancel }) {
  const [serverError, setServerError] = useState(null);

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      name: team?.name || '',
      members: team?.members || '',
      demo_presentation_url: team?.demo_presentation_url || '',
      live_app_url: team?.live_app_url || '',
    },
    validate: validateTeam,
    onSubmit: async (formValues) => {
      setServerError(null);
      try {
        await onSave(formValues);
      } catch (err) {
        const msg = err.response?.data?.error;
        if (Array.isArray(msg)) {
          setServerError(msg.map((e) => e.message).join(', '));
        } else {
          setServerError(msg || 'Something went wrong. Please try again.');
        }
        throw err;
      }
    },
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-bg-surface border border-border-card rounded-md px-6 py-5 shadow-sm"
    >
      {serverError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-4 py-3 mb-4">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label="Team Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name ? errors.name : undefined}
          placeholder="e.g. Team Alpha"
        />

        <TextArea
          label="Members"
          name="members"
          value={values.members}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.members ? errors.members : undefined}
          placeholder="One per line or comma-separated"
        />

        <Input
          label="Presentation URL"
          name="demo_presentation_url"
          type="url"
          value={values.demo_presentation_url}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.demo_presentation_url ? errors.demo_presentation_url : undefined}
          placeholder="https://docs.google.com/presentation/..."
        />

        <Input
          label="Live App URL"
          name="live_app_url"
          type="url"
          value={values.live_app_url}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.live_app_url ? errors.live_app_url : undefined}
          placeholder="https://my-app.example.com"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {team ? 'Save Changes' : 'Add Team'}
        </Button>
      </div>
    </form>
  );
}
