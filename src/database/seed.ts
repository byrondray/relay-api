import { getDB } from './client';
import { users } from './schema/users';
import { messages } from './schema/messages';

const db = getDB();

const seedDatabase = async () => {
  const messagesExist = (await db.select().from(messages)).length > 0;
  if (messagesExist) {
    await db.delete(messages);
  }

  const usersExist = (await db.select().from(users)).length > 0;
  if (usersExist) {
    await db.delete(users);
  }

  console.log('Seeding complete');
};

seedDatabase();
