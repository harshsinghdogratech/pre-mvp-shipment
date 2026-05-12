export type Role = "admin" | "client";

export type PackageStatus =
  | "ready_to_send"
  | "pending_invoice_review"
  | "invoice_approved"
  | "ship_requested"
  | "shipped"
  | "ready_for_pickup"
  | "delivered";

export type InvoiceReviewStatus = "pending" | "approved" | "needs_review";

export type ShipProcessingStatus = "pending" | "shipped";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  suite_number?: string | null;
}

export interface InvoiceInfo {
  id: number;
  review_status: InvoiceReviewStatus;
  admin_notes?: string | null;
  file_name?: string | null;
  uploaded_at?: string | null;
}

export interface StatusHistoryItem {
  id: number;
  old_status: string;
  new_status: string;
  changed_at: string;
  changed_by_name?: string | null;
}

export interface PackageOut {
  id: number;
  tracking_number: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  contents_description: string;
  status: PackageStatus;
  client_id: number;
  date_received: string;
  created_at: string;
  updated_at: string;
  client_name?: string | null;
  client_email?: string | null;
  client_suite?: string | null;
  invoice?: InvoiceInfo | null;
}

export interface PackageDetail extends PackageOut {
  status_history: StatusHistoryItem[];
}

export interface InvoiceOut {
  id: number;
  package_id: number;
  file_path: string;
  file_name: string;
  uploaded_at: string;
  review_status: InvoiceReviewStatus;
  admin_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
}

export interface InvoicePendingRow {
  id: number;
  package_id: number;
  package_tracking: string;
  contents_description?: string | null;
  client_name: string;
  client_email: string;
  client_suite?: string | null;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export interface ShipRequestPackageOut {
  id: number;
  package_id: number;
  tracking_number?: string | null;
  contents_description?: string | null;
  status?: PackageStatus | null;
}

export interface ShipRequestOut {
  id: number;
  client_id: number;
  client_name?: string | null;
  client_email?: string | null;
  submitted_at: string;
  processing_status: ShipProcessingStatus;
  packages: ShipRequestPackageOut[];
}

export interface AdminDashboard {
  ready_to_send: number;
  needs_review: number;
  pending_invoice_review: number;
  invoice_approved: number;
  ship_requested: number;
  shipped: number;
  ready_for_pickup: number;
  delivered: number;
  total_clients: number;
  pending_invoice_count: number;
}

export interface ClientDashboard {
  ready_to_send: number;
  needs_review: number;
  pending_invoice_review: number;
  invoice_approved: number;
  ship_requested: number;
  shipped: number;
  ready_for_pickup: number;
  delivered: number;
}

export interface AdminClientListItem {
  id: number;
  name: string;
  email: string;
  suite_number?: string | null;
  package_count: number;
}

export interface AdminClientDetail {
  id: number;
  name: string;
  email: string;
  suite_number?: string | null;
  packages: PackageOut[];
}

export interface ClientShipmentItem {
  id: number;
  tracking_number: string;
  contents_description: string;
  status: PackageStatus;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
  code: string;
}
