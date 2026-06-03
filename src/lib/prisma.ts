import { PrismaClient } from "@prisma/client";
import { normalizeQuestionData } from "./normalize-option-prefix";

// Single chokepoint: every Question write strips embedded answer-letter
// prefixes from options/correctAnswer, so renderers (which add their own
// letter) never produce "A. a) ...". Covers all create/createMany/update
// sites + any future ones without touching each route.
function createPrisma() {
  return new PrismaClient().$extends({
    query: {
      question: {
        create({ args, query }) {
          normalizeQuestionData(args.data as Record<string, unknown>);
          return query(args);
        },
        createMany({ args, query }) {
          if (Array.isArray(args.data)) args.data.forEach((d) => normalizeQuestionData(d as Record<string, unknown>));
          else normalizeQuestionData(args.data as Record<string, unknown>);
          return query(args);
        },
        update({ args, query }) {
          normalizeQuestionData(args.data as Record<string, unknown>);
          return query(args);
        },
        updateMany({ args, query }) {
          normalizeQuestionData(args.data as Record<string, unknown>);
          return query(args);
        },
        upsert({ args, query }) {
          normalizeQuestionData(args.create as Record<string, unknown>);
          normalizeQuestionData(args.update as Record<string, unknown>);
          return query(args);
        },
      },
    },
  });
}

type ExtendedPrisma = ReturnType<typeof createPrisma>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrisma | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
