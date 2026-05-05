// First-party telemetry sink for the product-ranker training pipeline. The
// FE batches per-card impressions, dwell, and reaction-mirror events here;
// the BE writes them as JSONL to GCS, hourly Cloud Scheduler loads them into
// BigQuery `analytics.user_events` for offline ranker training.

export type TheaWebLogEventName =
  | 'product_impression'
  | 'product_dwell'
  | 'product_saved'
  | 'product_dismissed'
  | 'product_clicked'
  | 'product_purchased'
  | 'candidate_set'
  | 'carousel_impression'
  // Bug 2 detection: a mobile OAuth redirect was initiated (marker written)
  // but no credential came back (`getRedirectResult` returned null or the
  // resulting user is still anon). Properties: `provider`, `ua`,
  // `error_code` when applicable.
  | 'auth_redirect_lost';

export interface TheaWebLogEvent {
  /** Client-generated uuid v4. Dedup key in BigQuery. */
  event_id: string;
  event_name: TheaWebLogEventName;
  /** ISO timestamp from `performance.timeOrigin + performance.now()`. */
  event_ts_client: string;
  /**
   * Free-form properties bag. The BE promotes a known set of keys
   * (session_id, recommendation_id, recipient_id, product_id, carousel_name,
   * card_position, dwell_ms, regenerate_count, relationship, occasion,
   * age_range, gender) onto top-level BQ columns; everything else is
   * preserved inside the row's `properties` JSON column for forward-compat.
   */
  properties: Record<string, unknown>;
}

export interface TheaWebLogEventsRequest {
  events: TheaWebLogEvent[];
}

export interface TheaWebLogEventsResponse {
  accepted: number;
  rejected: number;
}
