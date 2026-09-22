import { Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { Customer } from '../../store/slices/customersApi';
import { Flex } from '../layout/Flex';
import { CustomerInfoBadge } from './CustomerInfoBadge';
import { Text } from './Text';

export interface CustomerSearchSelectorProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (_customerId: string | null) => void;
  showBadgeWhenSelected?: boolean;
  outstandingDue?: number;
  creditLimit?: number;
  placeholder?: string;
  className?: string;
}

export const CustomerSearchSelector: React.FC<CustomerSearchSelectorProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  showBadgeWhenSelected = true,
  outstandingDue = 0,
  creditLimit = 35000,
  placeholder = 'Search customer by name...',
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredCustomers = searchTerm
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const handleSelect = (cId: string) => {
    onSelectCustomer(cId);
    setSearchTerm('');
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchTerm('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-m3-on-surface-variant" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-m3-sm border border-m3-outline bg-m3-surface py-2.5 pl-9 pr-8 text-sm font-bold text-m3-on-surface placeholder:font-normal placeholder:text-m3-on-surface-variant/50 focus:border-m3-primary focus:outline-none focus:ring-1 focus:ring-m3-primary"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-m3-on-surface-variant hover:bg-m3-surface-container-high"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {searchTerm && (
        <ul className="max-h-40 divide-y divide-m3-outline-variant overflow-y-auto rounded-lg border border-m3-outline-variant bg-m3-surface shadow-m3-2">
          {filteredCustomers.length === 0 ? (
            <li className="p-3 text-center">
              <Text styleAs="body-sm" appearance="secondary">
                No matching customers found
              </Text>
            </li>
          ) : (
            filteredCustomers.map((c) => (
              <li
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className="flex cursor-pointer items-center justify-between p-2.5 text-xs text-m3-on-surface transition-colors hover:bg-m3-primary-container"
              >
                <Text styleAs="body-sm" appearance="primary" weight="medium">
                  {c.name}
                </Text>
                {c.mobile && (
                  <Text styleAs="caption" appearance="secondary">
                    {c.mobile}
                  </Text>
                )}
              </li>
            ))
          )}
        </ul>
      )}

      {/* Selected Customer Info Badge */}
      {selectedCustomer && showBadgeWhenSelected && (
        <div className="space-y-1.5">
          <Flex align="center" justify="between" fullWidth>
            <Text styleAs="label" appearance="secondary" uppercase>
              Selected Customer
            </Text>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-medium text-m3-error hover:underline"
            >
              Change Customer
            </button>
          </Flex>
          <CustomerInfoBadge
            customer={selectedCustomer}
            outstandingDue={outstandingDue}
            creditLimit={creditLimit}
          />
        </div>
      )}
    </div>
  );
};
