# Touchpoint Specs – ShopLite

## 1. Typeahead Search Suggestions

**Problem statement**  
Shoppers often leave if they can’t quickly find what they’re looking for. This not only hurts sales but also leads to negative sentiment. Typeahead search mitigates this by surfacing relevant products as users type.  

**Happy path (8 steps)**  
1. User starts typing a product keyword (e.g., “overs...”).  
2. Frontend sends the query to the backend.  
3. Backend checks cache for a prior match.  
4. On cache miss, embeddings search across the SKU catalog (~10k products).  
5. Candidate results ranked via lightweight AI model.  
6. Top 5 matches returned in JSON format.  
7. Frontend renders suggestions directly below the search bar.  
8. User clicks a suggestion and navigates to the product page.  

**Grounding & guardrails**  
- Truth source: SKU catalog (products + metadata).  
- Query length capped at 20 tokens.  
- Guardrails: only suggest items in catalog, no hallucinations.  
- Embedding search only—no freeform generation.  

**Human-in-the-loop**  
- No real-time escalation needed.  
- Weekly review cycle to monitor bias in model outputs.  

**Latency budget**  
- Cache lookup: 50 ms  
- Embedding search: 100 ms  
- Ranking model: 120 ms  
- UI render: 30 ms  
- **Target: ≤300 ms at p95**  

**Error & fallback behavior**  
- Cache/service down → use static prefix search.  
- Full failure → show Top Sellers list.  

**PII handling**  
- No personal data collected.  
- Only query strings logged.  

**Success metrics**  
- **CTR**: clicks ÷ impressions on suggestions.  
- **Conversion uplift**: purchases via search vs. baseline.  
- **Business metric**: incremental daily revenue tied to uplift.  

**Feasibility note**  
We already have query logs and SKU metadata. A prototype can be built with embeddings, an index, and a Redis cache. First milestone: backend microservice for cache-backed typeahead.<br>
*See `/docs/ai-first/probe/probe-logs.md` (Typeahead log) for a sample run.*  

---

## 2. Support Assistant (FAQ + Order Status)

**Problem statement**  
High volumes of FAQ and order-tracking tickets slow down support teams and inflate costs. An assistant that automates ~70% of these requests can improve satisfaction while freeing up agents for complex issues.  

**Happy path (10 steps)**  
1. User opens the support chat.  
2. User asks a question (e.g., “Where is my order?”).  
3. System identifies intent: FAQ or order lookup.  
4. For FAQs → retrieve relevant entry from Policies/FAQ markdown.  
5. For orders → query order-status API with order ID.  
6. Build context (retrieved text or API response).  
7. Apply redaction (mask PII like names and addresses).  
8. Pass context to LLM with guardrails.  
9. LLM returns structured JSON answer (short, safe).  
10. User sees answer; option to escalate available.  

**Grounding & guardrails**  
- Sources: FAQ markdown + order-status API.  
- Max context: 1,000 tokens (truncated if needed).  
- Guardrails: reject off-topic requests (medical, financial, etc.).  
- No hallucination—answers must be grounded in retrieved sources.  

**Human-in-the-loop**  
- Escalation if negative sentiment, repeated failed answers, or unsupported queries.  
- UI provides “Chat with a human” button after each reply.  
- SLA: human response within 15 minutes.  

**Latency budget**  
- Intent classification: 100 ms  
- Retrieval/API call: 200 ms  
- LLM response: 800 ms  
- Render: 100 ms  
- **Target: ≤1200 ms at p95**  

**Error & fallback behavior**  
- API down → respond “Order status unavailable, please try again later.”  
- LLM timeout → auto-escalate to human.  

**PII handling**  
- Only order ID leaves the app.  
- Names/addresses redacted pre-LLM.  
- Logs store (or hash) order IDs only.  

**Success metrics**  
- **Deflection rate**: AI-resolved ÷ total tickets.  
- **CSAT**: average rating post-interaction.  
- **Business metric**: agent hours saved × hourly cost.  

**Feasibility note**  
Both FAQ markdown and order-status API are available today. Prototype can be delivered with Llama 3.1 8B Instruct for cost efficiency, or GPT-4o-mini for higher accuracy. Next step: connect retrieval pipeline to LLM with refusal guardrails.<br>
*See `/docs/ai-first/probe/probe-logs.md` (Support log) for a sample run.*