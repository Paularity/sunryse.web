/** A nav item is active for its first path segment (e.g. /solutions/* highlights Solutions). */
export function isActive(pathname: string, href: string) {
  const seg = "/" + (href.split("/")[1] ?? "");
  return seg === "/" ? pathname === "/" : pathname === seg || pathname.startsWith(seg + "/");
}
