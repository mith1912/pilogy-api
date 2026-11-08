# Vercel WAF setup — manual deployment procedure

Status: **DOCUMENTATION ONLY. No live rules were created or changed.** The account, project plan, existing rules, billing consent and operator permissions have not been inspected. Treat enforcement as inactive until a project operator verifies it.

## Capability and plan check

Official documentation checked for Task 06 lists fixed-window rate limiting on all plans: Hobby permits one rate-limit rule, Pro 40, Enterprise 250; token buckets are Enterprise-only. Counters are regional rather than a single worldwide quota. Two independent policies therefore exceed Hobby’s one-rule allowance. Verify the current dashboard entitlement and existing rule usage before proceeding. [Official rate-limit capabilities](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

Configuration changes require an appropriate administrator/member/security role and can take effect without redeployment. Review existing rule ordering and bypasses; an earlier bypass may defeat a later limit. Do not grant broad bypasses to mobile user agents or client-supplied identifiers. [Custom rules and access roles](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules).

## Proposed rule specifications

These thresholds are starting recommendations supplied for this project, not traffic-derived limits. Use trusted WAF IP identification, not an application parser of arbitrary X-Forwarded-For headers. Do not key counters by names, dates, query strings or a Flutter-embedded secret.

| Field | Calculate | Public articles and definitions |
| --- | --- | --- |
| Name | numerology-calculate-ip-minute | numerology-content-ip-minute |
| Method condition | POST | GET or HEAD |
| Path condition | exactly /api/v1/numerology/calculate | exactly /api/v1/numerology/definitions OR prefix /api/v1/numerology/interpretations/ |
| Counter key | IP only | IP only, shared across matching content paths |
| Window | 60 seconds | 60 seconds |
| Request limit | 30 | 120 |
| Initial action after threshold | Log | Log |
| Enforcement action after observation | Default 429 | Default 429 |

Add an exact host condition if needed to avoid unintended domains/environments. Confirm whether the chosen project’s rule editor can express the content OR group combined with the method/host AND group. If not, separate content rules require another available rule slot. Do not silently change the intended bucket to a separate 120-request allowance per dynamic article URL.

## Dashboard steps

1. Open the intended project → **Firewall → Configure → + New Rule**.
2. Enter the rule name and the conditions from the table; inspect grouping carefully.
3. Choose **Rate Limit → Fixed Window**, window **60s**, the specified request limit, and **IP** as the counting key.
4. For the threshold action, choose **Log** initially. Review any pricing consent screen.
5. **Save Rule → Review Changes**. Confirm host/path/method scope and rule order; **Publish** only with the project operator’s approval.
6. Observe the rule in the Firewall overview’s custom-rule traffic grouping.
7. After false-positive review, edit the threshold action to **Default (429)**, review and publish again.

The documented dashboard flow supports log-first rollout and explicit publication. Logging does not block requests. [Official setup flow](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

## Safe testing and false-positive monitoring

Use an explicitly authorized preview/dedicated test project, with the same rule configuration and a temporary test domain where appropriate. Do not aim this repository’s benchmark at production or assume localhost proves edge enforcement. Our benchmark intentionally only accepts localhost.

For a narrowly scoped test rule, send a bounded series just over its threshold from one test IP within a window, verify below-threshold success, threshold Log events, and later actual 429 blocking. Verify a different IP is not affected and the bucket clears on the next window. Fixed windows permit bursts across window boundaries; regional counters are not a global per-person budget. Check how HEAD, trailing slash canonicalization, custom domains and alternate deployment hostnames interact with matching. Do not copy PII into test URLs or rule descriptions.

Observe normal traffic through at least a representative mobile usage cycle before enforcement. Compare logged threshold events with function status/duration trends. Shared carrier NAT, offices, families and device retries can aggregate many people behind one IP; test on a shared mobile connection and review carrier/network/region patterns. Prefer increasing a threshold, reducing retry storms, or narrowing an erroneous match over persistent IP bans. Native Flutter clients cannot reliably solve browser challenges, so use 429 rather than Challenge for these APIs.

Watch both rules separately: rate of threshold events, legitimate requests rejected, latency, function usage and user reports. Configure alerts only after checking available project capabilities and operator approval. No monitoring rule or alert is claimed active. [Firewall observability](https://vercel.com/docs/vercel-firewall/firewall-observability).

## Cost and unavailable-capability handling

The inspected pricing page shows an example rate-limit price of **$0.50 per million allowed requests**; pricing can vary by region/contract and the dashboard is authoritative. Mitigated deny/challenge/rate-limit traffic is excluded from CDN Requests/Fast Data Transfer billing, but allowed traffic still uses ordinary hosting resources. Do not treat WAF as a complete spending cap. Check included allowance, spending controls and billing before enabling paid features. [Official usage and pricing](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing).

If the account exposes only one available rule, prioritizing Calculate at 30/minute leaves the public-content policy unenforced. That is a documented partial deployment, not equivalent protection. Obtain approval for a plan with enough rules, a separately approved compatible policy, or an externally managed distributed limiter/edge provider. If the feature is unavailable despite the public docs, verify account restrictions with Vercel support. Redis/Upstash, another provider, paid upgrades and infrastructure changes require explicit approval; none was installed. Never replace unavailable distributed enforcement with an instance-local Map.

## Rollback

Capture the previous rule settings and existing order before publishing. If legitimate traffic is blocked, change the affected threshold action back to Log or disable that exact rule, review and publish. Avoid disabling unrelated protections or adding a blanket bypass. Confirm legitimate requests recover, retain sanitized aggregate evidence, and reassess scope/threshold before re-enabling. Changes are operator actions; this task did not execute them.

## Flutter behavior

WAF runs before the application; its 429 may be HTML/plain text and may omit Retry-After. Branch on HTTP 429 before JSON decoding. Honor a valid Retry-After (delta seconds or HTTP date), cap waits and retries, and otherwise use bounded exponential backoff with jitter. Keep the same explicit referenceDate across retries and do not retry in a tight loop. The application formatter supports JSON RATE_LIMIT_EXCEEDED with Retry-After for a future real enforcement integration; the formatter alone does not enforce a quota.

## Additional method-deny proposal after local TRACE finding

Local production tests found framework 500 responses for TRACE before application handlers. The operator should consider a separate rule scoped to the intended API host and prefix /api/v1/ with Method exactly TRACE, action Deny, starting with Log observation if appropriate. Check available custom-rule slots and ordering; do not broadly deny POST on the Calculate path. This proposed edge mitigation is not active, is not a rate limiter, and may return 403 rather than application 405. Verify provider behavior on an authorized preview and pursue a compatible Next.js fix. Do not mark the five failing local TRACE assertions PASS merely because a rule was documented.
