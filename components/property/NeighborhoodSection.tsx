import { getNearbyPOIs } from "@/lib/overpass";
import { NeighborhoodCard } from "./NeighborhoodCard";

interface Props {
  lat: number;
  lng: number;
}

export default async function NeighborhoodSection({ lat, lng }: Props) {
  const items = await getNearbyPOIs(lat, lng);
  if (!items.length) return null;

  return (
    <section aria-labelledby="neighborhood-heading">
      <h2
        id="neighborhood-heading"
        className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4"
      >
        Puntos de Interés
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map(({ category, name, distance, count, places }) => (
          <NeighborhoodCard
            key={name}
            category={category}
            name={name}
            distance={distance}
            count={count}
            places={places}
          />
        ))}
      </div>
    </section>
  );
}
