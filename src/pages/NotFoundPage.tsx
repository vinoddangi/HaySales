import { AlertTriangle, Home } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] animate-fade-in flex-col items-center justify-center space-y-4 p-6 text-center">
      <Card
        variant="filled"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-m3-error-container text-m3-on-error-container"
      >
        <AlertTriangle className="h-8 w-8" />
      </Card>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-m3-on-surface">Page Not Found</h2>
        <p className="max-w-xs text-xs leading-relaxed text-m3-on-surface-variant">
          The requested screen or route doesn't exist in this mobile skeleton.
        </p>
      </div>

      <Button
        variant="filled"
        icon={<Home className="h-4 w-4" />}
        onClick={() => navigate('/')}
      >
        Back to Dashboard
      </Button>
    </div>
  );
};
