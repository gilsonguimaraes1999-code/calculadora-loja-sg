type CityReference = { id: string };

type CitySelections = {
  cityId: string;
  originId: string;
  destinationId: string;
};

export function normalizeCitySelections(
  cities: CityReference[],
  current: CitySelections,
): CitySelections {
  if (!cities.length) return { cityId: "", originId: "", destinationId: "" };

  const exists = (id: string) => cities.some((city) => city.id === id);
  return {
    cityId: exists(current.cityId) ? current.cityId : cities[0].id,
    originId: exists(current.originId) ? current.originId : cities[0].id,
    destinationId: exists(current.destinationId)
      ? current.destinationId
      : (cities[1]?.id ?? cities[0].id),
  };
}
