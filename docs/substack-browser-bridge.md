# Substack browser connector contract (preview)

The Postmill provider is deliberately in preview. The RPA console has no Postmill service endpoint and does not yet hold a server-browser Substack account session. The adapter must not be promoted to active or deployed as a usable channel until the following contract is implemented and tested end to end.

- Operator sets `POSTMILL_SUBSTACK_BRIDGE_URL` to a fixed public HTTPS origin; only server-side Postmill uses it. The bridge needs a service-specific token scoped to exactly one connected publication. Never pass an xyOps administrator credential or engine key to Postmill.
- `GET /v1/postmill/substack/publications/:id` with `Authorization: Bearer <publication-token>` returns `{id,name,hostname,username?}` after checking the live browser account and selected publication. `hostname` must match the publication in the authenticated browser.
- `POST /v1/postmill/substack/publications/:id/publish` with the same bearer token and `Idempotency-Key` header receives `{jobId,title,body,delivery:"web-only"}`. It must persist the job ID before browser action, reject a changed payload with the same ID, execute once, and durably store the outcome. A retry must return the prior outcome without a second publication.
- Return `{status:"completed",id,url}` only after verifying a public Substack article URL belongs to that publication. Timeouts, sign-in prompts, draft saves and ambiguous outcomes must return non-2xx or a non-completed result, never a guessed URL. Browser submission must not send an email to subscribers in web-only mode.
- First connect a server-browser Substack session, then test account identity, save a draft, inspect it, and explicitly authorise a live test before enabling the provider. Add recovery checks and a rollback path before production activation.

Current adapter accepts text and title only. Media, subscriber email, paid posts, analytics and comments are outside this first version. Postmill scheduling remains the sole scheduler: the bridge executes when Postmill calls publish at the due time.
