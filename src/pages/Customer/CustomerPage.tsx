import { ChevronRight, Phone, User, Users } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { PageContainer } from '../../components/common/PageContainer';
import { useGetCustomersQuery } from '../../store/slices/customersApi';

export const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: customers = [], error, isLoading } = useGetCustomersQuery();

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-m3-on-surface">
          Customers Directory
        </h2>
        <span className="rounded-full bg-m3-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-m3-on-surface-variant">
          {customers.length} Total
        </span>
      </div>

      {isLoading ? (
        <Card
          variant="filled"
          className="bg-m3-surface-container p-6 text-center"
        >
          <p className="animate-pulse text-xs text-m3-on-surface-variant">
            Loading customers...
          </p>
        </Card>
      ) : error ? (
        <Card
          variant="filled"
          className="bg-m3-error-container/20 p-6 text-center"
        >
          <p className="text-xs font-medium text-m3-error">
            Error loading customer data.
          </p>
        </Card>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No Customers Found"
          description="Add your first customer in Firestore to see them listed here."
        />
      ) : (
        <div className="space-y-2.5">
          {customers.map((customer) => (
            <Card
              key={customer.id}
              variant="outlined"
              clickable
              onClick={() => navigate('/ledger')}
              className="flex items-center justify-between p-3.5 transition-colors hover:border-m3-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-m3-primary-container text-m3-on-primary-container">
                  <User className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-m3-on-surface">
                    {customer.name}
                  </h4>
                  {customer.mobile ? (
                    <p className="flex items-center gap-1 text-[11px] text-m3-on-surface-variant">
                      <Phone className="h-3 w-3" />
                      {customer.mobile}
                    </p>
                  ) : (
                    <p className="text-[10px] text-m3-on-surface-variant">
                      Active Customer
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
