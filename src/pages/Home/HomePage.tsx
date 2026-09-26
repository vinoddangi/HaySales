import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Layers,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Fab, Grid } from '../../components';
import { PageContainer } from '../../views';
import './HomePage.css';

const featuredProducts = [
  {
    id: 'alfalfa-supreme',
    title: 'Supreme Green Alfalfa',
    subtitle: 'Moisture < 12%, High Protein Dairy Grade',
    pricePerKg: 24.5,
    stockKg: 18500,
  },
  {
    id: 'rhodes-grass',
    title: 'Premium Rhodes Grass',
    subtitle: 'Sun-cured dust-free livestock forage',
    pricePerKg: 18.0,
    stockKg: 22000,
  },
  {
    id: 'timothy-first-cut',
    title: 'Timothy Premium Cut',
    subtitle: 'Export grade double-compressed forage',
    pricePerKg: 32.0,
    stockKg: 8000,
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* 1. Harvest Hero Banner Card */}
      <Card variant="filled">
        <Card.Content>
          <div className="home-page__badge">
            <Sparkles className="h-3 w-3" />
            <span>2026 Harvest Active</span>
          </div>

          <h2 className="home-page__hero-title">HaySales Management</h2>
          <p className="home-page__hero-subtitle">
            Real-time inventory in Kg, customer dues ledger, and sales tracking.
          </p>

          <div className="home-page__hero-actions">
            <Button
              variant="filled"
              onClick={() => navigate('/sales')}
              trailingIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              New Sale
            </Button>
            <Button variant="outlined" onClick={() => navigate('/ledger')}>
              Ledger
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* 2. 3-Column Metrics Grid */}
      <Grid columns={3} gap="sm">
        <Card variant="outlined">
          <Card.Metric
            icon={<Package className="h-4 w-4" />}
            value="48,500 Kg"
            label="Available Stock"
          />
        </Card>

        <Card variant="outlined">
          <Card.Metric
            icon={<Truck className="h-4 w-4" />}
            value="3 Loads"
            label="En Route"
          />
        </Card>

        <Card variant="outlined">
          <Card.Metric
            icon={<ShieldCheck className="h-4 w-4" />}
            value="99.4%"
            label="Dry Purity"
          />
        </Card>
      </Grid>

      {/* 3. Quick Actions Card */}
      <Card variant="filled">
        <Card.Header title="Quick Actions" />
        <Card.Content>
          <div className="home-quick-actions__list">
            <Card.ActionItem
              icon={<Plus className="h-4 w-4 text-primary" />}
              label="New Sale (Kg)"
              onClick={() => navigate('/sales')}
            />
            <Card.ActionItem
              icon={<ShoppingCart className="h-4 w-4 text-primary" />}
              label="Buy Feed"
              onClick={() => navigate('/purchases')}
            />
            <Card.ActionItem
              icon={<BookOpen className="h-4 w-4 text-primary" />}
              label="Customer Ledger"
              onClick={() => navigate('/ledger')}
            />
            <Card.ActionItem
              icon={<ShoppingBag className="h-4 w-4 text-primary" />}
              label="Recent Activity"
              onClick={() => navigate('/activity')}
            />
          </div>
        </Card.Content>
      </Card>

      {/* 4. Customer Outstanding Summary Card */}
      <Card variant="outlined">
        <Card.Header
          title="Total Customer Dues"
          action={<Users className="h-4 w-4 text-outline" />}
        />
        <Card.Content>
          <div className="home-dues-amount">₹ 1,84,500</div>
        </Card.Content>
        <Card.Actions align="between">
          <div className="home-dues-footer">
            <span>Across 28 active accounts</span>
            <button
              onClick={() => navigate('/ledger')}
              className="home-dues-link"
              type="button"
            >
              <span>Ledger</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card.Actions>
      </Card>

      {/* 5. Available Hay Lots Card */}
      <Card variant="filled">
        <Card.Header
          title="Available Hay Lots"
          action={
            <Button variant="text" onClick={() => navigate('/sales')}>
              View All Lots
            </Button>
          }
        />
        <Card.Content>
          <div className="home-lots__list">
            {featuredProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/sales')}
                className="home-lot-item"
                role="button"
                tabIndex={0}
              >
                <div className="home-lot-item__icon">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="home-lot-item__info">
                  <h4 className="home-lot-item__title">{item.title}</h4>
                  <p className="home-lot-item__subtitle">{item.subtitle}</p>
                  <div className="home-lot-item__meta">
                    <span className="home-lot-item__price">
                      ₹ {item.pricePerKg.toFixed(2)} / Kg
                    </span>
                    <span className="home-lot-item__stock">
                      {item.stockKg.toLocaleString()} Kg stock
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* 6. Floating Action Button */}
      <div className="home-page__fab">
        <Fab
          icon={<Plus className="h-6 w-6" />}
          label="New Sale"
          variant="primary"
          size="md"
          onClick={() => navigate('/sales')}
        />
      </div>
    </PageContainer>
  );
};

export default HomePage;
