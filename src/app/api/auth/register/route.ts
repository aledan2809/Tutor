import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-handler";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  domainSlug: z.string().optional(),
});

async function _POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, domainSlug } = parsed.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Create user
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      emailVerified: new Date(), // Auto-verify for credentials signup
    },
  });

  // Auto-enroll in selected domain as STUDENT
  if (domainSlug) {
    const domain = await prisma.domain.findUnique({
      where: { slug: domainSlug },
    });
    if (domain) {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          domainId: domain.id,
          roles: ["STUDENT"],
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Account created. You can now sign in.",
  }, { status: 201 });
}

export const POST = withErrorHandler(_POST);
