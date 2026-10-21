# Firestore Security Specification

## 1. System Invariants
- All application user data (transactions, accounts, persons, budgets, savings, tasks, notes, recurring) is strictly isolated under `/users/{userId}/*`.
- Only the authenticated owner matching `request.auth.uid == userId` can read, create, update, or delete any record under `/users/{userId}/*`.
- Unauthenticated access and access across different user IDs is strictly denied by default.
- Global catch-all rule: `match /{document=**} { allow read, write: if false; }`.
- Document path IDs are strictly validated using `isValidId(id)` (`id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).

## 2. Dirty Dozen Security Attack Payloads (All Denied)
1. **Unauthenticated Read**: Attempting to read `/users/user_abc/transactions/tx_1` without auth token -> `PERMISSION_DENIED`.
2. **Unauthenticated Write**: Attempting to inject a transaction into `/users/user_abc/transactions/tx_1` without auth -> `PERMISSION_DENIED`.
3. **Cross-Tenant Document Read**: User B (`uid_2`) attempting to read `/users/uid_1/transactions/tx_1` -> `PERMISSION_DENIED`.
4. **Cross-Tenant Document Write**: User B (`uid_2`) attempting to modify `/users/uid_1/transactions/tx_1` -> `PERMISSION_DENIED`.
5. **Cross-Tenant Collection List**: User B (`uid_2`) attempting to list `/users/uid_1/transactions` -> `PERMISSION_DENIED`.
6. **Path Traversal / Junk Character Document ID**: Writing to `/users/uid_1/transactions/../../root_hack` -> `PERMISSION_DENIED`.
7. **Oversized Junk Key Injection**: Document ID with 2000 random characters -> `PERMISSION_DENIED` by `isValidId()`.
8. **Root-Level Collection Pollution**: Writing to `/transactions/tx_1` directly instead of under `/users/{userId}` -> `PERMISSION_DENIED` by global deny rule.
9. **Debt Records Cross-Tampering**: User B attempting to alter `/users/uid_1/persons/person_1` debt balance -> `PERMISSION_DENIED`.
10. **Budget Data Exfiltration**: User B attempting to read `/users/uid_1/budgets` -> `PERMISSION_DENIED`.
11. **Account Balance Falsification**: User B attempting to update `/users/uid_1/accounts/acc_cash` balance -> `PERMISSION_DENIED`.
12. **Notes/Memos Siphoning**: User B attempting to list `/users/uid_1/notes` -> `PERMISSION_DENIED`.

## 3. Rules Deployment Status
- Engine: Firebase Rules Version 2
- Deployment Status: Not verifiable from this source ZIP. Deploy and verify the rules in the target Firebase project before relying on them.

## 4. Additional User-Isolated Collections
- `/users/{userId}/categories/{categoryId}` stores the user's category setup and is owner-only.
- `/users/{userId}/trash/{trashId}` stores recoverable deleted items and is owner-only.
- These collections use the same authenticated UID check and document-ID validation as the other user subcollections.
