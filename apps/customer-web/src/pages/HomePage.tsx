import { useLocation } from 'react-router-dom';
import { FloristFeed } from '../components/FloristFeed';
import { useState } from 'react';

export function HomePage() {
  const routeLocation = useLocation();
  const [orderPlaced, setOrderPlaced] = useState(
    !!(routeLocation.state as { orderPlaced?: boolean } | null)?.orderPlaced,
  );

  return (
    <FloristFeed orderPlaced={orderPlaced} onDismissOrderPlaced={() => setOrderPlaced(false)} />
  );
}
