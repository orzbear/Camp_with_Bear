# ADR 0003: JWT vs Session-Based Authentication

## Status
Accepted

## Context
We need to choose an authentication mechanism for the CampMate API. The main options are:
- JWT (JSON Web Tokens) - stateless tokens
- Session-based authentication - server-side session storage

## Decision
We will use JWT (HS256) for authentication with a 7-day expiration.

## Rationale

### Advantages of JWT
- **Stateless**: No server-side session storage required, reducing database load
- **Scalability**: Works well with horizontal scaling (no shared session store needed)
- **Mobile-friendly**: Tokens work well for mobile and SPA applications
- **Microservices**: Easy to pass tokens between services
- **Simple implementation**: No need for Redis or session management infrastructure

### Tradeoffs
- **Revocation**: Cannot easily revoke tokens before expiration (would require a blacklist)
- **Size**: Tokens are larger than session IDs (but still manageable)
- **Security**: If token is compromised, it's valid until expiration (mitigated by HTTPS and short expiration)
- **No server-side logout**: Logout is client-side only (token deletion)

### Why Not Sessions
- Requires additional infrastructure (Redis or database for session storage)
- More complex in microservices architecture
- Stateful, making horizontal scaling more complex

## Implementation Details
- Algorithm: HS256 (HMAC SHA-256)
- Expiration: 7 days
- Payload: `{ sub: userId, email }`
- Secret: Stored in environment variable `JWT_SECRET`
- Transport: Bearer token in Authorization header

## Reversibility
This decision is reversible. We could migrate to session-based auth if needed, but it would require:
- Adding session storage (Redis recommended)
- Updating all authentication middleware
- Changing token handling in frontend
- More complex deployment (session store dependency)

