import { Prisma, PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export { Prisma };
export type {
  business_detail_view_all,
  business_google_images_view,
  business_google_review_view,
  business_opening_hours_view,
  foodeez_review_view,
  top_events_view,
  visitor_business_review_view,
  visitor_food_journey_view,
} from "../../prisma/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 1,
  allowPublicKeyRetrieval: true,
});

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

globalForPrisma.prisma = prisma;

export default prisma;
export { prisma };
