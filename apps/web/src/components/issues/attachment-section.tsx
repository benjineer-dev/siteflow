'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  ApiError,
  apiDownload,
  apiRequest,
} from '@/lib/api';
import type { Attachment } from '@/lib/issue-types';

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

interface AttachmentSectionProps {
  projectId: string;
  issueId: string;
  token: string;
  currentUserId: string;
  isProjectOwner: boolean;
}

export function AttachmentSection({
  projectId,
  issueId,
  token,
  currentUserId,
  isProjectOwner,
}: AttachmentSectionProps) {
  const [attachments, setAttachments] =
    useState<Attachment[]>([]);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUploading, setIsUploading] =
    useState(false);

  const [
    downloadingAttachmentId,
    setDownloadingAttachmentId,
  ] = useState<string | null>(null);

  const [
    deletingAttachmentId,
    setDeletingAttachmentId,
  ] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const loadAttachments = useCallback(
    async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response =
          await apiRequest<Attachment[]>(
            `/projects/${projectId}` +
              `/issues/${issueId}` +
              '/attachments',
            {
              token,
            },
          );

        setAttachments(response);
      } catch (caughtError) {
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Unable to load attachments',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      issueId,
      projectId,
      token,
    ],
  );

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    setError(null);

    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setSelectedFile(null);
      event.target.value = '';

      setError(
        'Only JPEG, PNG, WebP and PDF files are allowed',
      );

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      event.target.value = '';

      setError(
        'The file must be 10 MB or smaller',
      );

      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!selectedFile) {
      return;
    }

    const form = event.currentTarget;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();

    formData.append(
      'file',
      selectedFile,
    );

    try {
      const attachment =
        await apiRequest<Attachment>(
          `/projects/${projectId}` +
            `/issues/${issueId}` +
            '/attachments',
          {
            method: 'POST',
            token,
            body: formData,
          },
        );

      setAttachments(
        (currentAttachments) => [
          ...currentAttachments,
          attachment,
        ],
      );

      setSelectedFile(null);
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to upload the file',
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(
    attachment: Attachment,
  ): Promise<void> {
    setDownloadingAttachmentId(
      attachment.id,
    );

    setError(null);

    try {
      const blob = await apiDownload(
        `/projects/${projectId}` +
          `/issues/${issueId}` +
          `/attachments/${attachment.id}` +
          '/download',
        token,
      );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement('a');

      anchor.href = url;
      anchor.download =
        attachment.originalName;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to download the file',
      );
    } finally {
      setDownloadingAttachmentId(null);
    }
  }

  async function handleDelete(
    attachmentId: string,
  ): Promise<void> {
    setDeletingAttachmentId(
      attachmentId,
    );

    setError(null);

    try {
      await apiRequest<void>(
        `/projects/${projectId}` +
          `/issues/${issueId}` +
          `/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          token,
        },
      );

      setAttachments(
        (currentAttachments) =>
          currentAttachments.filter(
            (attachment) =>
              attachment.id !==
              attachmentId,
          ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to delete the file',
      );
    } finally {
      setDeletingAttachmentId(null);
    }
  }

  return (
    <section className="attachments-section">
      <div className="workspace-section-heading attachment-heading">
        <div>
          <h2>Attachments</h2>

          <p>
            Photos, drawings and supporting
            documents for this issue.
          </p>
        </div>

        <span className="comment-count">
          {attachments.length}
        </span>
      </div>

      <form
        className="attachment-upload"
        onSubmit={handleUpload}
      >
        <label className="attachment-picker">
          <span className="attachment-picker-icon">
            +
          </span>

          <div>
            <strong>
              {selectedFile
                ? selectedFile.name
                : 'Choose a file'}
            </strong>

            <span>
              JPEG, PNG, WebP or PDF · 10 MB max
            </span>
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
          />
        </label>

        <button
          className="primary-button compact"
          type="submit"
          disabled={
            !selectedFile ||
            isUploading
          }
        >
          {isUploading
            ? 'Uploading...'
            : 'Upload file'}
        </button>
      </form>

      {error && (
        <div
          className="workspace-alert"
          role="alert"
        >
          {error}

          <button
            type="button"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {isLoading ? (
        <AttachmentSkeleton />
      ) : attachments.length === 0 ? (
        <div className="attachment-empty">
          No attachments added.
        </div>
      ) : (
        <div className="attachment-list">
          {attachments.map(
            (attachment) => {
              const canDelete =
                isProjectOwner ||
                attachment.uploaderId ===
                  currentUserId;

              const isDeleting =
                deletingAttachmentId ===
                attachment.id;

              const isDownloading =
                downloadingAttachmentId ===
                attachment.id;

              return (
                <article
                  className="attachment-card"
                  key={attachment.id}
                >
                  <div
                    className={`attachment-file-icon ${
                      attachment.mimeType ===
                      'application/pdf'
                        ? 'pdf'
                        : 'image'
                    }`}
                  >
                    {attachment.mimeType ===
                    'application/pdf'
                      ? 'PDF'
                      : 'IMG'}
                  </div>

                  <div className="attachment-info">
                    <strong>
                      {attachment.originalName}
                    </strong>

                    <span>
                      {formatFileSize(
                        attachment.size,
                      )}
                      {' · '}
                      {formatAttachmentDate(
                        attachment.createdAt,
                      )}
                    </span>
                  </div>

                  <div className="attachment-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={
                        isDownloading ||
                        isDeleting
                      }
                      onClick={() =>
                        void handleDownload(
                          attachment,
                        )
                      }
                    >
                      {isDownloading
                        ? 'Downloading...'
                        : 'Download'}
                    </button>

                    {canDelete && (
                      <button
                        className="attachment-delete-button"
                        type="button"
                        disabled={
                          isDeleting ||
                          isDownloading
                        }
                        onClick={() =>
                          void handleDelete(
                            attachment.id,
                          )
                        }
                      >
                        {isDeleting
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function AttachmentSkeleton() {
  return (
    <div className="attachment-list">
      {Array.from({ length: 2 }).map(
        (_, index) => (
          <div
            className="attachment-card"
            key={index}
          >
            <div className="skeleton attachment-skeleton-icon" />

            <div className="attachment-info">
              <div className="skeleton line wide" />
              <div className="skeleton line short" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function formatFileSize(
  bytes: number,
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes =
    kilobytes / 1024;

  return `${megabytes.toFixed(1)} MB`;
}

function formatAttachmentDate(
  date: string,
): string {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}