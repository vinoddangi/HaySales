import { AlertCircle, Check, CheckCheck, Sparkles, Truck } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SegmentedControl } from '../components/common/SegmentedControl';
import { useAppDispatch } from '../store/hooks';
import { showSnackbar } from '../store/slices/uiSlice';
import { ActivityNotification } from '../types';

const initialNotifications: ActivityNotification[] = [
  {
    id: 'n1',
    title: 'Freight Dispatch En Route',
    message:
      'Semi-truck load #TRK-8821 with 550 Alfalfa Bales has departed the central barn and is arriving tomorrow at 9:00 AM.',
    timestamp: '15 mins ago',
    type: 'order',
    isRead: false,
  },
  {
    id: 'n2',
    title: 'Feed Analysis Lab Certificate',
    message:
      'Lot #ALF-2026-03 test verified: 20.2% Crude Protein, <10% Moisture, RFV 178.',
    timestamp: '2 hours ago',
    type: 'promo',
    isRead: false,
  },
  {
    id: 'n3',
    title: 'Low Stock Alert',
    message:
      'Timothy Grass First Cut inventory is currently below 300 bales. Schedule harvest replenishment.',
    timestamp: 'Yesterday',
    type: 'alert',
    isRead: true,
  },
  {
    id: 'n4',
    title: 'Order Completed & Delivered',
    message:
      'Order #ORD-4409 (40 Orchard Mix Bales) signed and delivered to Blue Ridge Equine Center.',
    timestamp: '2 days ago',
    type: 'order',
    isRead: true,
  },
];

export const ActivityPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<'all' | 'orders' | 'alerts'>('all');
  const [notifications, setNotifications] = useState(initialNotifications);

  const filtered = notifications.filter((item) => {
    if (filter === 'orders') return item.type === 'order';
    if (filter === 'alerts') return item.type === 'alert';
    return true;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    dispatch(showSnackbar({ message: 'All notifications marked as read' }));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)),
    );
  };

  const getIcon = (type: ActivityNotification['type']) => {
    switch (type) {
      case 'order':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'promo':
        return <Sparkles className="h-4 w-4 text-m3-primary" />;
      default:
        return <CheckCheck className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <div className="animate-fade-in space-y-4 p-4">
      {/* Segmented Filter */}
      <SegmentedControl
        options={[
          { value: 'all', label: 'All Activities' },
          { value: 'orders', label: 'Shipments' },
          { value: 'alerts', label: 'Alerts' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {/* Header Actions */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-m3-on-surface-variant">
          {filtered.length} Updates
        </span>
        <button
          onClick={markAllRead}
          className="flex items-center gap-1 text-xs font-semibold text-m3-primary hover:underline"
        >
          <Check className="h-3.5 w-3.5" />
          Mark all as read
        </button>
      </div>

      {/* Notifications Stream */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <Card
            key={item.id}
            variant={item.isRead ? 'outlined' : 'filled'}
            clickable
            onClick={() => toggleRead(item.id)}
            className={`space-y-2 p-3.5 transition-all ${
              !item.isRead
                ? 'border-l-4 border-l-m3-primary bg-m3-surface-container-high'
                : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="shrink-0 rounded-full bg-m3-surface-container-highest p-2">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-m3-on-surface">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-m3-on-surface-variant">
                    {item.timestamp}
                  </span>
                </div>
              </div>
              {!item.isRead && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-m3-primary" />
              )}
            </div>
            <p className="pl-10 text-xs leading-relaxed text-m3-on-surface">
              {item.message}
            </p>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="space-y-2 py-12 text-center">
            <p className="text-sm font-semibold text-m3-on-surface">
              No notifications
            </p>
            <p className="text-xs text-m3-on-surface-variant">
              You're all caught up with your deliveries and alerts.
            </p>
          </div>
        )}
      </div>

      <div className="pt-2 text-center">
        <Button
          variant="tonal"
          size="sm"
          onClick={() =>
            dispatch(
              showSnackbar({
                message: 'Syncing live telemetry with freight carrier...',
              }),
            )
          }
        >
          Refresh Live Status
        </Button>
      </div>
    </div>
  );
};
