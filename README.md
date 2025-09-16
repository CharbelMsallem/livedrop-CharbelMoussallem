# livedrop-CharbelMoussallem

A system where creators run limited-inventory live product drops. Users can follow creators, get real-time updates when a drop goes live or stock changes, browse products and drops across many pages of results, and place orders during a drop. Some creators are extremely popular and can drive sudden traffic spikes.

**Link to Excalidraw Canva:** https://excalidraw.com/#json=ZiS2WzLMPQZur0e9Pvqc1,GqTdLaVLUduaFmRJNY5TuQ


## Services:
**User Service:** Authentication and user management<br>
**Creator Service:** Creator profiles and content<br>
**Product Service:** Product catalog and drop scheduling<br>
**Inventory Service:** Stock control with distributed locks<br>
**Order Service:** Idempotent order processing<br>
**Payment Service:** Transaction handling with audit logs<br>
**Notification Service:** Real-time WebSocket delivery<br>

## Technical Solutions
### **Preventing Overselling**
*Inventory service uses distributed locks on Redis:*
1. Acquire lock on product stock
2. Reserve items atomically
3. Release lock after confirmation

### **Idempotent Orders**
Each order uses unique idempotency keys to prevent duplicate purchases during retries or network failures.

### **Payment Audit Logs**
All transactions generate immutable audit logs for compliance, fraud detection, and financial reporting.

## **Real-time Notifications**
WebSocket connections with load balancers deliver updates within 2 seconds. Fan-out queues handle celebrity creators with millions of followers.

## **Monitoring**
All services connect to centralized monitoring tools to track performance metrics, request volumes, and system health.

## **Database Strategy:**
-**PostgreSQL:** Orders, payments, audit logs (ACID transactions)<br>
-**MongoDB:** Products, profiles (flexible schema)<br>
-**Redis:** Caching, sessions, distributed locks<br>

## **Scaling Approach:**
-Sharded followers table by creator_id<br>
-Auto-scaling during traffic bursts (1,500 RPS)<br>
-Regional WebSocket servers<br>

## **Key Tradeoffs:**
-Distributed locks prevent overselling but create bottlenecks<br>
-Microservices enable independent scaling but add complexity<br>
-PostgreSQL + MongoDB optimal for different data types but increases infrastructure complexity<br>
-Real-time WebSockets reduce latency but increase resource usage
