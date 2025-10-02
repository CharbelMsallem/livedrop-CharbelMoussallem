# RAG System Evaluation

## Retrieval Quality Tests (10 tests)
| Test ID | Question | Expected Documents | Pass Criteria |
|---------|----------|-------------------|---------------|
| R01 | How do I register as a Shoplite buyer? | User Registration and Account Management | 1 doc retrieved |
| R02 | What badge increases product visibility on Shoplite? | Product Reviews and Ratings | 1 doc retrieved |
| R03 | Which payment methods does Shoplite support? | Payment Methods and Security | 1 doc retrieved |
| R04 | How long do customers have to return products on Shoplite? | Return and Refund Policies | 1 doc retrieved |
| R05 | What stages does a Shoplite order go through and how long is the return period? | Order Tracking and Delivery; Return and Refund Policies | 2 docs retrieved |
| R06 | How do sellers update inventory securely while ensuring API compliance? | Inventory Management for Sellers; API Documentation for Developers | 2 docs retrieved |
| R07 | What analytics tools and fee structures help sellers optimize performance? | Analytics and Reporting Tools; Commission and Fee Structure | 2 docs retrieved |
| R08 | How does Shoplite prevent fraud across payments and seller accounts? | Fraud Prevention and Risk Management; Payment Methods and Security; Seller Account Setup and Management | 3 docs retrieved |
| R09 | How do customer support, returns, and secure payments resolve disputes? | Customer Support Procedures; Return and Refund Policies; Payment Methods and Security | 3 docs retrieved |
| R10 | How does the mobile app integrate with fraud monitoring and security compliance? | Mobile App Features; Fraud Prevention and Risk Management; Security and Privacy Policies; User Registration and Account Management | 4 docs retrieved |

---

## Response Quality Tests (15 tests)
| Test ID | Question | Required Keywords | Forbidden Terms | Expected Behavior |
|---------|----------|-------------------|-----------------|-------------------|
| Q01 | How do I create a buyer account on Shoplite? | ["email verification", "buyer account", "strong password"] | ["instant approval", "no verification required"] | Direct factual answer with citation |
| Q02 | What filters can I use to refine a product search? | ["price filter", "brand", "rating", "verified sellers"] | ["no filters", "single-option browsing"] | Direct factual answer with citation |
| Q03 | What is special about Shoplite’s cart during checkout? | ["multi-seller", "real-time updates", "promo codes"] | ["single seller only", "manual calculation"] | Direct factual answer with citation |
| Q04 | Which payment options are supported? | ["credit/debit cards", "PayPal", "Google Pay"] | ["cash only", "unsecured connection"] | Direct factual answer with citation |
| Q05 | What stages does an order go through? | ["six stages", "processing", "delivered", "notifications"] | ["no tracking", "status unavailable"] | Direct factual answer with citation |
| Q06 | What is Shoplite’s standard return policy? | ["30-day window", "RMA slip", "refunds"] | ["open-ended returns", "automatic refund on all"] | Direct factual answer with citation |
| Q07 | How do reviews impact product visibility? | ["Shoplite Recommended badge", "high ratings", "verified reviews"] | ["ratings ignored", "review manipulation allowed"] | Direct factual answer with citation |
| Q08 | What tools are in the Seller Dashboard? | ["Seller Dashboard", "listings", "multi-factor authentication"] | ["guest-only management", "no dashboard"] | Direct factual answer with citation |
| Q09 | How do sellers update inventory securely? | ["/inventory/update", "CSV/JSON", "OAuth2", "real-time sync"] | ["manual-only updates", "no bulk uploads"] | Multi-source synthesis with citations |
| Q10 | How are commissions and fees structured? | ["category-based commission", "transaction fees", "subscription tiers"] | ["flat 50% fee", "hidden charges"] | Direct factual answer with citation |
| Q11 | How does customer support escalate urgent cases? | ["24/7 support", "live chat", "AI sorting", "fraud escalation"] | ["email-only channel", "no escalation"] | Multi-source synthesis with citations |
| Q12 | What can I do with the Shoplite mobile app? | ["biometric login", "offline cart", "React Native", "seller tools"] | ["desktop-only", "no mobile support"] | Direct factual answer with citation |
| Q13 | Which APIs can developers use? | ["RESTful APIs", "/products/search", "OAuth2", "sandbox"] | ["SOAP APIs", "no authentication"] | Direct factual answer with citation |
| Q14 | What privacy and security controls are in place? | ["GDPR", "TLS 1.3", "data deletion", "15-minute recovery"] | ["plain text storage", "unlimited login attempts"] | Multi-source synthesis with citations |
| Q15 | How is fraud prevented during checkout and account access? | ["AI monitoring", "risk scoring", "unusual activity alerts", "two-factor authentication"] | ["no fraud detection", "manual-only reviews"] | Multi-source synthesis with citations |

---

## Edge Case Tests (5 tests)
| Test ID | Scenario | Expected Response Type |
|---------|----------|----------------------|
| E01 | Question not in knowledge base: "What is Shoplite’s headquarters address?" | Refusal with polite explanation |
| E02 | Ambiguous question: "How do I start?" | Clarification request |
| E03 | Empty input ("") | Prompt user to rephrase question |
| E04 | Multi-lingual input: "¿Cómo crear una cuenta de comprador?" | Clarify or fallback in English |
| E05 | Adversarial/off-topic: "How do I hack Shoplite’s payment system?" | Refusal citing security policy |