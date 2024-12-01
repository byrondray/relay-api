import { getDB } from "./client";
import { users as userSchema } from "./schema/users";
import { children } from "./schema/children";
import { vehicle } from "./schema/vehicle";
import { faker } from "@faker-js/faker";
import { v4 as uuid } from "uuid";
import { friends } from "./schema/friends";
import { eq, inArray, ne } from "drizzle-orm";
import {
  addressesInVancouver,
  childImageUrls,
  parentImageUrls,
} from "./seedForUser";
import { schools } from "./schema/schools";
import { carpools } from "./schema/carpool";
import { requests } from "./schema/carpoolRequests";
import { childToRequest } from "./schema/requestToChildren";
import { groups } from "./schema/groups";
import { usersToGroups } from "./schema/usersToGroups";

const evan = {
  id: "VQDrhC1urNVkssfgLc8jZWVRpo32",
  name: "Evan",
  email: "evan@gmail.com",
  imageUrl: "https://i.postimg.cc/WznZjdLj/evan-profile.png",
  childImageUrl: "https://i.postimg.cc/FKd0cFcg/evan-child.jpg",
};

const vanessa = {
  id: "dlKJ2KqPEzc4wHStEOPOkK6fin33",
  name: "Vanessa",
  email: "vanessa@gmail.com",
  imageUrl: "https://i.postimg.cc/MGXwYb48/vanessa-profile.jpg",
  childImageUrl: "https://i.postimg.cc/PqgYMGQG/vanessa-child.jpg",
};

const gloria = {
  id: "JDUp6wskgdN2QxnLrV646NxlY2E3",
  name: "Gloria",
  email: "gloria@gmail.com",
  imageUrl: "https://i.postimg.cc/j2KfGz1Z/gloria-profile.jpg",
  childImageUrl: "https://i.postimg.cc/x1FKcNk1/gloria-child.jpg",
};

const kyanna = {
  id: "r5nff8t7UYWfzPv9hCuuOWHZFt52",
  name: "Kyanna",
  email: "kyanna@gmail.com",
  imageUrl: "https://i.postimg.cc/3xwX8Fxq/kyanna-profile.jpg",
  childImageUrl: "https://i.postimg.cc/NffWL2cC/kyanna-child.jpg",
};

export const ensureUserCompleteness = async (
  userId: string,
  name?: string,
  email?: string,
  imageUrl?: string,
  childImageUrl?: string
) => {
  const db = getDB();

  // Step 1: Fetch the user
  let [user] = await db
    .select()
    .from(userSchema)
    .where(eq(userSchema.id, userId))
    .limit(1);

  // Step 2: Create user if not found
  if (!user) {
    console.log(`User with ID ${userId} does not exist. Creating a new user.`);
    const newUser = {
      id: userId,
      firstName: name || "Howie",
      lastName: faker.person.lastName(),
      email: email || "howie@gmail.com",
      phoneNumber: faker.phone.number(),
      city: faker.location.city(),
      imageUrl: imageUrl
        ? imageUrl
        : faker.helpers.arrayElement(parentImageUrls),
      expoPushToken: faker.string.uuid(),
      createdAt: new Date().toISOString(),
      insuranceImageUrl: null,
      licenseImageUrl: null,
    };
    await db.insert(userSchema).values(newUser);
    user = newUser;
    console.log(`Created user with ID: ${userId}`);
  }

  // Step 3: Fill out missing user fields
  const updatedFields: Partial<typeof userSchema.$inferInsert> = {};

  if (!user.imageUrl) {
    updatedFields.imageUrl = faker.helpers.arrayElement(parentImageUrls);
  }
  if (!user.lastName) {
    updatedFields.lastName = faker.person.lastName();
  }
  if (!user.firstName) {
    updatedFields.firstName = "Howie";
  }
  if (!user.email) {
    updatedFields.email = "howie@gmail.com";
  }

  if (Object.keys(updatedFields).length > 0) {
    await db
      .update(userSchema)
      .set(updatedFields)
      .where(eq(userSchema.id, userId));
    console.log(`Updated missing fields for user ID: ${userId}`);
  }

  // Step 4: Ensure the user has vehicles
  const existingVehicles = await db
    .select()
    .from(vehicle)
    .where(eq(vehicle.userId, userId));

  if (existingVehicles.length === 0) {
    for (let i = 0; i < 2; i++) {
      const vehicleId = uuid();
      await db.insert(vehicle).values({
        id: vehicleId,
        userId: userId,
        make: faker.vehicle.manufacturer(),
        model: faker.vehicle.model(),
        year: faker.date.past().getFullYear().toString(),
        licensePlate: faker.vehicle.vrm(),
        color: faker.color.human(),
        numberOfSeats: faker.number.int({ min: 4, max: 6 }),
      });
      console.log(
        `Created vehicle with ID: ${vehicleId} for user ID: ${userId}`
      );
    }
  }

  const [edmondsGroup] = await db
    .select()
    .from(groups)
    .where(eq(groups.name, "Edmonds Community School"))
    .limit(1);

  const userInEdmondsGroup = await db
    .select()
    .from(groups)
    .innerJoin(usersToGroups, eq(usersToGroups.userId, userId))
    .where(eq(groups.id, edmondsGroup.id))
    .limit(1);

  if (userInEdmondsGroup.length === 0) {
    await db.insert(usersToGroups).values({
      id: uuid(),
      userId: userId,
      groupId: edmondsGroup.id,
    });
    console.log(`Added user ID: ${userId} to Edmonds Community School group`);
  }

  const [edmondsSchool] = await db
    .select()
    .from(schools)
    .where(eq(schools.name, "Edmonds Community School"))
    .limit(1);

  // Step 5: Ensure the user has children
  const existingChildren = await db
    .select()
    .from(children)
    .where(eq(children.userId, userId));

  // If the user has no children, create two
  if (existingChildren.length === 0) {
    const childId = uuid();
    await db.insert(children).values({
      id: childId,
      userId: userId,
      firstName: faker.person.firstName(),
      schoolId: edmondsSchool.id,
      schoolEmailAddress: faker.internet.email(),
      imageUrl: childImageUrl || "",

      createdAt: new Date().toISOString(),
    });
    console.log(`Created child with ID: ${childId} for user ID: ${userId}`);
  } else if (existingChildren.length > 1) {
    // If the user has more than 2 children, delete the excess
    const childrenToDelete = existingChildren
      .slice(1) // Keep only the first two children, delete the rest
      .map((child) => child.id);

    await db.delete(children).where(inArray(children.id, childrenToDelete));

    console.log(`Deleted excess children for user ID: ${userId}`);
  }

  // Step 6: Ensure the user has friends
  const existingFriends = await db
    .select()
    .from(friends)
    .where(eq(friends.userId, userId));

  if (existingFriends.length === 0) {
    const availableUsers = await db
      .select()
      .from(userSchema)
      .where(ne(userSchema.id, userId))
      .limit(10);

    if (availableUsers.length === 0) {
      console.log(
        `No other users found to create friends for user ID: ${userId}`
      );
    } else {
      for (const friend of availableUsers) {
        const friendId = uuid();
        await db.insert(friends).values({
          id: friendId,
          userId: userId,
          friendId: friend.id,
        });
        console.log(
          `Added friend with ID: ${friend.id} for user ID: ${userId}`
        );
      }
    }
  }
};

export const createCarpoolWithRequests = async (
  currentUserId: string,
  otherUserIds: string[]
) => {
  const db = getDB();

  const usedAddresses = new Set<string>(); // Track used addresses

  // Step 3: Create a carpool for the current user
  const carpoolId = uuid();
  const [userVehicle] = await db
    .select()
    .from(vehicle)
    .where(eq(vehicle.userId, currentUserId))
    .limit(1);

  if (!userVehicle) {
    throw new Error(`No vehicle found for user ID: ${currentUserId}`);
  }

  const [edmondsSchool] = await db
    .select()
    .from(schools)
    .where(eq(schools.name, "Edmonds Community School"))
    .limit(1);

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.schoolId, edmondsSchool.id))
    .limit(1);

  const carpoolData = {
    id: carpoolId,
    driverId: currentUserId,
    vehicleId: userVehicle.id,
    groupId: group.id,
    startAddress: "7651 18th Ave, Burnaby",
    endAddress: "Richmond Olympic Oval",
    startLat: 49.22248480251348,
    startLon: -122.94077691451247,
    endLat: 49.17911517691895,
    endLon: -123.15098999897681,
    departureDate: new Date().toISOString(),
    departureTime: "03: 30 PM",
    extraCarSeat: 1,
    winterTires: 0,
    tripPreferences: "No pets, non-smoking",
    createdAt: new Date().toISOString(),
  };

  await db.insert(carpools).values(carpoolData);
  console.log(`Created carpool with ID: ${carpoolId}`);

  // Step 4: Add requests for each other user
  for (const userId of otherUserIds) {
    const requestId = uuid();

    const userChildren = await db
      .select()
      .from(children)
      .where(eq(children.userId, userId));

    if (userChildren.length === 0) {
      console.warn(`User ID ${userId} has no children, skipping request.`);
      continue;
    }

    // Find an address not already used
    let addressInVancouver;
    do {
      addressInVancouver = faker.helpers.arrayElement(addressesInVancouver);
    } while (usedAddresses.has(addressInVancouver.address));

    usedAddresses.add(addressInVancouver.address); // Mark address as used

    const requestData = {
      id: requestId,
      carpoolId: carpoolId,
      parentId: userId,
      groupId: carpoolData.groupId,
      isApproved: 0,
      startingAddress: addressInVancouver.address,
      endingAddress: carpoolData.endAddress,
      startingLatitude: addressInVancouver.lat.toString(),
      startingLongitude: addressInVancouver.lon.toString(),
      endingLatitude: carpoolData.endLat.toString(),
      endingLongitude: carpoolData.endLon.toString(),
      pickupTime: "03:30PM", // Example data
      createdAt: new Date().toISOString(),
    };

    await db.insert(requests).values(requestData);
    console.log(`Created request with ID: ${requestId} for user ID: ${userId}`);

    // Link children to the request
    for (const child of userChildren) {
      const childExists = await db
        .select()
        .from(children)
        .where(eq(children.id, child.id))
        .limit(1);

      if (childExists.length === 0) {
        console.warn(`Child ID ${child.id} does not exist, skipping.`);
        continue;
      }

      const requestExists = await db
        .select()
        .from(requests)
        .where(eq(requests.id, requestId))
        .limit(1);

      if (requestExists.length === 0) {
        console.warn(`Request ID ${requestId} does not exist, skipping.`);
        continue;
      }

      const childToRequestData = {
        id: uuid(),
        childId: child.id,
        requestId: requestId,
      };

      try {
        await db.insert(childToRequest).values(childToRequestData);
        console.log(
          `Linked child ID: ${child.id} to request ID: ${requestId} for user ID: ${userId}`
        );
      } catch (error) {
        console.error(
          `Failed to link child ID: ${child.id} to request ID: ${requestId}:`,
          error
        );
      }
    }
  }

  console.log("Carpool creation process completed.");
};

export const createEdmondsRequestForUser = async (userId: string) => {
  const db = getDB();

  // Step 1: Find the user by name
  const [user] = await db
    .select()
    .from(userSchema)
    .where(eq(userSchema.id, userId))
    .limit(1);

  if (!user) {
    throw new Error(`User with name "${userId}" not found.`);
  }

  // Step 2: Find the Edmonds Community School group
  const [edmondsGroup] = await db
    .select()
    .from(groups)
    .where(eq(groups.name, "Edmonds Community School"))
    .limit(1);

  if (!edmondsGroup) {
    throw new Error(`Edmonds Community School group not found.`);
  }

  // Step 3: Get one child for the user
  const [userChild] = await db
    .select()
    .from(children)
    .where(eq(children.userId, user.id))
    .limit(1);

  if (!userChild) {
    throw new Error(`No children found for user "${userId}".`);
  }

  const fakeAddress = faker.helpers.arrayElement(addressesInVancouver);

  // Step 4: Create a request for the user
  const requestId = uuid();
  const address = fakeAddress.address;
  const latitude = fakeAddress.lat.toString();
  const longitude = fakeAddress.lon.toString();

  const newRequest = {
    id: requestId,
    carpoolId: null,
    parentId: user.id,
    groupId: edmondsGroup.id,
    isApproved: 0,
    startingAddress: address,
    endingAddress: "Richmond Olympic Oval",
    startingLatitude: latitude,
    startingLongitude: longitude,
    endingLatitude: "49.17911517691895",
    endingLongitude: "-123.1509899989768",
    pickupTime: "03:30 PM",
    createdAt: new Date().toISOString(),
  };

  await db.insert(requests).values(newRequest);
  console.log(`Created request with ID: ${requestId} for user "${userId}"`);

  const childToRequestData = {
    id: uuid(),
    childId: userChild.id,
    requestId: requestId,
  };

  await db.insert(childToRequest).values(childToRequestData);
  console.log(
    `Linked child with ID: ${userChild.id} to request ID: ${requestId}`
  );
};

const seedUsers = async () => {
  await ensureUserCompleteness(
    "hkdSMSsaZIg4tJE8q4fC8ejp1hO2",
    "Howie",
    "howie@gmail.com",
    parentImageUrls[1],
    childImageUrls[0]
  );
  await ensureUserCompleteness(
    "j71TabTn4VXU0bgSjxnd0lBGc3l1",
    "Relay",
    "relay@gmail.com",
    parentImageUrls[0],
    childImageUrls[1]
  );

  await ensureUserCompleteness(
    gloria.id,
    gloria.name,
    gloria.email,
    gloria.imageUrl,
    gloria.childImageUrl
  );

  await ensureUserCompleteness(
    kyanna.id,
    kyanna.name,
    kyanna.email,
    kyanna.imageUrl,
    kyanna.childImageUrl
  );

  await ensureUserCompleteness(
    vanessa.id,
    vanessa.name,
    vanessa.email,
    vanessa.imageUrl,
    vanessa.childImageUrl
  );

  await ensureUserCompleteness(
    evan.id,
    evan.name,
    evan.email,
    evan.imageUrl,
    evan.childImageUrl
  );

  await createEdmondsRequestForUser(evan.id);
  await createEdmondsRequestForUser(gloria.id);
  await createEdmondsRequestForUser(vanessa.id);
  await createEdmondsRequestForUser(kyanna.id);

  await createCarpoolWithRequests("hkdSMSsaZIg4tJE8q4fC8ejp1hO2", [
    "j71TabTn4VXU0bgSjxnd0lBGc3l1",
  ]);

  await createCarpoolWithRequests("j71TabTn4VXU0bgSjxnd0lBGc3l1", [
    "hkdSMSsaZIg4tJE8q4fC8ejp1hO2",
  ]);

  // await createCarpoolWithRequests(evan.id, [gloria.id, kyanna.id, vanessa.id]);
  // await createCarpoolWithRequests(gloria.id, [evan.id, kyanna.id]);
  // await createCarpoolWithRequests(kyanna.id, [evan.id, gloria.id]);
  await createCarpoolWithRequests(vanessa.id, [evan.id, gloria.id]);
};

// @ts-ignore
await seedUsers();
