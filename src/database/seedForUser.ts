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
import { childToRequest } from "./schema/requestToChildren";
import { eq } from "drizzle-orm";
import { friends } from "./schema/friends";

const getRandomVancouverLatLon = () => {
  const lat = faker.number.float({ min: 49.2, max: 49.3 });
  const lon = faker.number.float({ min: -123.23, max: -123.0 });
  return { lat, lon };
};

const childImageUrls = [
  "https://media.istockphoto.com/id/1387226163/photo/portrait-of-a-little-boy-with-a-plaster-on-his-arm-after-an-injection.jpg?s=612x612&w=0&k=20&c=3dlo_ztuREvJWLNbdqlgGcztceBgk5qDdU7ulYaErkk=",
  "https://img.freepik.com/free-photo/smiley-little-girl-red-dress_23-2148984788.jpg",
];

const parentImageUrls = [
  "https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=612x612&w=0&k=20&c=tyLvtzutRh22j9GqSGI33Z4HpIwv9vL_MZw_xOE19NQ=",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5OnHV8GHqPs9FClVXQRrhSsDh_KUv8r0HLg&s",
  "https://media.istockphoto.com/id/1410538853/photo/young-man-in-the-public-park.jpg?s=612x612&w=0&k=20&c=EtRJGnNOFPJ2HniBSLWKzsL9Xf7GHinHd5y2Tx3da0E=",
  "https://thispersondoesnotexist.com/",
  "https://thispersondoesnotexist.com/",
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

  console.log("Starting seeding process...");

  // Step 1: Fetch or create "Edmonds Community School" and its group
  const school = await db
    .select()
    .from(schools)
    .where(eq(schools.name, "Edmonds Community School"))
    .limit(1);

  if (school.length === 0) {
    throw new Error("School 'Edmonds Community School' does not exist.");
  }
  const schoolId = school[0].id;
  console.log(`Using school ID: ${schoolId}`);

  let edmondsGroup = await db
    .select()
    .from(groups)
    .where(eq(groups.name, "Edmonds Community School"))
    .limit(1);

  let groupId;
  if (edmondsGroup.length === 0) {
    groupId = uuid();
    await db.insert(groups).values({
      id: groupId,
      name: "Edmonds Community School",
    });
    console.log(
      `Created group for Edmonds Community School with ID: ${groupId}`
    );
  } else {
    groupId = edmondsGroup[0].id;
    console.log(
      `Using existing group for Edmonds Community School with ID: ${groupId}`
    );
  }

  // Check and log if `groupId` and `currentUserId` exist before `usersToGroups` insert
  console.log(
    "Checking existence of group and user before adding to usersToGroups"
  );
  const userExists = await db
    .select()
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);
  const groupExists = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  console.log(
    `User exists: ${userExists.length > 0}, Group exists: ${
      groupExists.length > 0
    }`
  );

  const userGroupId = uuid();
  await db.insert(usersToGroups).values({
    id: userGroupId,
    userId: currentUserId,
    groupId: groupId,
  });
  console.log(
    `Added current user with ID: ${currentUserId} to group with ID: ${groupId}`
  );

  // Step 2: Create children for the current user, assigned to the school
  const currentUserChildIds: string[] = [];
  for (let i = 0; i < childImageUrls.length; i++) {
    const childId = uuid();
    console.log(
      `Inserting child with childId: ${childId}, userId: ${currentUserId}, schoolId: ${schoolId}`
    );
    await db.insert(children).values({
      id: childId,
      userId: currentUserId,
      firstName: faker.person.firstName(),
      schoolId: schoolId,
      schoolEmailAddress: faker.internet.email(),
      createdAt: new Date().toISOString(),
      imageUrl: childImageUrls[i],
    });
    currentUserChildIds.push(childId);
    console.log(
      `Created child with ID: ${childId} for user ID: ${currentUserId}`
    );
  }

  // Step 3: Create vehicles for the current user
  for (let i = 0; i < 2; i++) {
    const vehicleId = uuid();
    console.log(
      `Creating vehicle with ID: ${vehicleId} for user ID: ${currentUserId}`
    );
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
      `Created vehicle with ID: ${vehicleId} for user ID: ${currentUserId}`
    );
  }

  // Step 4: Add additional users and their children, all assigned to the Edmonds group and school
  const userIds: string[] = [currentUserId];
  const childIds: string[] = [...currentUserChildIds];
  for (let i = 0; i < 4; i++) {
    const userId = uuid();
    console.log(`Creating user with ID: ${userId}`);
    await db.insert(users).values({
      id: userId,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phoneNumber: faker.phone.number(),
      city: "Vancouver",
      imageUrl: "https://thispersondoesnotexist.com/",
      expoPushToken: faker.string.uuid(),
    });
    userIds.push(userId);

    console.log(`Adding user ${userId} to group ${groupId}`);
    await db.insert(usersToGroups).values({
      id: uuid(),
      userId: userId,
      groupId: groupId,
    });

    for (let j = 0; j < 2; j++) {
      const childId = uuid();
      console.log(
        `Creating child with ID: ${childId} for user ID: ${userId} and school ID: ${schoolId}`
      );
      await db.insert(children).values({
        id: childId,
        userId: userId,
        firstName: faker.person.firstName(),
        schoolId: schoolId,
        schoolEmailAddress: faker.internet.email(),
        createdAt: new Date().toISOString(),
        imageUrl: faker.helpers.arrayElement(childImageUrls),
      });
      childIds.push(childId);
    }
  }

  const friendIds = [];
  userIds.map(async (userId) => {
    console.log(`Creating user with ID: ${userId}`);
    const friendId = uuid();
    await db.insert(friends).values({
      id: friendId,
      userId: currentUserId,
      friendId: userId,
    });
    friendIds.push(friendId);
  });

  console.log("Step 5: Creating requests and linking children");
  let addressIndex = 0;
  for (let i = 0; i < 5; i++) {
    const userId = userIds[i % userIds.length];
    const requestId = uuid();
    const { address, lat, lon } = addressesInVancouver[addressIndex];
    const { lat: endLat, lon: endLon } = getRandomVancouverLatLon();

    console.log(
      `Creating request with ID: ${requestId}, groupId: ${groupId}, userId: ${userId}`
    );
    await db.insert(requests).values({
      id: requestId,
      groupId: groupId,
      parentId: userId,
      isApproved: 0,
      startingAddress: address,
      endingAddress: "6111 River Rd, Richmond, BC, Canada",
      startingLatitude: lat.toString(),
      startingLongitude: lon.toString(),
      endingLatitude: endLat.toString(),
      endingLongitude: endLon.toString(),
      pickupTime: faker.date.future().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const selectedChildIds = faker.helpers
      .shuffle(childIds)
      .slice(0, faker.number.int({ min: 1, max: 3 }));
    for (const childId of selectedChildIds) {
      console.log(`Linking child ID: ${childId} to request ID: ${requestId}`);
      await db.insert(childToRequest).values({
        id: uuid(),
        childId: childId,
        requestId: requestId,
      });
    }
    addressIndex = (addressIndex + 1) % addressesInVancouver.length;
  }

  console.log("Seeding complete.");
};

seedCarpoolRequestsWithNewGroup("hkdSMSsaZIg4tJE8q4fC8ejp1hO2")
  .then(() => console.log("Seeding complete"))
  .catch((error) => console.error("Seeding failed:", error));
