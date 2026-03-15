// src/components/ContactForm.tsx
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [values, setValues] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    _gotcha: '',
  });

  const validateField = useCallback((name: string, value: string): string => {
    if (name === 'name' && !value.trim()) return 'This field is required';
    if (name === 'email') {
      if (!value.trim()) return 'This field is required';
      if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
    }
    if (name === 'message' && !value.trim()) return 'This field is required';
    return '';
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error || undefined }));
  }, [validateField]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error on change if field was previously invalid
    if (fieldErrors[name as keyof FieldErrors]) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error || undefined }));
    }
  }, [fieldErrors, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all required fields before submit
    const errors: FieldErrors = {};
    const nameError = validateField('name', values.name);
    if (nameError) errors.name = nameError;
    const emailError = validateField('email', values.email);
    if (emailError) errors.email = emailError;
    const messageError = validateField('message', values.message);
    if (messageError) errors.message = messageError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFormState('submitting');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('email', values.email);
      formData.append('subject', values.subject);
      formData.append('message', values.message);
      formData.append('_gotcha', values._gotcha);

      const res = await fetch('https://formspree.io/f/mwpnzqvw', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        setFormState('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data?.error || 'Something went wrong. Please try again.');
        setFormState('error');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
      setFormState('error');
    }
  }, [values, validateField]);

  const isDisabled = formState === 'submitting';

  if (formState === 'success') {
    return (
      <div className="rounded-2xl bg-surface border border-border p-8 md:p-10 max-w-xl mx-auto">
        <p className="text-green-500 font-semibold text-lg text-center">
          Message sent! We'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface border border-border p-8 md:p-10 max-w-xl mx-auto">
      {formState === 'error' && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Honeypot */}
        <input
          type="text"
          name="_gotcha"
          value={values._gotcha}
          onChange={handleChange}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Name */}
        <div className="mb-5">
          <label htmlFor="name" className="block font-semibold text-sm mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isDisabled}
            required
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 focus:border-accent focus:outline-none disabled:opacity-50"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-5">
          <label htmlFor="email" className="block font-semibold text-sm mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isDisabled}
            required
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 focus:border-accent focus:outline-none disabled:opacity-50"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        {/* Subject */}
        <div className="mb-5">
          <label htmlFor="subject" className="block font-semibold text-sm mb-1.5">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            name="subject"
            value={values.subject}
            onChange={handleChange}
            disabled={isDisabled}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Message */}
        <div className="mb-7">
          <label htmlFor="message" className="block font-semibold text-sm mb-1.5">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={values.message}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isDisabled}
            required
            rows={5}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 focus:border-accent focus:outline-none disabled:opacity-50 resize-y"
          />
          {fieldErrors.message && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="btn-accent w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {formState === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </form>
    </div>
  );
}
