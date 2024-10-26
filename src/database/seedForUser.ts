import { getDB } from "./client";
import { faker } from "@faker-js/faker";
import { v4 as uuid } from "uuid";
import { requests } from "./schema/carpoolRequests";
import { groups } from "./schema/groups";
import { users } from "./schema/users";
import { children } from "./schema/children";
import { usersToGroups } from "./schema/usersToGroups";
import { vehicle } from "./schema/vehicle";
import { schools } from "./schema/schools";

const getRandomVancouverLatLon = () => {
  const lat = faker.number.float({ min: 49.0, max: 49.4 });
  const lon = faker.number.float({ min: -123.3, max: -123.0 });
  return { lat, lon };
};

const childImageUrls = [
  "https://media.istockphoto.com/id/1387226163/photo/portrait-of-a-little-boy-with-a-plaster-on-his-arm-after-an-injection.jpg?s=612x612&w=0&k=20&c=3dlo_ztuREvJWLNbdqlgGcztceBgk5qDdU7ulYaErkk=",
  "https://img.freepik.com/free-photo/smiley-little-girl-red-dress_23-2148984788.jpg",
];

const seedCarpoolRequestsWithNewGroup = async (currentUserId: string) => {
  const db = getDB();

  const groupId = uuid();
  const groupName = faker.lorem.words(2);
  await db.insert(groups).values({
    id: groupId,
    name: groupName,
  });

  console.log(`Created group with ID: ${groupId} and Name: ${groupName}`);

  const userIds: string[] = [currentUserId];
  await db.insert(usersToGroups).values({
    id: uuid(),
    userId: currentUserId,
    groupId: groupId,
  });

  const schoolsArr = await db.select().from(schools);

  console.log(
    `Added current user with ID: ${currentUserId} to group: ${groupId}`
  );

  for (let i = 0; i < childImageUrls.length; i++) {
    const childId = uuid();
    await db.insert(children).values({
      id: childId,
      userId: currentUserId,
      firstName: faker.person.firstName(),
      schoolId: Array.from(schoolsArr)[i].id,
      schoolEmailAddress: faker.internet.email(),
      createdAt: new Date().toISOString(),
      imageUrl: childImageUrls[i],
    });

    console.log(
      `Created child with ID: ${childId} for user: ${currentUserId} with image: ${childImageUrls[i]}`
    );
  }

  for (let i = 0; i < 2; i++) {
    const vehicleId = uuid();
    await db.insert(vehicle).values({
      id: vehicleId,
      userId: currentUserId,
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.vehicle.vin(),
      licensePlate: faker.vehicle.vrm(),
      color: faker.color.human(),
      numberOfSeats: faker.number.int({ min: 2, max: 7 }),
    });

    console.log(
      `Created vehicle with ID: ${vehicleId} for user: ${currentUserId}`
    );
  }

  for (let i = 0; i < 4; i++) {
    const userId = uuid();
    await db.insert(users).values({
      id: userId,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phoneNumber: faker.phone.number(),
      city: "Vancouver",
      expoPushToken: faker.string.uuid(),
    });
    userIds.push(userId);

    await db.insert(usersToGroups).values({
      id: uuid(),
      userId: userId,
      groupId: groupId,
    });

    console.log(`Added user with ID: ${userId} to group: ${groupId}`);
  }

  const childIds: string[] = [];
  for (const userId of userIds) {
    for (let i = 0; i < 2; i++) {
      const childId = uuid();
      await db.insert(children).values({
        id: childId,
        userId: userId,
        firstName: faker.person.firstName(),
        schoolId: Array.from(schoolsArr)[i].id,
        schoolEmailAddress: faker.internet.email(),
        createdAt: new Date().toISOString(),
      });
      childIds.push(childId);

      console.log(`Created child with ID: ${childId} for user: ${userId}`);
    }
  }

  for (const userId of userIds) {
    const userChildIds = childIds.filter(
      (childId, index) => Math.floor(index / 2) === userIds.indexOf(userId)
    );

    for (const childId of userChildIds) {
      const { lat: startLat, lon: startLon } = getRandomVancouverLatLon();
      const { lat: endLat, lon: endLon } = getRandomVancouverLatLon();
      const pickupTime = faker.date.future().toISOString();

      await db.insert(requests).values({
        id: uuid(),
        groupId: groupId,
        parentId: userId,
        childId: childId,
        isApproved: faker.datatype.boolean() ? 1 : 0,
        startingAddress: faker.location.streetAddress(),
        endingAddress: faker.location.streetAddress(),
        startingLatitude: startLat.toString(),
        startingLongitude: startLon.toString(),
        endingLatitude: endLat.toString(),
        endingLongitude: endLon.toString(),
        pickupTime: pickupTime,
        createdAt: new Date().toISOString(),
      });

      console.log(`Created request for user: ${userId} and child: ${childId}`);
    }
  }

  console.log(`Seeding complete for group: ${groupId}`);
};

seedCarpoolRequestsWithNewGroup("hkdSMSsaZIg4tJE8q4fC8ejp1hO2")
  .then(() => console.log("Seeding complete"))
  .catch((error) => console.error("Seeding failed:", error));
