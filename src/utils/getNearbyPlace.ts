import axios from "axios";

export const getNearbyPlace = async (
  lat: number,
  lon: number
): Promise<string | null> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;

  try {
    const response = await axios.get(endpoint, {
      params: {
        location: `${lat},${lon}`,
        radius: 500,
        type: "restaurant",
        key: apiKey,
      },
    });

    const places = response.data.results;

    if (places && places.length > 0) {
      const place = places[0];
      const placeName = place.name;
      const vicinity = place.vicinity;

      const street = vicinity.split(",")[0];

      return `${placeName} on ${street}`;
    }

    console.log("No nearby places found.");
    return null;
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    return null;
  }
};
