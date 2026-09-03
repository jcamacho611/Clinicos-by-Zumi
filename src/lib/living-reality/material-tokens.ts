export type LivingRealityMaterialTokens = {
  environment: string;
  object: string;
  line: string;
  attention: string;
  selected: string;
  blocked: string;
  verified: string;
};

export function readLivingRealityMaterialTokens(
  element: Element = document.documentElement,
): LivingRealityMaterialTokens {
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim();

  return {
    environment: read("--k-reality-environment"),
    object: read("--k-reality-object"),
    line: read("--k-reality-line"),
    attention: read("--k-reality-attention"),
    selected: read("--k-reality-selected"),
    blocked: read("--k-reality-blocked"),
    verified: read("--k-reality-verified"),
  };
}
