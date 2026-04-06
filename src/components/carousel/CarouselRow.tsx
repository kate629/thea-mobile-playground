import React, { useRef } from 'react';
import { ProgressBar, Spinner } from 'react-bootstrap';
import ProductCard, { Product } from './ProductCard';

interface ToolCallEntry {
  iteration: number | string;
  tool: string;
  args: Record<string, any>;
  result_count: number | null;
  latency_ms: number;
  reasoning: string;
  pool_size: number;
  new_products: number;
}

interface CarouselDebug {
  tool_call_log: ToolCallEntry[];
  timing: { search_ms: number; curation_ms: number; total_ms: number; prompt_tokens?: number; output_tokens?: number; thinking_tokens?: number };
  agent_summary: string;
  product_provenance: Record<string, string>;
}

interface CarouselRowProps {
  carouselId: string;
  displayName: string;
  status: 'loading' | 'searching' | 'curating' | 'finalizing' | 'complete' | 'error';
  products: Product[];
  productCount?: number;
  targetCount?: number;
  debug?: CarouselDebug;
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

const formatMs = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const DebugPanel: React.FC<{ debug: CarouselDebug; products: Product[] }> = ({ debug, products }) => (
  <div className="carousel-debug-panel">
    <div className="debug-timing">
      <span>Search: {formatMs(debug.timing.search_ms)}</span>
      <span>Curation: {formatMs(debug.timing.curation_ms)}</span>
      <span>Total: {formatMs(debug.timing.total_ms)}</span>
      {debug.timing.prompt_tokens != null && (
        <>
          <span className="debug-tokens">Prompt: {debug.timing.prompt_tokens.toLocaleString()} tok</span>
          <span className="debug-tokens">Output: {debug.timing.output_tokens?.toLocaleString() || 0} tok</span>
          <span className="debug-tokens">Thinking: {debug.timing.thinking_tokens?.toLocaleString() || 0} tok</span>
        </>
      )}
    </div>

    {debug.tool_call_log.map((entry, i) => (
      <div key={i} className="debug-tool-entry">
        <div className="debug-tool-header">
          <span className={`debug-tool-name debug-tool-${entry.tool}`}>{entry.tool}</span>
          <span className="debug-tool-meta">
            iter {entry.iteration} | {formatMs(entry.latency_ms)} |{' '}
            {entry.result_count != null ? `${entry.result_count} results` : ''}{' '}
            {entry.new_products > 0 ? `(+${entry.new_products} new)` : ''}
            {' '}| pool: {entry.pool_size}
          </span>
        </div>
        {entry.tool !== 'curation' && entry.args && (
          <div className="debug-tool-args">
            {Object.entries(entry.args).map(([k, v]) => {
              const value = typeof v === 'object' ? JSON.stringify(v) : String(v);
              const highlight = k === 'filter_carousel_name';
              return (
                <span
                  key={k}
                  className={`debug-arg${highlight ? ' debug-arg-key-carousel' : ''}`}
                  title={`${k}: ${value}`}
                >
                  {k}: {value}
                </span>
              );
            })}
          </div>
        )}
        {entry.reasoning && (
          <div className="debug-tool-reasoning">{entry.reasoning}</div>
        )}
      </div>
    ))}

    {Object.keys(debug.product_provenance).length > 0 && (
      <div className="debug-provenance">
        <div className="debug-section-label">Product Provenance</div>
        {products.map((p) => {
          const query = debug.product_provenance[p.id];
          if (!query) return null;
          return (
            <div key={p.id} className="debug-provenance-row">
              <span className="debug-provenance-title">{p.title?.trim()}</span>
              <span className="debug-provenance-query">{query}</span>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const CarouselRow: React.FC<CarouselRowProps> = ({
  carouselId,
  displayName,
  status,
  products,
  productCount = 0,
  targetCount = 15,
  debug,
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

      {debug && <DebugPanel debug={debug} products={products} />}
    </div>
  );
};

export default React.memo(CarouselRow);
