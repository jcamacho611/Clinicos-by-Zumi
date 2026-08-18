export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  if (!host || originUrl.host !== host) return false;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const requestProtocol = forwardedProto || new URL(request.url).protocol.replace(":", "");
  if (originUrl.protocol !== `${requestProtocol}:`) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  return true;
}
