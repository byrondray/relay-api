import { getDB } from "./client";
import { vehicle } from "./schema/vehicle";
import { and, eq, inArray, ne } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { faker } from "@faker-js/faker";
import { groups } from "./schema/groups";
import { users } from "./schema/users";
import { usersToGroups } from "./schema/usersToGroups";
import { children } from "./schema/children";
import { carpools } from "./schema/carpool";
import { requests } from "./schema/carpoolRequests";
import { childToRequest } from "./schema/requestToChildren";
import { addressesInVancouver, childImageUrls } from "./seedForUser";
import { schools } from "./schema/schools";

// export const createCarpoolsForUser = async (
//   currentUserId: string,
//   secondUserId: string,
//   groupName = "Edmonds Community School"
// ) => {
//   const db = getDB();
//   console.log(
//     `Creating carpools for user: ${currentUserId} in group: ${groupName}`
//   );

//   // Step 1: Get the group
//   const [group] = await db
//     .select()
//     .from(groups)
//     .where(eq(groups.name, groupName))
//     .limit(1);

//   if (!group) {
//     throw new Error(`Group "${groupName}" does not exist.`);
//   }
//   const groupId = group.id;

//   // Step 2: Query for a vehicle belonging to the current user
//   const [userVehicle] = await db
//     .select()
//     .from(vehicle)
//     .where(eq(vehicle.userId, currentUserId))
//     .limit(1);

//   if (!userVehicle) {
//     throw new Error(`No vehicle found for user ID: ${currentUserId}`);
//   }
//   console.log(`Using vehicle with ID: ${userVehicle.id} for carpools`);

//   const maxSeats = userVehicle.numberOfSeats;

//   // Step 3: Query other parents in the group
//   const otherParents = await db
//     .select()
//     .from(users)
//     .innerJoin(usersToGroups, eq(users.id, usersToGroups.userId))
//     .where(and(eq(usersToGroups.groupId, groupId), ne(users.id, currentUserId)))
//     .limit(5);

//   if (otherParents.length === 0) {
//     throw new Error(`No other parents found in group "${groupName}"`);
//   }
//   console.log(`Found ${otherParents.length} other parents in the group`);

//   // Step 4: Query children of the other parents
//   const otherChildren = await db
//     .select()
//     .from(children)
//     .where(
//       inArray(
//         children.userId,
//         otherParents.map((parent) => parent.users.id)
//       )
//     )
//     .limit(10);

//   if (otherChildren.length === 0) {
//     throw new Error(
//       `No children found for other parents in group "${groupName}"`
//     );
//   }
//   console.log(
//     `Found ${otherChildren.length} children belonging to other parents`
//   );

//   // Step 5: Check for second user's children and add one if missing
//   let secondUserChild = await db
//     .select()
//     .from(children)
//     .where(eq(children.userId, secondUserId))
//     .limit(1);

//   const edmondsSchool = await db
//     .select()
//     .from(schools)
//     .where(eq(schools.name, "Edmonds Community School"))
//     .limit(1);

//   if (!secondUserChild.length) {
//     const newChildId = uuid();
//     const childName = faker.person.firstName();
//     const newChild = {
//       id: newChildId,
//       userId: secondUserId,
//       firstName: childName,
//       imageUrl: faker.helpers.arrayElement(childImageUrls),
//       schoolId: edmondsSchool[0].id,
//       createdAt: new Date().toISOString(),
//       schoolEmailAddress: null,
//     };

//     await db.insert(children).values(newChild);
//     console.log(`Added a new child for user ID: ${secondUserId}`);
//     secondUserChild = [newChild];
//   }

//   // Step 6: Create carpools
//   const carpoolIds: string[] = [];
//   for (let i = 0; i < 2; i++) {
//     const startAddress = faker.helpers.arrayElement(addressesInVancouver);
//     const endAddress = faker.helpers.arrayElement(addressesInVancouver);

//     const id = uuid();
//     // Insert carpool
//     await db.insert(carpools).values({
//       id: id,
//       driverId: currentUserId,
//       vehicleId: userVehicle.id,
//       groupId: groupId,
//       startAddress: startAddress.address,
//       endAddress: endAddress.address,
//       startLat: startAddress.lat,
//       startLon: startAddress.lon,
//       endLat: endAddress.lat,
//       endLon: endAddress.lon,
//       departureDate: faker.date.future().toISOString().split("T")[0],
//       departureTime: `07:${faker.number
//         .int({ min: 0, max: 59 })
//         .toString()
//         .padStart(2, "0")}`,
//       extraCarSeat: faker.number.int({ min: 1, max: 2 }),
//       winterTires: faker.number.int({ min: 0, max: 1 }),
//       tripPreferences: faker.helpers.arrayElement([
//         "No pets",
//         "Quiet trip",
//         "Flexible departure",
//       ]),
//       createdAt: new Date().toISOString(),
//     });
//     carpoolIds.push(id);
//     console.log(`Created carpool with ID: ${id}`);
//   }

//   // Step 7: Create requests for each carpool
//   for (const carpoolId of carpoolIds) {
//     let seatsUsed = 0; // Track seats used for the current carpool

//     // Add the second user's child first
//     if (seatsUsed < maxSeats) {
//       const secondUserRequestId = uuid();
//       const secondUserChildData = secondUserChild[0];
//       const startAddress = faker.helpers.arrayElement(addressesInVancouver);
//       const endAddress = faker.helpers.arrayElement(addressesInVancouver);

//       await db.insert(requests).values({
//         id: secondUserRequestId,
//         groupId: groupId,
//         parentId: secondUserId,
//         carpoolId: carpoolId,
//         isApproved: faker.number.int({ min: 0, max: 1 }),
//         startingAddress: startAddress.address,
//         endingAddress: endAddress.address,
//         startingLatitude: startAddress.lat.toString(),
//         startingLongitude: startAddress.lon.toString(),
//         endingLatitude: endAddress.lat.toString(),
//         endingLongitude: endAddress.lon.toString(),
//         pickupTime: faker.date.future().toISOString(),
//         createdAt: new Date().toISOString(),
//       });

//       await db.insert(childToRequest).values({
//         id: uuid(),
//         childId: secondUserChildData.id,
//         requestId: secondUserRequestId,
//       });

//       seatsUsed += 1;
//       console.log(
//         `Created request for second user with ID: ${secondUserRequestId}`
//       );
//     }

//     // Add other parents' children
//     for (let i = 0; i < 3 && seatsUsed < maxSeats; i++) {
//       const parent = faker.helpers.arrayElement(otherParents);
//       const child = faker.helpers.arrayElement(
//         otherChildren.filter((child) => child.userId === parent.users.id)
//       );

//       if (seatsUsed + 1 > maxSeats) {
//         console.log(
//           `Skipping request for child ID: ${child.id}, no available seats`
//         );
//         break;
//       }

//       const requestId = uuid();
//       const startAddress = faker.helpers.arrayElement(addressesInVancouver);
//       const endAddress = faker.helpers.arrayElement(addressesInVancouver);

//       await db.insert(requests).values({
//         id: requestId,
//         groupId: groupId,
//         parentId: parent.users.id,
//         carpoolId: carpoolId,
//         isApproved: faker.number.int({ min: 0, max: 1 }),
//         startingAddress: startAddress.address,
//         endingAddress: endAddress.address,
//         startingLatitude: startAddress.lat.toString(),
//         startingLongitude: startAddress.lon.toString(),
//         endingLatitude: endAddress.lat.toString(),
//         endingLongitude: endAddress.lon.toString(),
//         pickupTime: faker.date.future().toISOString(),
//         createdAt: new Date().toISOString(),
//       });

//       await db.insert(childToRequest).values({
//         id: uuid(),
//         childId: child.id,
//         requestId: requestId,
//       });

//       seatsUsed += 1;
//       console.log(
//         `Created request with ID: ${requestId} and linked child ID: ${child.id}`
//       );
//     }

//     if (seatsUsed >= maxSeats) {
//       console.log(`No more seats available for carpool ID: ${carpoolId}`);
//     }
//   }
//   console.log("Carpool creation complete.");
// };

// export const createCarpoolForOtherParent = async (
//   currentUserId: string,
//   secondUserId: string,
//   groupName = "Edmonds Community School"
// ) => {
//   const db = getDB();
//   console.log(
//     `Creating a carpool for user: ${secondUserId} where user: ${currentUserId} is a request in group: ${groupName}`
//   );

//   // Step 1: Get the group
//   const [group] = await db
//     .select()
//     .from(groups)
//     .where(eq(groups.name, groupName))
//     .limit(1);

//   if (!group) {
//     throw new Error(`Group "${groupName}" does not exist.`);
//   }
//   const groupId = group.id;

//   // Step 2: Find or create a vehicle for the second user
//   let [secondUserVehicle] = await db
//     .select()
//     .from(vehicle)
//     .where(eq(vehicle.userId, secondUserId))
//     .limit(1);

//   if (!secondUserVehicle) {
//     const vehicleId = uuid();
//     await db.insert(vehicle).values({
//       id: vehicleId,
//       userId: secondUserId,
//       make: faker.vehicle.manufacturer(),
//       model: faker.vehicle.model(),
//       year: faker.date.past().getFullYear().toString(),
//       licensePlate: faker.vehicle.vrm(),
//       color: faker.color.human(),
//       numberOfSeats: faker.number.int({ min: 4, max: 6 }),
//     });
//     console.log(
//       `Created vehicle with ID: ${vehicleId} for user ID: ${secondUserId}`
//     );

//     // Retrieve the newly created vehicle
//     [secondUserVehicle] = await db
//       .select()
//       .from(vehicle)
//       .where(eq(vehicle.id, vehicleId))
//       .limit(1);
//   }

//   const maxSeats = secondUserVehicle.numberOfSeats;

//   // Step 3: Query children of the current user
//   const currentUserChildren = await db
//     .select()
//     .from(children)
//     .where(eq(children.userId, currentUserId))
//     .limit(5);

//   if (currentUserChildren.length === 0) {
//     throw new Error(`No children found for current user ID: ${currentUserId}`);
//   }
//   console.log(
//     `Found ${currentUserChildren.length} children for the current user`
//   );

//   // Step 4: Query children of the second user
//   let secondUserChildren = await db
//     .select()
//     .from(children)
//     .where(eq(children.userId, secondUserId))
//     .limit(5);

//   const edmondsSchool = await db
//     .select()
//     .from(schools)
//     .where(eq(schools.name, "Edmonds Community School"))
//     .limit(1);

//   if (secondUserChildren.length === 0) {
//     // Create a default child if the second user has no children
//     const newChildId = uuid();
//     const childName = faker.person.firstName();
//     const newChild = {
//       id: newChildId,
//       userId: secondUserId,
//       firstName: childName,
//       imageUrl: faker.helpers.arrayElement(childImageUrls),
//       schoolId: edmondsSchool[0].id,
//       createdAt: new Date().toISOString(),
//       schoolEmailAddress: null,
//     };

//     await db.insert(children).values(newChild);
//     console.log(`Added a new child for user ID: ${secondUserId}`);
//     secondUserChildren = [newChild];
//   }

//   // Step 5: Create a carpool for the second user
//   const startAddress = faker.helpers.arrayElement(addressesInVancouver);
//   const endAddress = faker.helpers.arrayElement(addressesInVancouver);
//   const carpoolId = uuid();

//   await db.insert(carpools).values({
//     id: carpoolId,
//     driverId: secondUserId,
//     vehicleId: secondUserVehicle.id,
//     groupId: groupId,
//     startAddress: startAddress.address,
//     endAddress: endAddress.address,
//     startLat: startAddress.lat,
//     startLon: startAddress.lon,
//     endLat: endAddress.lat,
//     endLon: endAddress.lon,
//     departureDate: faker.date.future().toISOString().split("T")[0],
//     departureTime: `08:${faker.number
//       .int({ min: 0, max: 59 })
//       .toString()
//       .padStart(2, "0")}`,
//     extraCarSeat: faker.number.int({ min: 1, max: 2 }),
//     winterTires: faker.number.int({ min: 0, max: 1 }),
//     tripPreferences: faker.helpers.arrayElement([
//       "No pets",
//       "Quiet trip",
//       "Flexible departure",
//     ]),
//     createdAt: new Date().toISOString(),
//   });
//   console.log(
//     `Created carpool with ID: ${carpoolId} for user ID: ${secondUserId}`
//   );

//   // Step 6: Add the current user as a request
//   const currentUserRequestId = uuid();

//   await db.insert(requests).values({
//     id: currentUserRequestId,
//     groupId: groupId,
//     parentId: currentUserId,
//     carpoolId: carpoolId,
//     isApproved: 1,
//     startingAddress: startAddress.address,
//     endingAddress: endAddress.address,
//     startingLatitude: startAddress.lat.toString(),
//     startingLongitude: startAddress.lon.toString(),
//     endingLatitude: endAddress.lat.toString(),
//     endingLongitude: endAddress.lon.toString(),
//     pickupTime: faker.date.future().toISOString(),
//     createdAt: new Date().toISOString(),
//   });
//   console.log(
//     `Created request for current user with ID: ${currentUserRequestId}`
//   );

//   // Link the current user's children to the request
//   for (const child of currentUserChildren) {
//     await db.insert(childToRequest).values({
//       id: uuid(),
//       childId: child.id,
//       requestId: currentUserRequestId,
//     });
//     console.log(
//       `Linked child ID: ${child.id} to request ID: ${currentUserRequestId}`
//     );
//   }

//   console.log("Carpool creation complete.");
// };
