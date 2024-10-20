import {
  getCommunityCenters,
  filterSchoolsByName,
} from "../../services/mapData.service";
import { ApolloError } from "apollo-server-errors";

export const mapDataResolver = {
  Query: {
    getCommunityCenters: async (
      _: any,
      { lat, lon }: { lat: number; lon: number },
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }

      const result = await getCommunityCenters(lat, lon);
      return result.slice(0, 5);
    },

    filterSchoolsByName: async (
      _: any,
      { name }: { name: string },
      { currentUser }: any
    ) => {
      if (!currentUser) {
        throw new ApolloError("Authentication required");
      }
      return await filterSchoolsByName(name);
    },
  },
};
