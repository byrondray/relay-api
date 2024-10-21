import { getDB } from "./client";
import { users } from "./schema/users";
import { messages } from "./schema/messages";
import { schools } from "./schema/schools";
import { communityCenters } from "./schema/communityCenters";
import { children } from "./schema/children";
import { groups } from "./schema/groups";
import { usersToGroups } from "./schema/usersToGroups";
import { schoolsArray } from "./schoolSeedData";
import { commCenterData } from "./commCenterData";
import { faker } from "@faker-js/faker";
import { v4 as uuid } from "uuid";

const db = getDB();

const seedDatabase = async () => {
  const schoolIds = [];
  const userIds = [];
  const groupIds = [];
  const communityCenterIds = [];

  await db.delete(messages);
  await db.delete(users);
  await db.delete(children);
  await db.delete(groups);
  await db.delete(usersToGroups);

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

  for (const center of commCenterData) {
    const result = await db
      .insert(communityCenters)
      .values({
        id: center.id,
        name: center.name,
        address: center.address,
        lat: center.lat,
        lon: center.lon,
      })
      .returning();
    communityCenterIds.push(result[0].id);
  }

  for (let i = 0; i < 10; i++) {
    const user = await db
      .insert(users)
      .values({
        id: uuid(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        city: "Vancouver",
        expoPushToken: faker.string.uuid(),
      })
      .returning();
    userIds.push(user[0].id);
  }

  for (let i = 0; i < 5; i++) {
    const group = await db
      .insert(groups)
      .values({
        id: uuid(),
        name: faker.lorem.words(2),
      })
      .returning();
    groupIds.push(group[0].id);
  }

  for (let i = 0; i < 20; i++) {
    await db.insert(usersToGroups).values({
      id: uuid(),
      userId: faker.helpers.arrayElement(userIds),
      groupId: faker.helpers.arrayElement(groupIds),
    });
  }

  for (let i = 0; i < 10; i++) {
    await db.insert(children).values({
      id: uuid(),
      userId: faker.helpers.arrayElement(userIds),
      firstName: faker.person.firstName(),
      schoolId: faker.helpers.arrayElement(schoolIds),
      schoolEmailAddress: faker.internet.email(),
      createdAt: new Date().toISOString(),
    });
  }

  console.log("Seeding complete");
};

seedDatabase();
