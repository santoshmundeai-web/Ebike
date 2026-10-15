import { describe, expect, it } from 'vitest';
import {
  branchScope,
  can,
  canAccessBranch,
  PERMISSIONS,
  permissionsOf,
  ROLES,
  type Permission,
  type Role,
} from './permissions';

const holders = (permission: Permission): Role[] => ROLES.filter((r) => can(r, permission));

describe('role permissions (requirements section 2)', () => {
  it('TC-1.3-09 cost price is visible only to Owner, Branch Manager and Accountant', () => {
    expect(holders('costPrice:view')).toEqual(['owner', 'branch_manager', 'accountant']);
  });

  it('TC-1.4-08 only the Owner changes settings, staff and branches', () => {
    expect(holders('settings:update')).toEqual(['owner']);
    expect(holders('staff:manage')).toEqual(['owner']);
    expect(holders('branch:manage')).toEqual(['owner']);
  });

  it('TC-1.14-08 only Owner and Accountant edit or delete payments', () => {
    expect(holders('payment:edit')).toEqual(['owner', 'accountant']);
  });

  it('TC-1.3-10 a Technician sees only assigned job cards', () => {
    expect(can('technician', 'jobCard:viewAssigned')).toBe(true);
    expect(can('technician', 'jobCard:viewAll')).toBe(false);
    expect(can('technician', 'invoice:view')).toBe(false);
  });

  it('TC-1.3-11 discounts above the limit are approved by Owner or Branch Manager only', () => {
    expect(holders('discount:approve')).toEqual(['owner', 'branch_manager']);
  });

  it('TC-1.3-11 a Sales Executive sells but does not run service or reports', () => {
    for (const p of ['quotation:manage', 'booking:manage', 'invoice:create'] as const) {
      expect(can('sales_executive', p)).toBe(true);
    }
    for (const p of ['jobCard:create', 'reports:view', 'dashboard:view'] as const) {
      expect(can('sales_executive', p)).toBe(false);
    }
  });

  it('TC-1.3-11 a Service Advisor creates job cards and service invoices but not sales invoices', () => {
    expect(can('service_advisor', 'jobCard:create')).toBe(true);
    expect(can('service_advisor', 'serviceInvoice:create')).toBe(true);
    expect(can('service_advisor', 'invoice:create')).toBe(false);
  });

  it('TC-1.3-11 the Owner has every permission', () => {
    expect(permissionsOf('owner')).toEqual([...PERMISSIONS]);
  });

  it('TC-1.3-11 an unknown role has no permissions', () => {
    expect(permissionsOf('admin')).toEqual([]);
    expect(can('', 'invoice:view')).toBe(false);
  });
});

describe('branch scope (SAAS-02)', () => {
  it('TC-1.2-13 Owner and Accountant see all branches', () => {
    expect(branchScope('owner', [])).toEqual({ kind: 'all' });
    expect(branchScope('accountant', ['b1'])).toEqual({ kind: 'all' });
  });

  it('TC-1.2-13 branch roles see only their assigned branches', () => {
    const scope = branchScope('sales_executive', ['b1', 'b2', 'b1']);
    expect(scope).toEqual({ kind: 'branches', branchIds: ['b1', 'b2'] });
    expect(canAccessBranch(scope, 'b2')).toBe(true);
    expect(canAccessBranch(scope, 'b3')).toBe(false);
  });

  it('TC-1.2-13 a branch role with no branches sees nothing', () => {
    expect(canAccessBranch(branchScope('technician', []), 'b1')).toBe(false);
  });
});
