/**
 * Roles and permissions inside a tenant (requirements section 2). Pure rules, no I/O.
 * Super Admin is a platform role and is not part of this matrix.
 */
export const ROLES = [
  'owner',
  'branch_manager',
  'sales_executive',
  'service_advisor',
  'technician',
  'accountant',
] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'settings:update',
  'staff:manage',
  'branch:manage',
  'audit:view',
  'catalogue:view',
  'catalogue:manage',
  'stock:view',
  'stock:manage',
  'costPrice:view',
  'customer:view',
  'customer:manage',
  'quotation:manage',
  'booking:manage',
  'discount:approve',
  'invoice:view',
  'invoice:create',
  'payment:record',
  'payment:edit',
  'creditNote:create',
  'jobCard:viewAll',
  'jobCard:viewAssigned',
  'jobCard:create',
  'jobCard:update',
  'serviceInvoice:create',
  'dashboard:view',
  'reports:view',
  'reports:export',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const SALES: Permission[] = [
  'customer:view',
  'customer:manage',
  'quotation:manage',
  'booking:manage',
  'invoice:view',
  'invoice:create',
  'payment:record',
];
const SERVICE: Permission[] = [
  'customer:view',
  'customer:manage',
  'jobCard:viewAll',
  'jobCard:create',
  'jobCard:update',
  'serviceInvoice:create',
  'invoice:view',
  'payment:record',
];

/** Default permissions per role. The owner may adjust these later (not in Phase 1). */
const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set(PERMISSIONS),
  branch_manager: new Set<Permission>([
    'catalogue:view',
    'stock:view',
    'stock:manage',
    'costPrice:view',
    ...SALES,
    ...SERVICE,
    'discount:approve',
    'creditNote:create',
    'dashboard:view',
    'reports:view',
    'reports:export',
  ]),
  sales_executive: new Set<Permission>(['catalogue:view', 'stock:view', ...SALES]),
  service_advisor: new Set<Permission>(['catalogue:view', 'stock:view', ...SERVICE]),
  technician: new Set<Permission>(['stock:view', 'jobCard:viewAssigned', 'jobCard:update']),
  accountant: new Set<Permission>([
    'catalogue:view',
    'stock:view',
    'costPrice:view',
    'customer:view',
    'invoice:view',
    'payment:record',
    'payment:edit',
    'creditNote:create',
    'dashboard:view',
    'reports:view',
    'reports:export',
  ]),
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Unknown roles get no permissions. */
export function can(role: string, permission: Permission): boolean {
  return isRole(role) && MATRIX[role].has(permission);
}

export function permissionsOf(role: string): Permission[] {
  return isRole(role) ? PERMISSIONS.filter((p) => MATRIX[role].has(p)) : [];
}

/** Roles that work across the whole tenant; all others are limited to their assigned branches. */
const TENANT_WIDE_ROLES: ReadonlySet<Role> = new Set(['owner', 'accountant']);

export type BranchScope = { kind: 'all' } | { kind: 'branches'; branchIds: string[] };

export function branchScope(role: string, assignedBranchIds: readonly string[]): BranchScope {
  if (isRole(role) && TENANT_WIDE_ROLES.has(role)) return { kind: 'all' };
  return { kind: 'branches', branchIds: [...new Set(assignedBranchIds)] };
}

export function canAccessBranch(scope: BranchScope, branchId: string): boolean {
  return scope.kind === 'all' || scope.branchIds.includes(branchId);
}
