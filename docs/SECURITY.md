# Security

## Verified current security state

This section describes checked-in behavior at the legacy baseline. Live policies, identities, provider dashboards, server modules, and hosted files were not inspected in Phase 1A.

### Supabase authentication and MFA

Control Room uses Supabase email/password authentication and can enroll, challenge, verify, and remove TOTP factors. MFA is conditional on an enrolled factor and current assurance state. The frontend does not constrain access to a specific owner email or user ID.

### Current RLS limitation

The checked-in `site_content` migration enables RLS and permits public reads. Its write policy targets the entire `authenticated` role with unconditional `USING (true)` and `WITH CHECK (true)`. Authentication is therefore not owner authorization. No checked-in later migration narrows this policy.

### PHP reader limitation

`run/get_log.php` validates a bearer token by resolving a Supabase user, but does not enforce owner UID, owner email, role, or AAL2. A valid Supabase user token is sufficient according to current source.

### Secret handling

- Browser Supabase URL and anon-key values are public client configuration.
- Service-role or secret credentials must not be exposed through browser variables.
- The real PHP `secure-config.php`, environment files, logs, and local configuration are ignored and must remain untracked.
- Repository evidence does not prove live secret storage or rotation.

### Legacy HTTP and runtime controls

The public `.htaccess` represents SPA fallback, HSTS, frame denial, content-type protection, referrer policy, permissions policy, and cache rules. The PHP `.htaccess` represents config/log denial and Authorization forwarding. These controls depend on compatible live server configuration and were not live-verified in this phase.

### Known debt and fail-open observations

- Control Room has no source-enforced owner identity.
- Checked-in RLS grants broad authenticated writes.
- PHP reader authorization is broader than the intended owner boundary.
- Browser local state can change even when a remote content upsert fails.
- The public PHP writer trusts proxy-style headers without a documented trusted-proxy allowlist.
- The writer can fail silently around rate-limit temp files and sends a real address to an external geolocation service over HTTP.
- Current integration tests do not cover RLS, private administration, MFA authorization, or PHP endpoints.

No security debt was fixed in Phase 1A.

## Target security principles — not implemented

- Fail closed when identity, policy, configuration, or required bindings are unavailable.
- Combine edge authentication with runtime identity and owner-authorization verification.
- Treat same-origin checks as defense in depth for mutations, not as identity authorization.
- Validate request and stored data with strict, bounded schemas.
- Enforce owner authorization at runtime and database boundaries.
- Audit privileged reads, mutations, publication actions, and administrative failures.
- Store secrets only in provider secret bindings, never in public assets or tracked configuration.
- Isolate staging and production data, secrets, identity policy, analytics, and submission resources.
- Use forward-only migrations with explicit validation and recovery plans.
- Test both permitted and denied paths before activation.

Specific Cloudflare Access, runtime, D1, Turnstile, Resend, schema, retention, and audit implementations require future design and independent authorization.
