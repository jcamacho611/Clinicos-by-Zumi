# Public Zumi operations

Operators should watch anonymous inference for:

- request volume and rate-limit pressure
- provider errors/timeouts
- input/output token usage
- provider cost in micro-USD
- DLP blocks
- degraded-mode frequency

Do not log visitor message content merely to make those metrics easier. The implementation's structured provider telemetry deliberately excludes the prompt/transcript.

Before enabling materially higher public volume, add shared/edge rate limiting and a platform-owned anonymous-inference spend alert.
