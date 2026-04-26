/**
 * Interview Integrity — Outbound LLM API Traffic Detection Service Worker
 *
 * Intercepts all fetch() calls originating from the exam page and flags
 * requests to known AI assistant / LLM provider domains.
 *
 * Runs in a separate thread — cannot be blocked by the candidate's JavaScript.
 * The SW sends a message to the client (exam page) which then POSTs the
 * violation to /api/violation so it is persisted server-side.
 */

const LLM_DOMAINS = [
    "api.openai.com",
    "openai.com",
    "api.anthropic.com",
    "anthropic.com",
    "generativelanguage.googleapis.com",
    "aiplatform.googleapis.com",
    "api.cohere.ai",
    "cohere.ai",
    "api.mistral.ai",
    "mistral.ai",
    "api.together.xyz",
    "together.ai",
    "api.groq.com",
    "groq.com",
    "api.perplexity.ai",
    "perplexity.ai",
    "api.deepseek.com",
    "deepseek.com",
    "huggingface.co",
    "api-inference.huggingface.co",
    "replicate.com",
    "api.replicate.com",
    "claude.ai",
    "chat.openai.com",
    "bard.google.com",
    "gemini.google.com",
    "copilot.microsoft.com",
    "bing.com/chat",
    "character.ai",
    "poe.com",
    "phind.com",
    "you.com",
    "kagi.com",
];

const COOLDOWN_MAP = new Map(); // domain → last-reported timestamp
const COOLDOWN_MS = 30000;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    const hostname = url.hostname.toLowerCase();

    const matchedDomain = LLM_DOMAINS.find(
        (d) => hostname === d || hostname.endsWith(`.${d}`)
    );

    if (matchedDomain) {
        const now = Date.now();
        const lastReport = COOLDOWN_MAP.get(matchedDomain) ?? 0;

        if (now - lastReport > COOLDOWN_MS) {
            COOLDOWN_MAP.set(matchedDomain, now);

            // Notify all clients (the exam page) so it can POST the violation
            self.clients.matchAll({ type: "window" }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: "LLM_API_DETECTED",
                        domain: matchedDomain,
                        url: url.origin + url.pathname,
                        timestamp: new Date().toISOString(),
                    });
                });
            });
        }

        // Block the request — return a 403 response
        event.respondWith(
            new Response(
                JSON.stringify({ error: "Blocked by interview integrity monitor" }),
                {
                    status: 403,
                    headers: { "Content-Type": "application/json" },
                }
            )
        );
        return;
    }

    // All other requests pass through normally
    event.respondWith(fetch(event.request));
});
