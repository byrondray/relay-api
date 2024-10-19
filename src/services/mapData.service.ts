import { sql } from "drizzle-orm";
import { getDB } from "../database/client";
import { communityCenters } from "../database/schema/communityCenters";
import { schools } from "../database/schema/schools";
import { calculateDistance } from "../utils/findDistance";

let db = getDB();

export const getCommunityCenters = async (lat: number, lon: number) => {
  const centers = await db.select().from(communityCenters);

  const centersWithDistance = centers.map((center) => ({
    ...center,
    distance: calculateDistance(lat, lon, center.lat, center.lon),
  }));

  centersWithDistance.sort((a, b) => a.distance - b.distance);

  return centersWithDistance;
};

export const filterSchoolsByName = async (input: string) => {
  if (!input) return [];

  const lowercasedInput = input.toLowerCase();

  const filteredSchools = await db
    .select()
    .from(schools)
    .where(sql`LOWER(${schools.name}) LIKE ${`${lowercasedInput}%`}`)
    .limit(10);

  return filteredSchools;
};
