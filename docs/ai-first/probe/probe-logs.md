# Support Assistant Probe Log

```log
[2025-09-22 14:06:01] Input: "overs"
[2025-09-22 14:06:01] Lookup: SKU catalog (mocked 10k SKUs)
[2025-09-22 14:06:01] Cache: MISS (key=typeahead:overs)
[2025-09-22 14:06:01] Embedding search: 10k → top5 in 94ms
[2025-09-22 14:06:01] Ranker: reranked 5 candidates in 23ms
[2025-09-22 14:06:01] Output: ["Oversized T-shirt", "Oversized Hoodie", "Oversized Jacket", "Oversized Jeans", "Oversized Cap"]
[2025-09-22 14:06:01] p95 budget: 300ms | this run: 157ms | cached for 15m
```


# Support Assistant Probe Log

```log
[2025-09-22 14:07:22] Input: "Where is my order 12345?"
[2025-09-22 14:07:22] Intent: ORDER_STATUS
[2025-09-22 14:07:22] PII Redaction:
   extracted → order_id=12345; name=∅; address=∅
   sanitized query → "Where is my order 12345?"
   note → only order_id leaves the app; names/addresses removed pre-LLM
[2025-09-22 14:07:23] API call → order-status {order_id:12345}
[2025-09-22 14:07:23] API response ← {order_id:12345, status:"Shipped", eta:"2 days"}
[2025-09-22 14:07:23] Output: "Your order #12345 has shipped and will arrive in ~2 days."
[2025-09-22 14:07:23] Logging: stored order_id hash=a1c3f9d87b… ; dropped PII (names/addresses)
```