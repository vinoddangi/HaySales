import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageContainer } from '../views';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Flex,
  Grid,
  Progress,
  Select,
  Switch,
  Text,
} from './index';

describe('Reusable Building Block Components (M3 Token-Bound & M3 UX Guide)', () => {
  describe('Card', () => {
    it('renders card variants correctly (outlined, filled, elevated)', () => {
      const htmlOutlined = renderToStaticMarkup(
        <Card variant="outlined">
          <span>Outlined Card</span>
        </Card>,
      );
      expect(htmlOutlined).toContain('hs-card');
      expect(htmlOutlined).toContain('hs-card--outlined');

      const htmlElevated = renderToStaticMarkup(
        <Card variant="elevated">
          <span>Elevated Card</span>
        </Card>,
      );
      expect(htmlElevated).toContain('hs-card--elevated');
      expect(htmlElevated).toContain('md-elevation');
    });

    it('renders prespecified Card.Header and Card.Content', () => {
      const html = renderToStaticMarkup(
        <Card variant="filled">
          <Card.Header title="Test Title" subtitle="Test Subtitle" />
          <Card.Content>Body Content</Card.Content>
        </Card>,
      );
      expect(html).toContain('hs-card__header');
      expect(html).toContain('Test Title');
      expect(html).toContain('Test Subtitle');
      expect(html).toContain('Body Content');
    });

    it('renders prespecified Card.Metric without plain divs', () => {
      const html = renderToStaticMarkup(
        <Card variant="outlined">
          <Card.Metric
            value="48,500 Kg"
            label="Available Stock"
            trend={{ value: '+5%', direction: 'up' }}
          />
        </Card>,
      );
      expect(html).toContain('hs-card__metric');
      expect(html).toContain('48,500 Kg');
      expect(html).toContain('Available Stock');
      expect(html).toContain('hs-card__metric-trend--up');
    });

    it('renders prespecified Card.SubCard and Card.Row', () => {
      const html = renderToStaticMarkup(
        <Card.SubCard title="Cash In" value="₹ 50,000" sentiment="positive">
          <Card.Row label="Recvd:" value="₹ 30,000" />
        </Card.SubCard>,
      );
      expect(html).toContain('hs-card__sub-card');
      expect(html).toContain('hs-card__sub-card--positive');
      expect(html).toContain('Cash In');
      expect(html).toContain('₹ 50,000');
      expect(html).toContain('Recvd:');
      expect(html).toContain('₹ 30,000');
    });
  });

  describe('Button', () => {
    it('renders filled button with M3 web component structure', () => {
      const html = renderToStaticMarkup(
        <Button variant="filled" size="sm">
          Click Me
        </Button>,
      );
      expect(html).toContain('md-filled-button');
      expect(html).toContain('hs-btn');
      expect(html).toContain('hs-btn--sm');
      expect(html).toContain('Click Me');
    });

    it('renders tonal and outlined button flavors', () => {
      const htmlTonal = renderToStaticMarkup(
        <Button variant="tonal">Tonal Action</Button>,
      );
      expect(htmlTonal).toContain('md-filled-tonal-button');

      const htmlOutlined = renderToStaticMarkup(
        <Button variant="outlined">Outlined Action</Button>,
      );
      expect(htmlOutlined).toContain('md-outlined-button');
    });
  });

  describe('Avatar', () => {
    it('renders initial letter from profile name', () => {
      const htmlVinod = renderToStaticMarkup(
        <Avatar name="Vinod Dangi" size="md" />,
      );
      expect(htmlVinod).toContain('hs-avatar');
      expect(htmlVinod).toContain('hs-avatar--md');
      expect(htmlVinod).toContain('V');

      const htmlRamesh = renderToStaticMarkup(
        <Avatar name="Ramesh Patel" size="sm" />,
      );
      expect(htmlRamesh).toContain('hs-avatar--sm');
      expect(htmlRamesh).toContain('R');
    });

    it('renders fallback initial when name is empty', () => {
      const htmlEmpty = renderToStaticMarkup(<Avatar size="lg" />);
      expect(htmlEmpty).toContain('hs-avatar--lg');
      expect(htmlEmpty).toContain('V');
    });
  });

  describe('Chip (M3 4-Flavor Architecture)', () => {
    it('renders assist, filter, input, and suggestion chip types', () => {
      const htmlAssist = renderToStaticMarkup(
        <Chip variant="assist" label="Share" />,
      );
      expect(htmlAssist).toContain('md-assist-chip');
      expect(htmlAssist).toContain('Share');

      const htmlFilter = renderToStaticMarkup(
        <Chip variant="filter" label="Hay Grade" selected />,
      );
      expect(htmlFilter).toContain('md-filter-chip');
      expect(htmlFilter).toContain('Hay Grade');

      const htmlInput = renderToStaticMarkup(
        <Chip variant="input" label="Farmer A" removable />,
      );
      expect(htmlInput).toContain('md-input-chip');
      expect(htmlInput).toContain('Farmer A');

      const htmlSuggestion = renderToStaticMarkup(
        <Chip variant="suggestion" label="Suggest Alfalfa" />,
      );
      expect(htmlSuggestion).toContain('md-suggestion-chip');
      expect(htmlSuggestion).toContain('Suggest Alfalfa');
    });
  });

  describe('Select (M3 Outlined and Filled Flavors)', () => {
    it('renders outlined and filled select flavors', () => {
      const options = [{ value: 'kg', label: 'Kilograms (Kg)' }];
      const htmlOutlined = renderToStaticMarkup(
        <Select label="Unit" value="kg" options={options} variant="outlined" />,
      );
      expect(htmlOutlined).toContain('md-outlined-select');
      expect(htmlOutlined).toContain('Kilograms (Kg)');

      const htmlFilled = renderToStaticMarkup(
        <Select label="Unit" value="kg" options={options} variant="filled" />,
      );
      expect(htmlFilled).toContain('md-filled-select');
    });
  });

  describe('Progress (M3 Linear and Circular)', () => {
    it('renders linear and circular progress indicators', () => {
      const htmlLinear = renderToStaticMarkup(
        <Progress type="linear" value={0.75} buffer={0.9} />,
      );
      expect(htmlLinear).toContain('md-linear-progress');

      const htmlCircular = renderToStaticMarkup(
        <Progress type="circular" indeterminate />,
      );
      expect(htmlCircular).toContain('md-circular-progress');
    });
  });

  describe('Badge (M3 Large & Dot Types)', () => {
    it('renders badge with subtle appearance and dot variant', () => {
      const htmlLarge = renderToStaticMarkup(
        <Badge sentiment="positive" appearance="subtle">
          Paid
        </Badge>,
      );
      expect(htmlLarge).toContain('hs-badge');
      expect(htmlLarge).toContain('hs-badge--subtle-positive');
      expect(htmlLarge).toContain('Paid');

      const htmlDot = renderToStaticMarkup(<Badge sentiment="negative" dot />);
      expect(htmlDot).toContain('hs-badge--dot');
    });
  });

  describe('Switch', () => {
    it('renders switch markup with md-switch web component', () => {
      const html = renderToStaticMarkup(
        <Switch checked={true} onChange={() => {}} label="Enable Sync" />,
      );
      expect(html).toContain('md-switch');
      expect(html).toContain('Enable Sync');
    });
  });

  describe('Flex & Grid', () => {
    it('renders flex and grid layout helpers', () => {
      const html = renderToStaticMarkup(
        <Flex direction="column" gap="md">
          <Grid columns={3} gap="sm">
            <div>Item 1</div>
          </Grid>
        </Flex>,
      );
      expect(html).toContain('hs-flex--dir-column');
      expect(html).toContain('hs-flex--gap-md');
      expect(html).toContain('hs-grid--cols-3');
      expect(html).toContain('hs-grid--gap-sm');
    });
  });

  describe('Text (Official M3 Typescale Roles)', () => {
    it('renders official M3 typescale variants', () => {
      const htmlTitle = renderToStaticMarkup(
        <Text variant="title-md" weight="medium">
          Section Title
        </Text>,
      );
      expect(htmlTitle).toContain('text--title-md');
      expect(htmlTitle).toContain('text--weight-medium');
      expect(htmlTitle).toContain('Section Title');

      const htmlBody = renderToStaticMarkup(
        <Text variant="body-lg" sentiment="positive">
          Active Stock: 48,500 Kg
        </Text>,
      );
      expect(htmlBody).toContain('text--body-lg');
      expect(htmlBody).toContain('text--sentiment-positive');
    });
  });

  describe('PageContainer', () => {
    it('renders container with correct spacing and padding', () => {
      const html = renderToStaticMarkup(
        <PageContainer spacing="md" bottomPadding="lg">
          <div>Page Content</div>
        </PageContainer>,
      );
      expect(html).toContain('hs-page-container');
      expect(html).toContain('hs-page-container--spacing-md');
      expect(html).toContain('hs-page-container--pb-lg');
    });
  });
});
