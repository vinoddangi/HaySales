import React, { useMemo, useRef, useState } from 'react';
import { Badge } from '../../../../components/Badge';
import {
  IconSearch,
  IconUserCheck,
  IconUsers,
  IconX,
} from '../../../../components/Icon';
import { Text } from '../../../../components/Text';
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
    <div className="hs-customer-selector-card" ref={containerRef}>
      <div className="hs-customer-selector-card__header">
        <Text variant="title-sm" weight="bold">
          Customer Account Selection
        </Text>
        {selectedCustomer ? (
          <Badge sentiment="info" appearance="subtle">
            <IconUserCheck
              size="xs"
              className="hs-customer-selector-card__badge-icon"
            />
            Selected
          </Badge>
        ) : (
          <Badge sentiment="neutral" appearance="subtle">
            <IconUsers
              size="xs"
              className="hs-customer-selector-card__badge-icon"
            />
            Required
          </Badge>
        )}
      </div>

      {/* 1. Search & Select Input */}
      {!selectedCustomer ? (
        <div className="hs-customer-selector-card__search-box">
          <div className="hs-customer-selector-card__input-wrapper">
            <IconSearch
              size="md"
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
                <IconX
                  size="md"
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
                  <Text variant="body-sm" appearance="secondary">
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
                      <Text variant="body-md" weight="bold">
                        {c.name}
                      </Text>
                      <Text variant="body-sm" appearance="secondary">
                        {c.village || 'No village'} • {c.mobile || 'No mobile'}
                      </Text>
                    </div>
                    <Badge sentiment="neutral" appearance="subtle">
                      Select
                    </Badge>
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
              <Text variant="title-md" weight="bold">
                {selectedCustomer.name}
              </Text>
              <Text variant="body-sm" appearance="secondary">
                {selectedCustomer.village
                  ? `Village: ${selectedCustomer.village}`
                  : 'No village specified'}
                {selectedCustomer.mobile
                  ? ` • Mobile: ${selectedCustomer.mobile}`
                  : ''}
              </Text>
            </div>

            <div className="hs-customer-selector-card__actions">
              {isOverLimit && (
                <Badge sentiment="negative" appearance="solid">
                  Over Credit Limit
                </Badge>
              )}
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
              <Text variant="label-sm" appearance="secondary">
                Current Due:
              </Text>
              <Text
                variant="title-sm"
                weight="bold"
                sentiment={outstandingDue > 0 ? 'negative' : 'positive'}
              >
                {outstandingDue > 0
                  ? formatRupee(outstandingDue)
                  : '₹0 (Clear)'}
              </Text>
            </div>

            <div className="hs-customer-selector-card__metric-item">
              <Text variant="label-sm" appearance="secondary">
                Credit Limit:
              </Text>
              <Text variant="title-sm" weight="bold">
                {formatRupee(creditLimit)}
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSelectorCard;
