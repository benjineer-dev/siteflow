'use client';

import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react';
import {
  ApiError,
  apiRequest,
} from '@/lib/api';
import {
  type CreateProjectRequest,
  type Project,
} from '@/lib/project-types';

interface CreateProjectModalProps {
  isOpen: boolean;
  token: string;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export function CreateProjectModal({
  isOpen,
  token,
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );

      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    const request: CreateProjectRequest = {
      name: name.trim(),
      ...(description.trim()
        ? {
            description: description.trim(),
          }
        : {}),
    };

    try {
      const project =
        await apiRequest<Project>(
          '/projects',
          {
            method: 'POST',
            token,
            body: request,
          },
        );

      setName('');
      setDescription('');

      onCreated(project);
      onClose();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError(
          'Unable to create the project',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackdropClick(
    event: MouseEvent<HTMLDivElement>,
  ): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              New workspace
            </span>

            <h2 id="create-project-title">
              Create project
            </h2>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          className="project-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>Project name</span>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="North Residential Complex"
              minLength={2}
              maxLength={150}
              autoFocus
              required
            />
          </label>

          <label>
            <span>Description</span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Project location, scope, or notes"
              maxLength={1000}
              rows={5}
            />
          </label>

          {error && (
            <div
              className="form-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              className="primary-button modal-submit"
              type="submit"
              disabled={
                isSubmitting ||
                name.trim().length < 2
              }
            >
              {isSubmitting
                ? 'Creating...'
                : 'Create project'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}