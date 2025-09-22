# AI Capability Map – ShopLite

| Capability | Intent (user) | Inputs (this sprint) | Risk 1–5 | p95 ms | Est. cost/action | Fallback | Selected |
|------------|---------------|----------------------|----------|-------:|-----------------:|----------|:--------:|
| Typeahead Search Suggestions | Quickly find products user types type | SKU catalog, embeddings, query logs | 2 | 300 | $0.001 | Static prefix search | Selected |
| Support Assistant (FAQ + Order Status) | User gets instant help with FAQs and orders | FAQ markdown, order-status API | 3 | 1200 | $0.02 | Escalate to human agent | Selected |
| Dynamic Pricing Advisor | See personalized and fair discounts/offers in real-time | Pricing rules, user segments, purchase history | 4 | 2000 | $0.04 | Default static pricing | Not Selected |
| Fit Advisor & Recommender (event-based) | Find items that fit user style/size based on browsing and past purchases | Event logs (clicks, add-to-cart), product metadata, size guides | 4 | 1800 | $0.03 | Default size chart / generic recommendations | Not Selected |
| Review Quality & Fraud Detection | Trust the reviews the user reads by filtering out spam/fakes | User reviews, moderation API | 5 | 2500 | $0.01 | Human moderator | Not Selected |
| Hot Picks Finder | Show what’s popular right now based on live clicks & purchases | Clickstream data, sales velocity | 3 | 1500 | $0.015 | Show default “Top sellers” list | Not Selected |


---

### Why I chose these two touchdowns

I chose **Typeahead Search Suggestions** and **Support Assistant** because they are **low-risk, high-value touchpoints** that directly improve user experience and are essential for important KPIs:  
- **Typeahead Search Suggestions** helps the user find products faster **(time)**.
- **Support Assistant** lowers the client/support response time and contact rates **(time and cost)**.<br><br>
Both are **low to medium risk** and rely on **existing data** (catalog, FAQ, order API), and can meet the assignment’s p95 latency targets. This make them easily feasable in the near-future.<br>
On the contrary, **the other touchdowns** have **high risk** and are **more costly** which makes them **better for future improvements** once the selected touchdowns are proven.