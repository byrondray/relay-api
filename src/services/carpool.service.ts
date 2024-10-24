import { getDB } from "../database/client";
import { carpools } from "../database/schema/carpool";
import { requests } from "../database/schema/carpoolRequests";
import { and, eq, gte, lte } from "drizzle-orm";

const db = getDB();

export const getActiveCarpoolMembers = async (carpoolId: string) => {
  const now = new Date();
  const twoHoursFromNow = new Date(
    now.getTime() + 2 * 60 * 60 * 1000
  ).toISOString();

  const result = await db
    .select({ userId: requests.parentId })
    .from(requests)
    .innerJoin(carpools, eq(requests.carpoolId, carpools.id))
    .where(
      and(
        eq(requests.carpoolId, carpoolId),
        eq(requests.isApproved, 1),
        gte(carpools.departureTime, now.toISOString()),
        lte(carpools.departureTime, twoHoursFromNow)
      )
    );

  return result;
};
