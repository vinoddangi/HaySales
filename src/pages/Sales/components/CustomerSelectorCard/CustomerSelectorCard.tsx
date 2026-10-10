import React, { useMemo, useRef, useState } from 'react';
import { Card, FlexLayout, Pill, Text } from '@salt-ds/core';
import { Search, UserCheck, Users, X } from 'lucide-react';
import { CustomerModel } from '../../../../models';
import { formatRupee } from '../../../../utils/formatters';
import './CustomerSelectorCard.css';

export interface CustomerSelectorCardProps {
  customers: CustomerModel[];
  selectedCustomerId: string | null;
  onSelectCustomer: (_id: string | null) => void;
  outstandingDue: number;
  creditLimit: number;
}

export const CustomerSelectorCard: React.FC<CustomerSelectorCardProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  outstandingDue,
  creditLimit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return customers.slice(0, 8);
    return customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(term);
      const villageMatch = c.village
        ? c.village.toLowerCase().includes(term)
        : false;
      const mobileMatch = c.mobile ? c.mobile.includes(term) : false;
      return nameMatch || villageMatch || mobileMatch;
    });
  }, [customers, searchTerm]);

  const handleSelect = (customerId: string) => {
    onSelectCustomer(customerId);
    setSearchTerm('');
    setIsFocused(false);
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchTerm('');
  };

  const isOverLimit = outstandingDue > creditLimit;

  return (
    <Card className="hs-customer-selector-card" ref={containerRef}>
      <FlexLayout
        justify="space-between"
        align="center"
        className="hs-customer-selector-card__header"
      >
        <Text styleAs="label">
          <b>CUSTOMER ACCOUNT SELECTION</b>
        </Text>
        {selectedCustomer ? (
          <Pill>
            <FlexLayout align="center" gap={0.5}>
              <UserCheck size={12} />
              <span>Selected</span>
            </FlexLayout>
          </Pill>
        ) : (
          <Pill>
            <FlexLayout align="center" gap={0.5}>
              <Users size={12} />
              <span>Required</span>
            </FlexLayout>
          </Pill>
        )}
      </FlexLayout>

      {/* 1. Search & Select Input */}
      {!selectedCustomer ? (
        <div className="hs-customer-selector-card__search-box">
          <div className="hs-customer-selector-card__input-wrapper">
            <Search
              size={16}
              className="hs-customer-selector-card__search-icon"
            />
            <input
              type="text"
              className="hs-customer-selector-card__search-input"
              placeholder="Search by customer name, village, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="hs-customer-selector-card__clear-btn"
                aria-label="Clear search"
              >
                <X
                  size={16}
                  className="hs-customer-selector-card__clear-icon"
                />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isFocused && (
            <div className="hs-customer-selector-card__dropdown">
              {filteredCustomers.length === 0 ? (
                <div className="hs-customer-selector-card__dropdown-empty">
                  <Text styleAs="notation" color="secondary">
                    No customers found matching &quot;{searchTerm}&quot;
                  </Text>
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className="hs-customer-selector-card__dropdown-item"
                    role="button"
                    tabIndex={0}
                  >
                    <div>
                      <Text>
                        <b>{c.name}</b>
                      </Text>
                      <Text styleAs="notation" color="secondary">
                        {c.village || 'No village'} • {c.mobile || 'No mobile'}
                      </Text>
                    </div>
                    <Pill onClick={() => handleSelect(c.id)}>Select</Pill>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* 2. Selected Customer Info Card */
        <div className="hs-customer-selector-card__info">
          <div className="hs-customer-selector-card__info-header">
            <div>
              <Text styleAs="h3">
                <b>{selectedCustomer.name}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                {selectedCustomer.village
                  ? `Village: ${selectedCustomer.village}`
                  : 'No village specified'}
                {selectedCustomer.mobile
                  ? ` • Mobile: ${selectedCustomer.mobile}`
                  : ''}
              </Text>
            </div>

            <div className="hs-customer-selector-card__actions">
              {isOverLimit && <Pill>Over Credit Limit</Pill>}
              <button
                type="button"
                onClick={handleClear}
                className="hs-customer-selector-card__change-btn"
              >
                Change Customer
              </button>
            </div>
          </div>

          <div className="hs-customer-selector-card__metrics">
            <div className="hs-customer-selector-card__metric-item">
              <Text styleAs="notation" color="secondary">
                Current Due:
              </Text>
              <Text
                styleAs="h4"
                color={outstandingDue > 0 ? 'error' : 'success'}
              >
                <b>
                  {outstandingDue > 0
                    ? formatRupee(outstandingDue)
                    : '₹0 (Clear)'}
                </b>
              </Text>
            </div>

            <div className="hs-customer-selector-card__metric-item">
              <Text styleAs="notation" color="secondary">
                Credit Limit:
              </Text>
              <Text styleAs="h4">
                <b>{formatRupee(creditLimit)}</b>
              </Text>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CustomerSelectorCard;
