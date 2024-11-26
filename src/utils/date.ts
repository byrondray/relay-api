import { ApolloError } from "apollo-server-errors";

export function validateDate(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

export function validateTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/; // Matches HH:mm format
  return timeRegex.test(time);
}

export function validateRequiredFields(fields: Record<string, any>, p0: string[]): void {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || value === "") {
      throw new ApolloError(`Field "${key}" is required.`);
    }
  }
}
