/** Référentiels d'organisation (cf. docs/contracts/referentiels.md). */

export interface Department {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  departmentId?: string;
}

export type DepartmentInput = { name: string };
export type ServiceInput = { name: string; departmentId?: string };
