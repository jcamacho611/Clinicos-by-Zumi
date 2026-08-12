# Commercial test matrix

- unpaid production org -> paid core route/action: blocked with PAYMENT_REQUIRED.
- paid org, missing module -> module action: ADD_ON_REQUIRED/UPGRADE_REQUIRED.
- paid + entitled + allowance -> variable vendor action: reserve then execute then reconcile.
- allowance exhausted + prepaid -> consume prepaid.
- allowance/prepaid exhausted + bounded overage -> consume only within bound.
- no funding -> vendor call not invoked.
- governance failure + valid payment -> action remains blocked; no purchase-around path.
- purchased connector + missing readiness -> CONNECTION_PENDING.
- expired subscription -> fail closed.
- synthetic demo -> no live PHI connector/vendor spend outside explicit cap.
- Grid unverified regulated participant + Pro payment -> still ineligible.
- Grid eligible completed transaction -> fee from server resource-class policy.
- Grid fee policy flat/percentage/zero -> all supported without UI hardcode.
- annual plan -> correct price; implementation unchanged unless explicit promotion.
