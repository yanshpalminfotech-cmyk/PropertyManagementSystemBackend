---
trigger: always_on
---

ROUTE IMPLEMENTATION FLOW
ROUTE PLAN: <METHOD> /path

1. REQUEST
   - Who can call this (roles/auth required?)
   - Input: params / query / body fields with types

2. VALIDATIONS
   - DTO rules
   - Business logic checks (existence, ownership, state)

3. LOGIC STEPS
   - Step by step what the service will do
   - Any transactions, locks, or external calls

4. RESPONSE
   - Success shape and HTTP status
   - Possible error responses with status codes

5. SIDE EFFECTS
   - Any DB writes beyond the main operation
   - Cache invalidation, events, etc.