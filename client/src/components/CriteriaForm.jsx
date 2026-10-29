import useForm from '../hooks/useForm';
import Input from './Input';
import Button from './Button';
import { useState } from 'react';

function validateCriterion(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Criterion name is required';
  else if (values.name.trim().length > 100) errors.name = 'Criterion name must be 100 characters or fewer';
  if (values.description.trim().length > 255) errors.description = 'Description must be 255 characters or fewer';
  return errors;
}

export default function CriteriaForm({ criterion, onSave, onCancel }) {
  const [serverError, setServerError] = useState(null);

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      name: criterion?.name || '',
      description: criterion?.description || '',
    },
    validate: validateCriterion,
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
          label="Criterion Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name ? errors.name : undefined}
          placeholder="e.g. Technical Complexity"
        />

        <Input
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.description ? errors.description : undefined}
          placeholder="What should judges evaluate for this criterion?"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {criterion ? 'Save Changes' : 'Add Criterion'}
        </Button>
      </div>
    </form>
  );
}
