# Public Zumi client concurrency contract

The public Living Home permits one submitted turn at a time.

- the send control is disabled while a turn is pending
- Enter does not submit a second turn while pending
- the active request owns an AbortController
- unmount aborts the active request
- the visitor's prompt is retained in the pending presentation while the server responds
- network/provider failure resolves through the deterministic fallback rather than silently dropping the turn

This is intentionally simpler than parallel chat execution: predictable ordering matters more than simultaneous anonymous turns.
