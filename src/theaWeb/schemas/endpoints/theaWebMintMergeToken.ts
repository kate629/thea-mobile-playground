// Hand-mirrored from `thea-shared-schemas/schemas/theaWebMintMergeTokenRequest.json`
// and `theaWebMintMergeTokenResponse.json`.

export interface TheaWebMintMergeTokenRequest {
  // No fields — caller is identified by req.auth.uid.
  _ignored?: never;
}

export interface TheaWebMintMergeTokenResponse {
  // Opaque single-use sentinel; server stores `{fromUid, expiresAt}` keyed by it.
  token: string;
  // Unix-ms expiration so callers can short-circuit if they sat on the token too long.
  expiresAt: number;
}
