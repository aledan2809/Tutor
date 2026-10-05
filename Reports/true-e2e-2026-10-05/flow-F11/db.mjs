import { createRequire } from 'module';
const r = createRequire('/Users/danciulescu/Projects/REAL/package.json');
const { PrismaClient } = r('/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client');
export const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa' } } });
export const bcrypt = r('/Users/danciulescu/Projects/Tutor/node_modules/bcryptjs');
