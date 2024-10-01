import * as libsql from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { Logger } from "drizzle-orm";

const isDev = process.env.IS_DEV;
const logging = process.env.dbLogging;

const url = isDev ? process.env.LOCAL_DB_URL : process.env.DB_URL;
if (!url) throw new Error("Missing db url env variable");

const authToken = process.env.AUTH_TOKEN;
if (!authToken && !isDev) throw new Error("Missing db auth token env variable");

console.log("DB URL:", url, isDev);

export const config = {
  url,
  authToken,
};

const client = createClient(config);

let dbSingleton: libsql.LibSQLDatabase | undefined;

export const getDB = () => {
  return (dbSingleton ??= libsql.drizzle(client, {
    logger: logging as boolean | Logger | undefined,
  }));
};
