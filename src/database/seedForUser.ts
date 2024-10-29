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
  const lat = faker.number.float({ min: 49.2, max: 49.3 });
  const lon = faker.number.float({ min: -123.23, max: -123.0 });
  return { lat, lon };
};

const childImageUrls = [
  "https://media.istockphoto.com/id/1387226163/photo/portrait-of-a-little-boy-with-a-plaster-on-his-arm-after-an-injection.jpg?s=612x612&w=0&k=20&c=3dlo_ztuREvJWLNbdqlgGcztceBgk5qDdU7ulYaErkk=",
  "https://img.freepik.com/free-photo/smiley-little-girl-red-dress_23-2148984788.jpg",
];

const addressesInVancouver = [
  {
    address: "5897 Keith Street, Burnaby, BC, Canada",
    lat: 49.2076328,
    lon: -122.9774472,
  },
  {
    address: "5915 Ewart Street, Burnaby, BC, Canada",
    lat: 49.2104684,
    lon: -122.9766248,
  },
  {
    address: "8325 Royal Oak Avenue, Burnaby, BC, Canada",
    lat: 49.2088823,
    lon: -122.9888296,
  },
  {
    address: "5398 Neville Street, Burnaby, BC, Canada",
    lat: 49.2139562,
    lon: -122.9857457,
  },
  {
    address: "3522 Swansacre, Vancouver, BC, Canada",
    lat: 49.2122139,
    lon: -123.0284378,
  },
  {
    address: "8418 Keystone Street, Vancouver, BC, Canada",
    lat: 49.2076518,
    lon: -123.0342188,
  },
  {
    address: "1715 Island Avenue, Vancouver, BC, Canada",
    lat: 49.2100768,
    lon: -123.0707865,
  },
  {
    address: "7288 17th Avenue, Burnaby, BC, Canada",
    lat: 49.21653000000001,
    lon: -122.9489163,
  },
  {
    address: "1945 London Street, New Westminster, BC, Canada",
    lat: 49.2052831,
    lon: -122.9511485,
  },
  {
    address: "6851 Hersham Avenue, Burnaby, BC, Canada",
    lat: 49.2250854,
    lon: -122.9473389,
  },
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

  const userIds: string[] = [];
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
    const imageUrl = childImageUrls[i];
    if (imageUrl) {
      const childId = uuid();
      await db.insert(children).values({
        id: childId,
        userId: currentUserId,
        firstName: faker.person.firstName(),
        schoolId: Array.from(schoolsArr)[i].id,
        schoolEmailAddress: faker.internet.email(),
        createdAt: new Date().toISOString(),
        imageUrl,
      });

      console.log(
        `Created child with ID: ${childId} for user: ${currentUserId} with image: ${imageUrl}`
      );
    }
  }

  for (let i = 0; i < 2; i++) {
    const vehicleId = uuid();
    await db.insert(vehicle).values({
      id: vehicleId,
      userId: currentUserId,
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.date.past().getFullYear().toString(),
      licensePlate: faker.vehicle.vrm(),
      color: faker.color.human(),
      numberOfSeats: faker.number.int({ min: 4, max: 6 }),
    });

    console.log(
      `Created vehicle with ID: ${vehicleId} for user: ${currentUserId}`
    );
  }

  // Seed other users and their children
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
      const imageUrl = faker.helpers.arrayElement(childImageUrls);

      if (imageUrl) {
        const childId = uuid();
        await db.insert(children).values({
          id: childId,
          userId: userId,
          firstName: faker.person.firstName(),
          schoolId: Array.from(schoolsArr)[i].id,
          schoolEmailAddress: faker.internet.email(),
          createdAt: new Date().toISOString(),
          imageUrl,
        });
        childIds.push(childId);

        console.log(`Created child with ID: ${childId} for user: ${userId}`);
      }
    }
  }

  let addressIndex = 0;

  for (let i = 0; i < 5; i++) {
    const userId = userIds[i % userIds.length];
    const childId = childIds[i % childIds.length];
    const { address, lat, lon } = addressesInVancouver[addressIndex];

    const { lat: endLat, lon: endLon } = getRandomVancouverLatLon();
    const pickupTime = faker.date.future().toISOString();

    await db.insert(requests).values({
      id: uuid(),
      groupId: groupId,
      parentId: userId,
      childId: childId,
      isApproved: 0,
      startingAddress: address,
      endingAddress: "6111 River Rd, Richmond, BC, Canada",
      startingLatitude: lat.toString(),
      startingLongitude: lon.toString(),
      endingLatitude: endLat.toString(),
      endingLongitude: endLon.toString(),
      pickupTime: pickupTime,
      createdAt: new Date().toISOString(),
    });

    console.log(`Created request for user: ${userId} and child: ${childId}`);

    addressIndex = (addressIndex + 1) % addressesInVancouver.length;
  }

  console.log(`Seeding complete for group: ${groupId}`);
};

seedCarpoolRequestsWithNewGroup("hkdSMSsaZIg4tJE8q4fC8ejp1hO2")
  .then(() => console.log("Seeding complete"))
  .catch((error) => console.error("Seeding failed:", error));
