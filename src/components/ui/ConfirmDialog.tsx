import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { InlineError } from './States';

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  isPending?: boolean;
  error?: unknown;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = 'primary',
  isPending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onCancel}
      dismissible={!isPending}
      footer={
        <>
          <Button onClick={onCancel} disabled={isPending}>
            Go back
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={isPending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="text-muted">{message}</p>
        <InlineError error={error} />
      </div>
    </Modal>
  );
}
