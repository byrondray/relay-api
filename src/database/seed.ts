import { getDB } from "./client";
import { users } from "./schema/users";
import { messages } from "./schema/messages";
import { schools } from "./schema/schools";
import { communityCenters } from "./schema/communityCenters";
import { schoolsArray } from "./schoolSeedData";
import { commCenterData } from "./commCenterData";
import { v4 as uuid } from "uuid";

const db = getDB();

const seedDatabase = async () => {
  const messagesExist = (await db.select().from(messages)).length > 0;
  if (messagesExist) {
    await db.delete(messages);
  }

  const usersExist = (await db.select().from(users)).length > 0;
  if (usersExist) {
    await db.delete(users);
  }

  const schoolsExist = (await db.select().from(schools)).length > 0;
  if (schoolsExist) {
    await db.delete(schools);
  }

  schoolsArray.map(async (school) => {
    await db.insert(schools).values({
      id: uuid(),
      districtNumber: school["District Number"],
      name: school["Display Name"],
      address: school.Address,
      city: school.City,
    });
  });

  const communityCentersExist =
    (await db.select().from(communityCenters)).length > 0;
  if (communityCentersExist) {
    await db.delete(communityCenters);
  }

  commCenterData.map(async (center) => {
    await db.insert(communityCenters).values({
      id: center.id,
      name: center.name,
      address: center.address,
      lat: center.lat,
      lon: center.lon,
    });
  });

  console.log("Seeding complete");
};

seedDatabase();
