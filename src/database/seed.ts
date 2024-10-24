import { getDB } from "./client";
import { users } from "./schema/users";
import { messages } from "./schema/messages";
import { schools } from "./schema/schools";
import { communityCenters } from "./schema/communityCenters";
import { children } from "./schema/children";
import { groups } from "./schema/groups";
import { usersToGroups } from "./schema/usersToGroups";
import { carpools } from "./schema/carpool";
import { requests } from "./schema/carpoolRequests";
import { vehicle } from "./schema/vehicle";
import { faker } from "@faker-js/faker";
import { v4 as uuid } from "uuid";
import { schoolsArray } from "./schoolSeedData";
import { commCenterData } from "./commCenterData";

const db = getDB();

const getRandomVancouverLatLon = () => {
  const lat = faker.number.float({ min: 49.0, max: 49.4 });
  const lon = faker.number.float({ min: -123.3, max: -123.0 });
  return { lat, lon };
};

const seedDatabase = async () => {
  const schoolIds = [];
  const userIds = [];
  const groupIds = [];
  const vehicleIds = [];
  const carpoolIds = [];
  const communityCenterIds = [];
  const childIds = [];

  await db.delete(messages);
  await db.delete(users);
  await db.delete(children);
  await db.delete(groups);
  await db.delete(usersToGroups);
  await db.delete(carpools);
  await db.delete(requests);

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
    const result = await db
      .insert(vehicle)
      .values({
        id: uuid(),
        userId: faker.helpers.arrayElement(userIds),
        make: faker.vehicle.manufacturer(),
        model: faker.vehicle.model(),
        year: faker.vehicle.vin(),
        licensePlate: faker.vehicle.vrm(),
        color: faker.color.human(),
        numberOfSeats: faker.number.int({ min: 2, max: 7 }),
      })
      .returning();
    vehicleIds.push(result[0].id);
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
    const child = await db
      .insert(children)
      .values({
        id: uuid(),
        userId: faker.helpers.arrayElement(userIds),
        firstName: faker.person.firstName(),
        schoolId: faker.helpers.arrayElement(schoolIds),
        schoolEmailAddress: faker.internet.email(),
        createdAt: new Date().toISOString(),
      })
      .returning();
    childIds.push(child[0].id);
  }

  for (let i = 0; i < 5; i++) {
    const { lat: startLat, lon: startLon } = getRandomVancouverLatLon();
    const { lat: endLat, lon: endLon } = getRandomVancouverLatLon();

    const carpool = await db
      .insert(carpools)
      .values({
        id: uuid(),
        driverId: faker.helpers.arrayElement(userIds),
        vehicleId: faker.helpers.arrayElement(vehicleIds),
        groupId: faker.helpers.arrayElement(groupIds),
        startAddress: faker.location.streetAddress(),
        endAddress: faker.location.streetAddress(),
        startLat: startLat,
        startLon: startLon,
        endLat: endLat,
        endLon: endLon,
        departureDate: faker.date.soon().toISOString().split("T")[0],
        departureTime: faker.date.recent().toISOString(),
        extraCarSeat: faker.datatype.boolean() ? 1 : 0,
        winterTires: faker.datatype.boolean() ? 1 : 0,
        tripPreferences: faker.lorem.sentence(),
      })
      .returning();
    carpoolIds.push(carpool[0].id);
  }

  for (let i = 0; i < 10; i++) {
    await db.insert(requests).values({
      id: uuid(),
      carpoolId: faker.helpers.arrayElement(carpoolIds),
      parentId: faker.helpers.arrayElement(userIds),
      childId: faker.helpers.arrayElement(childIds),
      isApproved: faker.datatype.boolean() ? 1 : 0,
      createdAt: new Date().toISOString(),
    });
  }

  console.log("Seeding complete");
};

seedDatabase();
