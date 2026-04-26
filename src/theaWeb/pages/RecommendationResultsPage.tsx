import React from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';
import ProductCard from '../../components/carousel/ProductCard';
import { useRecommendationDoc } from '../hooks/useRecommendationDoc';
import type { RecommendationCarousel, RecommendationProduct } from '../schemas';

interface CarouselRowProps {
  carouselKey: string;
  carousel: RecommendationCarousel;
}

const SKELETON_COUNT = 4;

const CarouselRow: React.FC<CarouselRowProps> = ({ carouselKey, carousel }) => {
  const isLoading = carousel.products.length === 0;

  return (
    <section className="mb-5" data-carousel-key={carouselKey}>
      <h3 className="mb-3">{carousel.displayName}</h3>
      <div className="d-flex flex-row flex-nowrap overflow-auto gap-3">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-light rounded"
                style={{ minWidth: 220, height: 280 }}
              />
            ))
          : carousel.products.map((product, i) => (
              <div key={product.id} style={{ minWidth: 220 }}>
                <ProductCard product={toCardProduct(product)} animationDelay={i * 60} />
              </div>
            ))}
      </div>
    </section>
  );
};

const RecommendationResultsPage: React.FC = () => {
  const { recipientId, recommendationId } = useParams<{
    recipientId: string;
    recommendationId: string;
  }>();
  const { doc, loading, error } = useRecommendationDoc(recipientId, recommendationId);

  if (!recipientId || !recommendationId) {
    return (
      <Alert variant="danger" className="mt-4">
        Missing recipient or recommendation in URL.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-4">
        Couldn't load this recommendation: {error.message}
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (!doc) {
    return (
      <Alert variant="warning" className="mt-4">
        This recommendation doesn't exist (or you don't have access).
      </Alert>
    );
  }

  const carousels = doc.carouselOrder.filter((key) => key in doc.carousels);

  return (
    <div className="recommendation-results-page py-4">
      <header className="mb-4">
        <h2>Gift ideas for {doc.recipientSnapshot.name}</h2>
        {doc.status === 'PROCESSING' && (
          <small className="text-muted d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" /> Still finishing&hellip;
          </small>
        )}
        {doc.status === 'FAILED' && (
          <Alert variant="danger" className="mt-2">
            Something went wrong: {doc.errorMessage || 'unknown error'}
          </Alert>
        )}
      </header>

      {carousels.length === 0 && doc.status === 'PROCESSING' && (
        <p className="text-muted">Setting up your carousels&hellip;</p>
      )}
      {carousels.length === 0 && doc.status === 'COMPLETED' && (
        <Alert variant="warning">No recommendations were generated for this submission.</Alert>
      )}

      {carousels.map((key) => (
        <CarouselRow key={key} carouselKey={key} carousel={doc.carousels[key]} />
      ))}
    </div>
  );
};

// ProductCard expects a slightly leaner type; pass through compatible fields.
function toCardProduct(p: RecommendationProduct) {
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    brand: p.brand,
    images: p.images,
    description: p.description,
    agent_why: p.agent_why,
    url: p.url,
  };
}

export default RecommendationResultsPage;
