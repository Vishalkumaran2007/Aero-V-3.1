/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'technician' | 'engineer' | 'supervisor' | 'qa_officer' | 'planner' | 'admin';

export type LogStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'needs_review';
export type ComplianceStatus = 'valid' | 'invalid' | 'pending';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface MaintenanceLog {
  id: number;
  aircraft_id: string;
  ata_chapter: string;
  component: string;
  issue: string;
  action: string;
  technician_id: string;
  timestamp: string;
  compliance_status: ComplianceStatus;
  findings?: string;
  parts_replaced?: string;
  is_draft: boolean;
  status: LogStatus;
  certification_note?: string;
}

export type ViewState = 'DASHBOARD' | 'COPILOT' | 'COMPLIANCE' | 'HISTORY' | 'USERS' | 'PLANNED';
