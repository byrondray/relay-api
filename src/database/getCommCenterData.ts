const https = require("https");
import { v4 as uuid } from "uuid";

const url =
  "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/community-centres/records?limit=70";

interface ApiResponse {
  on(event: string, listener: (chunk: any) => void): this;
}

interface GeoPoint2D {
  lon: number;
  lat: number;
}

interface Geometry {
  coordinates: [number, number];
  type: "Point";
}

interface GeomFeature {
  type: "Feature";
  geometry: Geometry;
  properties: Record<string, unknown>;
}

interface CommunityCenter {
  name: string;
  address: string;
  urllink: string;
  geom: GeomFeature;
  geo_local_area: string;
  geo_point_2d: GeoPoint2D;
}

https
  .get(url, (res: ApiResponse) => {
    let data = "";

    res.on("data", (chunk: string) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const jsonResult = JSON.parse(data);

        const centers = jsonResult.results.map((center: CommunityCenter) => ({
          id: uuid(),
          name: center.name,
          address: center.address,
          lat: center.geo_point_2d.lat,
          lon: center.geo_point_2d.lon,
        }));

        console.log(centers);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    });
  })
  .on("error", (error: Error) => {
    console.error("Error making request:", error);
  });
