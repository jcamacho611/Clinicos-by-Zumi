# Grid identity persistence RED checkpoint

The first implementation task intentionally begins with failing tests before production code changes.

Expected RED reasons:

- public listing request still returns to the listing after login instead of the authenticated Grid need composer;
- authenticated Grid need page does not yet accept or resolve `listingId` context;
- `safeReturnTo` already supports the intended same-origin route and should remain green.
