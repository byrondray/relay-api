import { ApolloError } from "apollo-server-errors";
import { getDB } from "../../database/client";
import { GroupInsert, groups } from "../../database/schema/groups";
import { usersToGroups } from "../../database/schema/usersToGroups";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { FirebaseUser } from "./userResolvers";
import { schools } from "../../database/schema/schools";
import { communityCenters } from "../../database/schema/communityCenters";
import { users } from "../../database/schema/users";

const db = getDB();

export const groupResolvers = {
  Query: {
    getGroupWithUsers: async (
      _: any,
      { id }: { id: string },
      { currentUser }: FirebaseUser
    ) => {
      console.log(currentUser, "THIS IS CURRENT USER");
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const groupResult = await db
        .select()
        .from(groups)
        .where(eq(groups.id, id));

      if (groupResult.length === 0) {
        throw new ApolloError("Group not found");
      }

      const members = await db
        .select()
        .from(usersToGroups)
        .where(eq(usersToGroups.groupId, id));

      return {
        ...groupResult[0],
        members,
      };
    },

    getGroup: async (
      _: any,
      { id }: { id: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await db.select().from(groups).where(eq(groups.id, id));

      if (result.length > 0) {
        return result[0];
      }

      return null;
    },

    getGroups: async (_: any, __: any, { currentUser }: FirebaseUser) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const groupsWithMembers = await db
        .select({
          groupId: groups.id,
          groupName: groups.name,
          schoolId: groups.schoolId,
          communityCenterId: groups.communityCenterId,
          imageUrl: groups.imageUrl,
          memberId: users.id,
          memberFirstName: users.firstName,
          memberLastName: users.lastName,
          memberEmail: users.email,
        })
        .from(groups)
        .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
        .leftJoin(users, eq(users.id, usersToGroups.userId))
        .where(eq(usersToGroups.userId, currentUser.uid));

      const result = groupsWithMembers.reduce((acc: any, row: any) => {
        let group = acc.find((g: any) => g.id === row.groupId);
        if (!group) {
          group = {
            id: row.groupId,
            name: row.groupName,
            schoolId: row.schoolId,
            communityCenterId: row.communityCenterId,
            imageUrl: row.imageUrl,
            members: [],
          };
          acc.push(group);
        }
        if (row.memberId) {
          group.members.push({
            id: row.memberId,
            firstName: row.memberFirstName,
            lastName: row.memberLastName,
            email: row.memberEmail,
          });
        }
        return acc;
      }, []);

      return result;
    },
  },

  Mutation: {
    createGroup: async (
      _: any,
      {
        name,
        schoolName,
        communityCenterName,
      }: { name: string; schoolName?: string; communityCenterName?: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      let schoolData = null;
      if (schoolName) {
        const schoolResult = await db
          .select()
          .from(schools)
          .where(eq(schools.name, schoolName));
        if (schoolResult.length > 0) {
          schoolData = schoolResult[0];
        }
      }

      let communityCenterData = null;
      if (communityCenterName) {
        const communityCenterResult = await db
          .select()
          .from(communityCenters)
          .where(eq(communityCenters.name, communityCenterName));
        if (communityCenterResult.length > 0) {
          communityCenterData = communityCenterResult[0];
        }

        const groupData: GroupInsert = {
          id: uuid(),
          name,
          schoolId: schoolData?.id || null,
          communityCenterId: communityCenterData?.id || null,
        };

        const groupResult = await db.insert(groups).values(groupData);

        if (groupResult) {
          const userToGroupData = {
            id: uuid(),
            userId: currentUser.uid,
            groupId: groupData.id,
          };

          await db.insert(usersToGroups).values(userToGroupData);

          return groupData;
        }
      }
    },

    addMemberToGroup: async (
      _: any,
      { groupId, userId }: { groupId: string; userId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const existingMember = await db
        .select()
        .from(usersToGroups)
        .where(
          and(
            eq(usersToGroups.groupId, groupId),
            eq(usersToGroups.userId, userId)
          )
        );

      if (existingMember.length > 0) {
        throw new ApolloError("User is already a member of this group");
      }

      const userToGroupData = {
        id: uuid(),
        userId,
        groupId,
      };

      const result = await db.insert(usersToGroups).values(userToGroupData);

      if (result) {
        return { message: "User added to group successfully" };
      }

      throw new ApolloError("Failed to add user to group");
    },

    deleteMemberFromGroup: async (
      _: any,
      { groupId, userId }: { groupId: string; userId: string },
      { currentUser }: FirebaseUser
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const existingMember = await db
        .select()
        .from(usersToGroups)
        .where(
          and(
            eq(usersToGroups.groupId, groupId),
            eq(usersToGroups.userId, userId)
          )
        );

      if (existingMember.length === 0) {
        throw new ApolloError("User is not a member of this group");
      }

      const result = await db
        .delete(usersToGroups)
        .where(
          and(
            eq(usersToGroups.groupId, groupId),
            eq(usersToGroups.userId, userId)
          )
        );

      if (result) {
        return { message: "User removed from group successfully" };
      }

      throw new ApolloError("Failed to remove user from group");
    },
  },
};
