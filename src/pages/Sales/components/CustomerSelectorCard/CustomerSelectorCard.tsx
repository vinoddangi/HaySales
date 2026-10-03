import { Search, UserCheck, Users, X } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { Badge } from '../../../../components/Badge';
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
        <h3 className="hs-customer-selector-card__title">
          Customer Account Selection
        </h3>
        {selectedCustomer ? (
          <Badge sentiment="info" appearance="subtle">
            <UserCheck className="mr-1 h-3 w-3" />
            Selected
          </Badge>
        ) : (
          <Badge sentiment="neutral" appearance="subtle">
            <Users className="mr-1 h-3 w-3" />
            Required
          </Badge>
        )}
      </div>

      {/* 1. Search Bar */}
      {!selectedCustomer ? (
        <div className="hs-customer-selector-card__search-box">
          <div className="hs-customer-selector-card__input-wrapper">
            <Search className="hs-customer-selector-card__search-icon" />
            <input
              type="text"
              placeholder="Search customer by name, village, or mobile..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsFocused(true);
              }}
              onFocus={() => setIsFocused(true)}
              className="hs-customer-selector-card__search-input"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="hs-customer-selector-card__clear-btn"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isFocused && (
            <div className="hs-customer-selector-card__dropdown">
              {filteredCustomers.length === 0 ? (
                <div className="hs-customer-selector-card__dropdown-empty">
                  No matching customer accounts found.
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
                      <div className="hs-customer-selector-card__dropdown-name">
                        {c.name}
                      </div>
                      <div className="hs-customer-selector-card__dropdown-meta">
                        {c.village || 'No village'} • {c.mobile || 'No mobile'}
                      </div>
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
              <div className="hs-customer-selector-card__customer-name">
                {selectedCustomer.name}
              </div>
              <div className="hs-customer-selector-card__meta">
                {selectedCustomer.village
                  ? `Village: ${selectedCustomer.village}`
                  : 'No village specified'}
                {selectedCustomer.mobile
                  ? ` • Mobile: ${selectedCustomer.mobile}`
                  : ''}
              </div>
            </div>

            <div className="flex items-center gap-2">
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
              <span className="hs-customer-selector-card__metric-label">
                Current Due:
              </span>
              <span
                className={`hs-customer-selector-card__metric-value ${
                  outstandingDue > 0
                    ? 'hs-customer-selector-card__metric-value--due'
                    : 'hs-customer-selector-card__metric-value--clear'
                }`}
              >
                {outstandingDue > 0
                  ? formatRupee(outstandingDue)
                  : '₹0 (Clear)'}
              </span>
            </div>

            <div className="hs-customer-selector-card__metric-item">
              <span className="hs-customer-selector-card__metric-label">
                Credit Limit:
              </span>
              <span className="hs-customer-selector-card__metric-value hs-customer-selector-card__metric-value--limit">
                {formatRupee(creditLimit)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
