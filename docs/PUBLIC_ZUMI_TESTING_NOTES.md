# Public Zumi testing notes

Prefer behavior tests over source-string tests for conversational quality. Source-contract tests remain appropriate for hard security/disclosure invariants such as absence of authenticated session calls, disabled provider tools, request bounds, and DTO minimization.

Browser-level regression should explicitly type a normal sentence at the half-window width that previously collapsed the textarea.

The model-backed scenarios should assert semantic outcomes rather than exact prose so safe prompt/model improvements do not break tests for cosmetic wording changes.
