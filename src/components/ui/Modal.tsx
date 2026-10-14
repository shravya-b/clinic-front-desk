import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { IconButton } from './Button';
import './Modal.css';

/** Number of open modals, so nested dialogs don't unlock page scrolling too early. */
let openModalCount = 0;

interface ModalProps {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Prevent closing (e.g. while a request is in flight). */
  dismissible?: boolean;
  children: ReactNode;
}

/**
 * Accessible modal built on the native <dialog> (focus trapping, Esc, top layer).
 * Mount it to open, unmount it to close: `{isOpen && <Modal … />}`. This also
 * guarantees fresh form state each time it opens.
 */
export function Modal({ title, description, onClose, footer, size = 'md', dismissible = true, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialog.showModal();
    // showModal() focuses the first focusable element (the close button), and React's
    // autoFocus can't fire while the dialog is still closed, so focus the first field ourselves.
    dialog
      .querySelector<HTMLElement>('.modal__body :is(input, select, textarea):not(:disabled):not([type="hidden"])')
      ?.focus();
    openModalCount += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      openModalCount -= 1;
      if (openModalCount === 0) document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, []);

  const requestClose = () => {
    if (dismissible) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={cx('modal', `modal--${size}`)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Let React own open/closed state instead of the browser.
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="modal__panel">
        <header className="modal__header">
          <div>
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="modal__description">
                {description}
              </p>
            )}
          </div>
          <IconButton icon="x" label="Close" onClick={requestClose} disabled={!dismissible} />
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
