# Pricing engineering handoff

Branch: `commercial/pricing-gates-v1`

Do not start by changing prices. Start by validating current main/deployment health and running Quality on this branch.

If tests fail because existing tests expect the old `Private Workflow Review` label, update the test only if the new canonical `Clinic Operating Analysis` terminology is intentionally approved across the current product; otherwise revert the rename and keep the $500 economics.

Do not merge merely to expose `/pricing`. The value of this branch is coherent commercial truth plus safe gates.
