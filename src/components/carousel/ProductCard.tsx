import React from 'react';
import { Card } from 'react-bootstrap';

export interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  images?: string[];
  description?: string;
  url?: string;
}

interface ProductCardProps {
  product: Product;
  animationDelay: number;
}

const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, animationDelay }) => {
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;

  const cardContent = (
    <Card
      className="product-card h-100"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {imageUrl ? (
        <Card.Img
          variant="top"
          src={imageUrl}
          alt={product.title}
          style={{ height: 180, objectFit: 'cover' }}
        />
      ) : (
        <div className="product-image-placeholder">No Image</div>
      )}
      <Card.Body className="p-2">
        <div className="product-card-title">{product.title}</div>
        {product.brand && (
          <small className="text-muted d-block mb-1">{product.brand}</small>
        )}
        <strong>{formatPrice(product.price)}</strong>
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem', opacity: 0.5 }}>{product.id}</small>
      </Card.Body>
    </Card>
  );

  return (
    <div className="product-card-wrapper">
      {product.url ? (
        <a href={product.url} target="_blank" rel="noopener noreferrer"
           style={{ textDecoration: 'none', color: 'inherit' }}>
          {cardContent}
        </a>
      ) : cardContent}
    </div>
  );
};

export default React.memo(ProductCard, (prev, next) =>
  prev.product.id === next.product.id
  && prev.animationDelay === next.animationDelay
);
