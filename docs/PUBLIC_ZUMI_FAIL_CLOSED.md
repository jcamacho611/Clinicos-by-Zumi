# Public Zumi fail-closed rules

A public turn must not reach provider inference when any of these are true:

- the visitor asks to open/search/retrieve a private patient or clinic record
- identifier-shaped content is detected/redacted in the current message or bounded transcript
- identifier patterns remain after redaction
- the request asks for individualized diagnosis, prescribing, dosing, or treatment changes

A public turn may still receive deterministic navigation in those cases. That guidance is not evidence that a provider ran.

Provider absence/error is a degradation condition, not permission to relax privacy gates. The deterministic public navigator remains the fallback.
