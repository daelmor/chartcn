import { Resvg } from "@resvg/resvg-js";

export function svgToPng(svgString: string, width: number): Buffer {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: width },
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}
