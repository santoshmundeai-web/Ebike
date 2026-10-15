import type { Role } from '@ebike/core';
import { and, count, eq, schema, type Database } from '@ebike/db';
import { betterAuth, type BetterAuthPlugin } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { organization } from 'better-auth/plugins/organization';
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, memberAc, ownerAc } from 'better-auth/plugins/organization/access';
import { phoneNumber } from 'better-auth/plugins/phone-number';

/**
 * Better Auth organization roles. Only the owner manages the organization itself; business
 * permissions live in packages/core/src/permissions.ts.
 */
const ac = createAccessControl(defaultStatements);
const orgRoles = {
  owner: ac.newRole(ownerAc.statements),
  branch_manager: ac.newRole(memberAc.statements),
  sales_executive: ac.newRole(memberAc.statements),
  service_advisor: ac.newRole(memberAc.statements),
  technician: ac.newRole(memberAc.statements),
  accountant: ac.newRole(memberAc.statements),
} satisfies Record<Role, unknown>;

/** Indian mobile in E.164; the login form normalises input with `indianMobileSchema` first. */
export const PHONE_E164 = /^\+91[6-9]\d{9}$/;

export interface AuthDeps {
  db: Database;
  secret: string;
  baseURL: string;
  /** Hours of inactivity before the session expires (NFR-05). */
  sessionIdleHours: number;
  /** Delivers a login OTP. Production enqueues an SMS job; tests capture the code. */
  sendOtp: (phoneNumber: string, code: string) => Promise<void>;
  /** Extra plugins, e.g. `nextCookies()` in the Next.js app (must be last). */
  plugins?: BetterAuthPlugin[];
}

/**
 * Tenant = Better Auth organization (same id as `tenants.id`). Staff are created by the owner,
 * so public sign-up is off; staff sign in with email + password or phone + OTP.
 */
export function createAuth(deps: AuthDeps) {
  const { db } = deps;

  /** Active staff user with at least one tenant membership, or null. */
  async function activeStaffUser(where: { userId?: string; phoneNumber?: string }) {
    const condition = where.userId
      ? eq(schema.user.id, where.userId)
      : eq(schema.user.phoneNumber, where.phoneNumber ?? '');
    const [row] = await db
      .select({
        id: schema.user.id,
        active: schema.user.active,
        memberships: count(schema.member.id),
      })
      .from(schema.user)
      .leftJoin(schema.member, eq(schema.member.userId, schema.user.id))
      .where(condition)
      .groupBy(schema.user.id);
    return row && row.active && row.memberships > 0 ? row : null;
  }

  return betterAuth({
    appName: 'EBike DMS',
    secret: deps.secret,
    baseURL: deps.baseURL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        organization: schema.organization,
        member: schema.member,
        invitation: schema.invitation,
      },
    }),
    advanced: { database: { generateId: 'uuid' } },
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
    session: {
      expiresIn: deps.sessionIdleHours * 60 * 60,
      // Each request after an hour slides the expiry forward, so it acts as an inactivity timeout.
      updateAge: 60 * 60,
    },
    user: {
      additionalFields: {
        active: { type: 'boolean', defaultValue: true, input: false },
      },
    },
    rateLimit: {
      enabled: true,
      customRules: {
        '/phone-number/send-otp': { window: 60, max: 3 },
        '/sign-in/email': { window: 60, max: 10 },
      },
    },
    databaseHooks: {
      session: {
        create: {
          // Deactivated users and users with no tenant cannot sign in (TC-1.3-07, TC-1.3-12).
          // The first membership becomes the active tenant; switching tenants comes in Phase 2.
          before: async (session) => {
            if (!(await activeStaffUser({ userId: session.userId }))) {
              throw new APIError('FORBIDDEN', { message: 'ACCOUNT_DISABLED' });
            }
            if (session.activeOrganizationId) return;
            const [first] = await db
              .select({ organizationId: schema.member.organizationId })
              .from(schema.member)
              .where(eq(schema.member.userId, session.userId))
              .orderBy(schema.member.createdAt)
              .limit(1);
            return { data: { ...session, activeOrganizationId: first?.organizationId ?? null } };
          },
        },
      },
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: false,
        creatorRole: 'owner',
        ac,
        roles: orgRoles,
      }),
      phoneNumber({
        otpLength: 6,
        expiresIn: 5 * 60,
        allowedAttempts: 3,
        phoneNumberValidator: (value) => PHONE_E164.test(value),
        // Only staff get an SMS. Unknown numbers get the same response but no message,
        // so the endpoint cannot be used to find out who is a user or to run up SMS costs.
        sendOTP: async ({ phoneNumber: phone, code }) => {
          if (await activeStaffUser({ phoneNumber: phone })) await deps.sendOtp(phone, code);
        },
      }),
      ...(deps.plugins ?? []),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Membership role of a user in a tenant, or null. */
export async function memberRole(db: Database, userId: string, tenantId: string) {
  const [row] = await db
    .select({ role: schema.member.role })
    .from(schema.member)
    .where(and(eq(schema.member.userId, userId), eq(schema.member.organizationId, tenantId)));
  return row?.role ?? null;
}
