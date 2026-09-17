import { AlertTriangle, Home } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageContainer } from '../../components/common/PageContainer';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer
      spacing="md"
      className="flex min-h-[60vh] flex-col items-center justify-center text-center"
    >
      <Card
        variant="filled"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-m3-error-container text-m3-on-error-container"
      >
        <AlertTriangle className="h-8 w-8" />
      </Card>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-m3-on-surface">Page Not Found</h2>
        <p className="max-w-xs text-xs leading-relaxed text-m3-on-surface-variant">
          The requested screen or route doesn't exist in this application.
        </p>
      </div>

      <Button
        variant="filled"
        icon={<Home className="h-4 w-4" />}
        onClick={() => navigate('/')}
      >
        Back to Dashboard
      </Button>
    </PageContainer>
  );
};
