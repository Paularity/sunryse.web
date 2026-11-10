import { Building, ENERGY, Factory, Flow, House } from "./models";

/** The 3D model that stands for a solution type (house, office block or factory). */
export function SolutionModel({ slug }: { slug: string }) {
  if (slug === "commercial") return <Building x={-90} y={-90} h={150} />;
  if (slug === "industrial") return <Factory x={-150} y={-80} />;
  return (
    <>
      <House x={-90} y={-70} />
      <Flow from={[-92, 30]} to={[-170, 120]} color={ENERGY.home} />
    </>
  );
}
