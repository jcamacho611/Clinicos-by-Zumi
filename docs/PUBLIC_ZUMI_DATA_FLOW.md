# Public Zumi data flow

```text
visitor text + bounded recent public transcript
        |
        v
same-origin/public request boundary
        |
        v
body + history limits
        |
        v
public rate-limit key
        |
        v
private-record / clinical-advice interception
        |
        v
redaction + identifier fail-closed check
        |
        +---- unsafe/sensitive ----> deterministic safe guidance / sign-in route
        |
        v
approved provider selection
        |
        +---- unavailable/error ----> deterministic public navigator
        |
        v
provider with public-only system context
(no web, file, code or authenticated tools)
        |
        v
confidential-output DLP
        |
        v
minimum public resolution DTO
        |
        v
Living Home conversation
```

No tenant identifier, patient record, authenticated memory, entitlement graph, tool graph, prompt text, provider configuration, token count, or cost value is part of the public response DTO.
