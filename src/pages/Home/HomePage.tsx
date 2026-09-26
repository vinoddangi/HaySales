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
import { Button, Card, Fab, Flex, Grid } from '../../components';
import { PageContainer } from '../../views';
import './HomePage.css';
import { useHomePage } from './useHomePage';

export const HomePage: React.FC = () => {
  const {
    featuredProducts,
    handleNavigate,
    handleNewSale,
    handleLedger,
    handlePurchases,
    handleActivity,
  } = useHomePage();

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      {/* 1. Harvest Hero Banner Card */}
      <Card variant="filled">
        <Card.Content>
          <Flex align="center" gap="xs" className="home-page__badge">
            <Sparkles className="h-3 w-3" />
            <span>2026 Harvest Active</span>
          </Flex>

          <h2 className="home-page__hero-title">HaySales Management</h2>
          <p className="home-page__hero-subtitle">
            Real-time inventory in Kg, customer dues ledger, and sales tracking.
          </p>

          <Flex align="center" gap="sm" className="home-page__hero-actions">
            <Button
              variant="filled"
              onClick={handleNewSale}
              trailingIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              New Sale
            </Button>
            <Button variant="outlined" onClick={handleLedger}>
              Ledger
            </Button>
          </Flex>
        </Card.Content>
      </Card>

      {/* 2. 3-Column Metrics Grid */}
      <Grid columns={3} gap="sm">
        <Grid.Item>
          <Card variant="outlined">
            <Card.Metric
              icon={<Package className="h-4 w-4" />}
              value="48,500 Kg"
              label="Available Stock"
            />
          </Card>
        </Grid.Item>

        <Grid.Item>
          <Card variant="outlined">
            <Card.Metric
              icon={<Truck className="h-4 w-4" />}
              value="3 Loads"
              label="En Route"
            />
          </Card>
        </Grid.Item>

        <Grid.Item>
          <Card variant="outlined">
            <Card.Metric
              icon={<ShieldCheck className="h-4 w-4" />}
              value="99.4%"
              label="Dry Purity"
            />
          </Card>
        </Grid.Item>
      </Grid>

      {/* 3. Quick Actions Card */}
      <Card variant="filled">
        <Card.Header title="Quick Actions" />
        <Card.Content>
          <Grid columns={2} gap="sm" className="home-quick-actions__list">
            <Grid.Item>
              <Card.ActionItem
                icon={<Plus className="h-4 w-4 text-primary" />}
                label="New Sale (Kg)"
                onClick={handleNewSale}
              />
            </Grid.Item>
            <Grid.Item>
              <Card.ActionItem
                icon={<ShoppingCart className="h-4 w-4 text-primary" />}
                label="Buy Feed"
                onClick={handlePurchases}
              />
            </Grid.Item>
            <Grid.Item>
              <Card.ActionItem
                icon={<BookOpen className="h-4 w-4 text-primary" />}
                label="Customer Ledger"
                onClick={handleLedger}
              />
            </Grid.Item>
            <Grid.Item>
              <Card.ActionItem
                icon={<ShoppingBag className="h-4 w-4 text-primary" />}
                label="Recent Activity"
                onClick={handleActivity}
              />
            </Grid.Item>
          </Grid>
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
          <Flex
            align="center"
            justify="between"
            fullWidth
            className="home-dues-footer"
          >
            <Flex.Item>
              <span>Across 28 active accounts</span>
            </Flex.Item>
            <Flex.Item>
              <button
                onClick={handleLedger}
                className="home-dues-link"
                type="button"
              >
                <span>Ledger</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </Flex.Item>
          </Flex>
        </Card.Actions>
      </Card>

      {/* 5. Available Hay Lots Card */}
      <Card variant="filled">
        <Card.Header
          title="Available Hay Lots"
          action={
            <Button variant="text" onClick={handleNewSale}>
              View All Lots
            </Button>
          }
        />
        <Card.Content>
          <Flex direction="column" gap="sm" className="home-lots__list">
            {featuredProducts.map((item) => (
              <Flex
                key={item.id}
                align="center"
                gap="md"
                onClick={() => handleNavigate('/sales')}
                className="home-lot-item"
                role="button"
                tabIndex={0}
              >
                <Flex.Item shrink={false} className="home-lot-item__icon">
                  <Layers className="h-5 w-5" />
                </Flex.Item>
                <Flex.Item grow className="home-lot-item__info">
                  <h4 className="home-lot-item__title">{item.title}</h4>
                  <p className="home-lot-item__subtitle">{item.subtitle}</p>
                  <Flex
                    align="center"
                    justify="between"
                    fullWidth
                    className="home-lot-item__meta"
                  >
                    <span className="home-lot-item__price">
                      ₹ {item.pricePerKg.toFixed(2)} / Kg
                    </span>
                    <span className="home-lot-item__stock">
                      {item.stockKg.toLocaleString()} Kg stock
                    </span>
                  </Flex>
                </Flex.Item>
              </Flex>
            ))}
          </Flex>
        </Card.Content>
      </Card>

      {/* 6. Floating Action Button */}
      <div className="home-page__fab">
        <Fab
          icon={<Plus className="h-6 w-6" />}
          label="New Sale"
          variant="primary"
          size="md"
          onClick={handleNewSale}
        />
      </div>
    </PageContainer>
  );
};

export default HomePage;
