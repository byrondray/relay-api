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
        key: apiKey,
      },
    });

    const places = response.data.results;

    if (places && places.length > 0) {
      return places[0].name;
    }

    console.log("No nearby places found.");
    return null;
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    return null;
  }
};
