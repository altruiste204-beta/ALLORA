/**
 * ALLORA — Security invariant catalogue.
 *
 * This file deliberately does NOT report fake "100% passed" results.
 * Runtime security is enforced by Supabase PostgreSQL/RLS/functions.
 * Integration tests must run against a dedicated test Supabase project.
 */

export interface SecurityTestCase {
  category: string;
  name: string;
  description: string;
  expectedOutcome: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const SECURITY_ATTACK_TEST_SUITE: SecurityTestCase[] = [
  {
    category: 'Authentication',
    name: 'Unauthenticated private data access',
    description: 'Unauthenticated clients must not read profiles, notifications, memberships or private content.',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    category: 'Identity',
    name: 'Foreign identity spoofing',
    description: 'A user must never create or mutate a record as another user.',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    category: 'Privilege escalation',
    name: 'Membership role escalation',
    description: 'A MEMBER cannot become ADMIN/OWNER; an ADMIN cannot change ownership; OWNER cannot be demoted.',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    category: 'Privacy',
    name: 'Church join-code disclosure',
    description: 'church_secrets has no client SELECT/INSERT/UPDATE/DELETE policy. Join-code lookup uses a controlled RPC.',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    category: 'Events',
    name: 'Capacity bypass',
    description: 'event_participants has no client INSERT/UPDATE policy. Registration/cancellation use locked RPCs.',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    category: 'Community',
    name: 'Reaction/counter tampering',
    description: 'reactions and comment_count are server-controlled.',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    category: 'Account',
    name: 'Deactivated account writes',
    description: 'A deactivated account cannot perform normal application writes.',
    expectedOutcome: 'PERMISSION_DENIED',
  },
];

export function describeSecuritySuite(): {
  total: number;
  executed: boolean;
  message: string;
} {
  return {
    total: SECURITY_ATTACK_TEST_SUITE.length,
    executed: false,
    message: 'Catalogue only: execute integration tests against a dedicated Supabase test project before claiming a pass rate.',
  };
}
