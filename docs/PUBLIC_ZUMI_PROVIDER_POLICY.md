# Public Zumi provider policy

Public inference may use only a provider already selected through the canonical Zumi provider registry. The public service does not maintain a second credential/configuration system.

Even when a provider is selected, public requests explicitly disable web search, knowledge/file search, Code Interpreter and other optional provider tools. The model receives only the bounded, redacted public conversation plus canonical public Klinikos product context.

A provider being configured is not evidence that anonymous inference has been production-verified. Production proof requires a controlled non-sensitive public turn against the deployed merge SHA and confirmation that privacy/clinical boundary cases do not invoke the provider.
