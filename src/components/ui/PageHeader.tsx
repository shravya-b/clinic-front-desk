import { useEffect, type ReactNode } from 'react';
import { CLINIC_NAME } from '../../config';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  // A distinct document title per page is announced by screen readers on navigation.
  useEffect(() => {
    document.title = `${title} · ${CLINIC_NAME}`;
  }, [title]);

  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1>{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
