import React, { useRef } from 'react';
import { ProgressBar, Spinner } from 'react-bootstrap';
import ProductCard, { Product } from './ProductCard';

interface CarouselRowProps {
  carouselId: string;
  displayName: string;
  status: 'loading' | 'searching' | 'curating' | 'finalizing' | 'complete' | 'error';
  products: Product[];
  productCount?: number;
  targetCount?: number;
}

const SKELETON_TOTAL = 5;

const SkeletonCard: React.FC = () => (
  <div className="skeleton-card-wrapper">
    <div className="skeleton-card" style={{ width: '100%', height: '100%' }} />
  </div>
);

const statusLabel: Record<string, string> = {
  loading: 'Starting search\u2026',
  searching: 'Discovering gifts\u2026',
  curating: 'Curating picks\u2026',
  finalizing: 'Polishing your feed\u2026',
  error: 'Something went wrong',
};

const CarouselRow: React.FC<CarouselRowProps> = ({
  carouselId,
  displayName,
  status,
  products,
  productCount = 0,
  targetCount = 15,
}) => {
  const isActive = status !== 'complete' && status !== 'error';
  const skeletonCount = isActive ? Math.max(0, SKELETON_TOTAL - products.length) : 0;

  // Track when each product ID was first seen for stable animation delays
  const firstSeenRef = useRef<Map<string, number>>(new Map());
  const now = Date.now();
  products.forEach((p) => {
    if (!firstSeenRef.current.has(p.id)) {
      firstSeenRef.current.set(p.id, now);
    }
  });
  const batchBase = products.length > 0
    ? Math.min(...Array.from(firstSeenRef.current.values()))
    : now;

  const progressPct = isActive
    ? status === 'curating'
      ? 90
      : targetCount > 0
        ? Math.min(80, Math.round((productCount / targetCount) * 80))
        : 0
    : 100;

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center mb-1">
        <h5 className="mb-0 me-2">{displayName}</h5>
        {isActive && <Spinner animation="border" size="sm" />}
      </div>

      {status === 'error' && (
        <small className="text-danger d-block mb-2">{statusLabel.error}</small>
      )}

      {isActive && (
        <div className="carousel-progress-wrapper mb-2">
          <ProgressBar
            now={progressPct}
            animated
            striped={status === 'curating'}
            variant={status === 'curating' ? 'info' : 'primary'}
            className="carousel-progress-bar"
          />
          <small className="text-muted ms-2">
            {statusLabel[status] || ''}
            {status === 'searching' && ` (${productCount} found)`}
          </small>
        </div>
      )}

      <div className="carousel-row-container">
        <div className="carousel-row-products">
          {products.map((product) => {
            const seenAt = firstSeenRef.current.get(product.id) || now;
            const animationDelay = Math.min((seenAt - batchBase), 500);
            return (
              <ProductCard
                key={product.id}
                product={product}
                animationDelay={animationDelay}
              />
            );
          })}
          {Array.from({ length: skeletonCount }, (_, i) => (
            <SkeletonCard key={`skeleton-${carouselId}-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CarouselRow);
