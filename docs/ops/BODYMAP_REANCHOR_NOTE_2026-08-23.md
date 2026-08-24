# BodyMap Persistence Re-anchor Note — 2026-08-23

PR #288 must be reconciled with the latest protected `main` before release. Its clinical persistence files are additive and do not replace the merged BodyMap comparator, Current Visit convergence, identity foundation, or release migration guard.

Release ordering is now explicit:

1. latest main + migration safety boundary;
2. fresh disposable migration proof from production shape;
3. exact-head code/repository evidence;
4. controlled production migration operation;
5. production post-migration verification;
6. application release with Render migration status only.

No ordinary Render build is permitted to apply the BodyMap migration automatically.
