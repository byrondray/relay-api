// seedGroups.ts

import { v4 as uuid } from "uuid";
import { getDB } from "./client";
import { schools } from "./schema/schools";
import { communityCenters } from "./schema/communityCenters";
import { groups } from "./schema/groups";
import { schoolsArray } from "./schoolSeedData";
import { commCenterData } from "./commCenterData";

const db = getDB();

const seedGroups = async () => {
  const schoolIds = [];
  const communityCenterIds = [];

  // Seed schools
  for (const school of schoolsArray) {
    const result = await db
      .insert(schools)
      .values({
        id: uuid(),
        districtNumber: school["District Number"],
        name: school["Display Name"],
        address: school.Address,
        city: school.City,
      })
      .returning();
    schoolIds.push(result[0].id);
  }

  // Seed community centers
  for (const center of commCenterData) {
    const result = await db
      .insert(communityCenters)
      .values({
        id: uuid(),
        name: center.name,
        address: center.address,
        lat: center.lat,
        lon: center.lon,
      })
      .returning();
    communityCenterIds.push(result[0].id);
  }

  // Create groups for each school
  await Promise.all(
    schoolIds.map(async (schoolId, index) => {
      await db.insert(groups).values({
        id: uuid(),
        name: schoolsArray[index]["Display Name"],
        schoolId: schoolId,
        communityCenterId: null,
      });
    })
  );

  // Create groups for each community center
  await Promise.all(
    communityCenterIds.map(async (communityCenterId, index) => {
      await db.insert(groups).values({
        id: uuid(),
        name: commCenterData[index].name,
        schoolId: null,
        communityCenterId: communityCenterId,
      });
    })
  );

  console.log(
    "Seeding complete: Created groups for each school and community center."
  );
};

seedGroups().catch((error) => console.error("Error seeding groups:", error));
