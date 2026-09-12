import { useGetCustomersQuery } from '@/store/slices/customersApi';
import React from 'react';

export const CustomerPage: React.FC = () => {
  const { data: customers, error, isLoading } = useGetCustomersQuery();

  if (isLoading) return <p>Loading customers...</p>;
  if (error) return <p>Error loading data</p>;

  return (
    <ul>
      {customers?.map((customer) => (
        <li key={customer.id}>
          {customer.Name} (ID: {customer.Id})
        </li>
      ))}
    </ul>
  );
};
