### Q01: How do I register as a Shoplite buyer?
**Expected retrieval context:** Document 1: User Registration and Account Management  
**Authoritative answer:** Buyers register with an email, strong password, and optional phone number, then confirm through an email verification link valid for 24 hours. Accounts are secured with hashed passwords and optional two-factor authentication.  
**Required keywords in LLM response:** ["email verification", "buyer account", "strong password"]  
**Forbidden content:** ["no verification required", "instant approval", "social login only"]

---

### Q02: What filters are available to refine a product search on Shoplite?
**Expected retrieval context:** Document 2: Product Search and Filtering Features  
**Authoritative answer:** Customers can filter search results by price, category, brand, rating, and shipping speed. Advanced filters include eco-friendly products and verified sellers, with results sortable by relevance, price, or ratings.  
**Required keywords in LLM response:** ["price filter", "brand", "rating", "verified sellers"]  
**Forbidden content:** ["no filters", "filters disabled", "single-option browsing"]

---

### Q03: What unique feature does Shoplite’s shopping cart provide?
**Expected retrieval context:** Document 3: Shopping Cart and Checkout Process  
**Authoritative answer:** Shoplite’s cart allows multi-seller purchases in a single checkout. Totals update in real time to reflect discounts, shipping fees, and applied promo codes.  
**Required keywords in LLM response:** ["multi-seller", "real-time updates", "promo codes"]  
**Forbidden content:** ["single seller only", "manual calculation", "no discount support"]

---

### Q04: Which payment methods does Shoplite support?
**Expected retrieval context:** Document 4: Payment Methods and Security  
**Authoritative answer:** Shoplite supports credit/debit cards, PayPal, Apple Pay, Google Pay, regional e-wallets, and cash on delivery in select markets.  
**Required keywords in LLM response:** ["credit/debit cards", "PayPal", "Google Pay"]  
**Forbidden content:** ["Bitcoin only", "bank transfers required", "cash payments only"]

---

### Q05: What stages does a Shoplite order go through after placement?
**Expected retrieval context:** Document 5: Order Tracking and Delivery  
**Authoritative answer:** Orders progress through six stages: processing, packaging, shipping, in transit, out for delivery, and delivered. Customers are notified at each stage through email or push alerts.  
**Required keywords in LLM response:** ["six stages", "processing", "delivered", "notifications"]  
**Forbidden content:** ["no tracking", "status unavailable", "delivery guesswork"]

---

### Q06: How long do customers have to return products on Shoplite?
**Expected retrieval context:** Document 6: Return and Refund Policies  
**Authoritative answer:** Most items can be returned within a 30-day window. Customers initiate returns through the dashboard to generate an RMA slip and prepaid label. Refunds are processed within 7–10 business days.  
**Required keywords in LLM response:** ["30-day window", "RMA slip", "refunds"]  
**Forbidden content:** ["returns blocked", "open-ended returns", "automatic refund on all"]

---

### Q07: What badge increases product visibility on Shoplite?
**Expected retrieval context:** Document 7: Product Reviews and Ratings  
**Authoritative answer:** Products with consistently high ratings may earn the “Shoplite Recommended” badge, which boosts their visibility in search results and categories.  
**Required keywords in LLM response:** ["Shoplite Recommended badge", "high ratings"]  
**Forbidden content:** ["no badges", "review manipulation allowed", "ratings ignored"]

---

### Q08: What dashboard do sellers use to manage their Shoplite business?
**Expected retrieval context:** Document 8: Seller Account Setup and Management  
**Authoritative answer:** Sellers use the Seller Dashboard to upload product listings, manage performance analytics, and configure staff permissions. Security features include multi-factor authentication.  
**Required keywords in LLM response:** ["Seller Dashboard", "listings", "multi-factor authentication"]  
**Forbidden content:** ["no dashboard", "guest-only management", "staff access blocked"]

---

### Q09: How do sellers update inventory while ensuring data security?
**Expected retrieval context:** Document 9: Inventory Management for Sellers + Document 13: API Documentation for Developers  
**Authoritative answer:** Sellers can bulk update inventory with CSV/JSON files or synchronize in real time using the `/inventory/update` API. OAuth2 authentication ensures secure access, while stock alerts prevent overselling.  
**Required keywords in LLM response:** ["/inventory/update", "CSV/JSON", "OAuth2", "real-time sync"]  
**Forbidden content:** ["manual-only updates", "API without security", "no bulk uploads"]

---

### Q10: How are Shoplite’s commissions and fees structured?
**Expected retrieval context:** Document 10: Commission and Fee Structure  
**Authoritative answer:** Shoplite charges category-based commissions (5% for electronics, up to 10% for apparel), plus transaction and optional listing fees. Sellers may choose tiered subscriptions to lower commissions and access more features.  
**Required keywords in LLM response:** ["category-based commission", "transaction fees", "subscription tiers"]  
**Forbidden content:** ["flat 50% fee", "hidden charges", "no commission transparency"]

---

### Q11: What customer support options are available and how are urgent cases handled?
**Expected retrieval context:** Document 11: Customer Support Procedures + Document 17: Fraud Prevention and Risk Management  
**Authoritative answer:** Shoplite offers 24/7 support through live chat, email, phone, and a help center. AI sorts tickets automatically and escalates urgent fraud or payment issues to specialists.  
**Required keywords in LLM response:** ["24/7 support", "live chat", "AI sorting", "fraud escalation"]  
**Forbidden content:** ["support restricted", "email-only channel", "no escalation process"]

---

### Q12: What features does the Shoplite mobile app provide to buyers and sellers?
**Expected retrieval context:** Document 12: Mobile App Features + Document 8: Seller Account Setup and Management  
**Authoritative answer:** The app supports biometric logins, offline cart syncing, push notifications, and browsing for buyers. Sellers can manage listings and orders. It is built with React Native for real-time synchronization.  
**Required keywords in LLM response:** ["biometric login", "offline cart", "React Native", "seller tools"]  
**Forbidden content:** ["desktop-only", "seller access disabled", "no mobile support"]

---

### Q13: Which APIs can developers use to integrate Shoplite into external systems?
**Expected retrieval context:** Document 13: API Documentation for Developers + Document 9: Inventory Management for Sellers  
**Authoritative answer:** Developers can access RESTful APIs like `/products/search`, `/inventory/update`, `/orders/{id}/tracking`, and `/fees/report`. All APIs require OAuth2 and include sandbox environments for testing.  
**Required keywords in LLM response:** ["RESTful APIs", "/products/search", "OAuth2", "sandbox"]  
**Forbidden content:** ["SOAP APIs", "no authentication", "unlimited requests"]

---

### Q14: How does Shoplite protect privacy and handle account recovery?
**Expected retrieval context:** Document 14: Security and Privacy Policies + Document 1: User Registration and Account Management  
**Authoritative answer:** Shoplite complies with GDPR and CCPA, encrypts traffic with TLS 1.3, and uses role-based access. Forgotten passwords are reset via a 15-minute recovery link, while repeated failed logins lock the account temporarily.  
**Required keywords in LLM response:** ["GDPR", "TLS 1.3", "data deletion", "15-minute recovery"]  
**Forbidden content:** ["no compliance", "plain text storage", "unlimited login attempts"]

---

### Q15: How do promotional codes and reviews work together to boost visibility?
**Expected retrieval context:** Document 15: Promotional Codes and Discounts + Document 7: Product Reviews and Ratings  
**Authoritative answer:** Promotional codes encourage purchases, while verified reviews and the “Shoplite Recommended” badge increase visibility. Combined, they improve product ranking and customer trust.  
**Required keywords in LLM response:** ["promo codes", "verified reviews", "Shoplite Recommended badge", "ranking"]  
**Forbidden content:** ["fake reviews allowed", "promo codes unrestricted", "ranking unaffected"]

---

### Q16: What analytics tools help sellers optimize sales performance?
**Expected retrieval context:** Document 16: Analytics and Reporting Tools + Document 10: Commission and Fee Structure  
**Authoritative answer:** Sellers use real-time dashboards and predictive analytics to monitor sales and customer trends. They can export CSV/Excel/JSON reports and analyze commissions via integrated fee reports.  
**Required keywords in LLM response:** ["real-time dashboards", "predictive analytics", "CSV/Excel/JSON exports", "fee reports"]  
**Forbidden content:** ["manual logs only", "analytics disabled", "commission hidden"]

---

### Q17: How does Shoplite prevent fraud in both payments and seller accounts?
**Expected retrieval context:** Document 17: Fraud Prevention and Risk Management + Document 4: Payment Methods and Security + Document 8: Seller Account Setup and Management  
**Authoritative answer:** Shoplite uses AI-driven monitoring, risk scoring, unusual activity alerts, and two-factor authentication to detect and prevent fraud. High-risk orders may require verification before processing.  
**Required keywords in LLM response:** ["AI monitoring", "risk scoring", "unusual activity alerts", "two-factor authentication"]  
**Forbidden content:** ["no fraud detection", "manual-only reviews", "instant approvals"]

---

### Q18: What delivery options and preferences can customers choose?
**Expected retrieval context:** Document 5: Order Tracking and Delivery + Document 3: Shopping Cart and Checkout Process  
**Authoritative answer:** Customers can choose standard delivery (3–7 days), express, or same-day delivery in some regions. In-store pickup and delivery preferences such as requiring a signature are also supported.  
**Required keywords in LLM response:** ["standard delivery", "express", "same-day", "delivery preferences"]  
**Forbidden content:** ["pickup only", "delivery unavailable", "shipping restricted"]

---

### Q19: How do customer support, returns, and payment security work together to resolve disputes?
**Expected retrieval context:** Document 11: Customer Support Procedures + Document 6: Return and Refund Policies + Document 4: Payment Methods and Security + Document 17: Fraud Prevention and Risk Management  
**Authoritative answer:** Customers initiate returns with an RMA slip, while 24/7 support agents guide the process. Refunds are tied to secure payment methods and fraud detection ensures disputes are verified before funds are released.  
**Required keywords in LLM response:** ["RMA slip", "24/7 support", "secure payments", "fraud detection", "refunds"]  
**Forbidden content:** ["support unavailable", "refunds automatic", "returns blocked", "insecure payments"]

---

### Q20: How does the mobile app integrate with fraud detection and security compliance?
**Expected retrieval context:** Document 12: Mobile App Features + Document 17: Fraud Prevention and Risk Management + Document 14: Security and Privacy Policies + Document 1: User Registration and Account Management  
**Authoritative answer:** The mobile app uses biometric logins, TLS 1.3 encryption, and push alerts for unusual activity. Fraud monitoring works with GDPR-compliant account recovery, requiring verification before account access is restored.  
**Required keywords in LLM response:** ["biometric logins", "push alerts", "TLS 1.3", "fraud monitoring", "GDPR compliance"]  
**Forbidden content:** ["no security features", "no compliance", "manual-only monitoring", "alerts disabled"]
