import { AlertTriangle, Home } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, PageContainer, Text } from '../../components/common';
import { Flex } from '../../components/layout';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer
      spacing="md"
      className="flex min-h-[60vh] flex-col items-center justify-center text-center"
    >
      <img
        src="/favicon.svg"
        alt="HaySales Logo"
        className="mb-4 h-16 w-16 rounded-2xl shadow-md"
      />
      <Card
        variant="filled"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-m3-error-container text-m3-on-error-container"
      >
        <AlertTriangle className="h-6 w-6" />
      </Card>

      <Flex direction="column" align="center" gap="xs" className="max-w-xs">
        <Text styleAs="h1" appearance="primary" weight="bold">
          Page Not Found
        </Text>
        <Text styleAs="body-sm" appearance="secondary">
          The requested screen or route doesn't exist in this application.
        </Text>
      </Flex>

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
