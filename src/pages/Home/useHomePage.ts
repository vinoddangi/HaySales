import { useNavigate } from 'react-router-dom';

export interface FeaturedProduct {
  id: string;
  title: string;
  subtitle: string;
  pricePerKg: number;
  stockKg: number;
}

export const featuredProducts: FeaturedProduct[] = [
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

export const useHomePage = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleNewSale = () => {
    navigate('/sales');
  };

  const handleLedger = () => {
    navigate('/ledger');
  };

  const handlePurchases = () => {
    navigate('/purchases');
  };

  const handleActivity = () => {
    navigate('/activity');
  };

  return {
    featuredProducts,
    handleNavigate,
    handleNewSale,
    handleLedger,
    handlePurchases,
    handleActivity,
  };
};
