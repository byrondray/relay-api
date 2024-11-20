import { sql } from "drizzle-orm";
import { carpools } from "./schema/carpool";
import { requests } from "./schema/carpoolRequests";
import { children } from "./schema/children";
import { communityCenters } from "./schema/communityCenters";
import { friends } from "./schema/friends";
import { groupMessages } from "./schema/groupMessages";
import { groups } from "./schema/groups";
import { messages } from "./schema/messages";
import { childToRequest } from "./schema/requestToChildren";
import { schools } from "./schema/schools";
import { users } from "./schema/users";
import { usersToGroups } from "./schema/usersToGroups";
import { vehicle } from "./schema/vehicle";

import { getDB } from "./client";

const db = getDB();

async function clearAllTables() {
  // Disable foreign key constraints temporarily
  await db.run(sql`PRAGMA foreign_keys = OFF;`);

  const tables = [
    carpools,
    requests,
    children,
    communityCenters,
    friends,
    groupMessages,
    groups,
    messages,
    childToRequest,
    schools,
    users,
    usersToGroups,
    vehicle,
  ];

  for (const table of tables) {
    await db.delete(table); // Deletes all rows in the table
  }

  // Re-enable foreign key constraints
  await db.run(sql`PRAGMA foreign_keys = ON;`);

  console.log("All tables have been cleared!");
}

clearAllTables().catch((error) => {
  console.error("Failed to clear tables:", error);
});
