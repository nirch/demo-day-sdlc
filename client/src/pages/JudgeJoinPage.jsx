import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as judgeInviteService from '../services/judgeInviteService';
import Input from '../components/Input';
import Button from '../components/Button';

export default function JudgeJoinPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginAsJudge, token: authToken } = useAuth();

  const [event, setEvent] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [invalidToken, setInvalidToken] = useState(false);

  const [formData, setFormData] = useState({ name: '', title: '', company: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        const data = await judgeInviteService.validateInviteToken(token);
        setEvent(data.event);
      } catch {
        setInvalidToken(true);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [token]);

  const validateField = (name, value) => {
    const trimmed = value.trim();
    if (name === 'name') {
      if (!trimmed) return 'Name is required';
      if (trimmed.length < 2 || trimmed.length > 50) return 'Name must be between 2 and 50 characters';
    }
    if (name === 'title') {
      if (!trimmed) return 'Role is required';
      if (trimmed.length < 2 || trimmed.length > 50) return 'Role must be between 2 and 50 characters';
    }
    if (name === 'company') {
      if (!trimmed) return 'Company is required';
      if (trimmed.length < 2 || trimmed.length > 100) return 'Company must be between 2 and 100 characters';
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const nameError = validateField('name', formData.name);
    const titleError = validateField('title', formData.title);
    const companyError = validateField('company', formData.company);
    setErrors({ name: nameError, title: titleError, company: companyError });

    if (nameError || titleError || companyError) {
      const firstField = nameError ? 'name' : titleError ? 'title' : 'company';
      document.querySelector(`[name="${firstField}"]`)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await judgeInviteService.joinAsJudge(token, formData);
      loginAsJudge({ token: result.token, user: result.user, eventId: result.event.id });
      navigate(`/events/${result.event.id}`, { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        setServerError(err.response.data.error);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
        <div className="animate-pulse w-full max-w-sm">
          <div className="bg-bg-surface border border-border-card rounded-md p-6 shadow-sm">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
            <div className="h-10 bg-gray-200 rounded w-full mb-4" />
            <div className="h-10 bg-gray-200 rounded w-full mb-4" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-bg-surface border border-border-card rounded-md p-6 shadow-sm">
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary mb-4">
              Invalid Invite Link
            </h1>
            <p className="text-base text-text-secondary">
              This invite link is not valid or has expired. Please ask the event admin for a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-bg-surface border border-border-card rounded-md p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary mb-1">
            Join as Judge
          </h1>
          <p className="text-base text-text-secondary mb-7">
            {event.name}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              placeholder="Jane Smith"
              autoComplete="name"
            />

            <Input
              label="Role"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.title}
              placeholder="CTO, Senior Developer..."
            />

            <Input
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.company}
              placeholder="Acme Corp"
              autoComplete="organization"
            />

            {serverError && (
              <p className="text-xs text-red-500" role="alert">
                {serverError}
              </p>
            )}

            <div className="mt-2">
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Join as Judge
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
