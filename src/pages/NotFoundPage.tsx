import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/States';

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon="alert"
        title="Page not found"
        description="The page you’re looking for doesn’t exist."
        action={
          <Link to="/" className="btn btn--primary btn--md">
            Go to dashboard
          </Link>
        }
      />
    </Card>
  );
}
