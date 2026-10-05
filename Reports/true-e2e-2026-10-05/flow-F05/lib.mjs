import { createRequire } from 'module';
const req = createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json');
export const { chromium, devices } = req('playwright');
const r2 = createRequire('/Users/danciulescu/Projects/REAL/package.json');
export const { PrismaClient } = r2('/Users/danciulescu/Projects/Tutor/node_modules/@prisma/client');
export const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://tutor:tutorqa@127.0.0.1:55432/tutor_qa' } } });
export const BASE='http://localhost:3113';
export const DIR='/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/flow-F05';
export const ADMIN='qa-e2e-1005-admin@example.test', PW='QaE2e-1005-pass!';
