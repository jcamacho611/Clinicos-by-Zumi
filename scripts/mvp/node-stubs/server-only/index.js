// Direct Node/tsx MVP journeys execute server repositories outside the Next compiler.
// `server-only` is a compile-time boundary marker and has no runtime behavior. The
// journey runner exposes this empty marker only through NODE_PATH in its child
// processes; production/application module resolution is unchanged.
