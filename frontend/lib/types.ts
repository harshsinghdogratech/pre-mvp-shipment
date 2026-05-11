export type Role = "admin" | "client";

export type PackageStatus =
  | "pending_invoice"
  | "invoice_uploaded"
  | "approved"
  | "rejected"
  | "shipment_requested"
  | "shipped";

export type InvoiceStatus = "pending" | "approved" | "rejected";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LatestInvoice {
  id: number;
  status: InvoiceStatus;
  rejection_reason?: string | null;
}

export interface PackageRow {
  id: number;
  title: string;
  description: string | null;
  status: PackageStatus;
  created_by_id: number;
  client_id: number;
  created_at: string;
  updated_at: string;
  latest_invoice: LatestInvoice | null;
  client_name?: string | null;
  client_email?: string | null;
}

export interface ClientOption {
  id: number;
  name: string;
  email: string;
}

export interface InvoicePending {
  id: number;
  package_id: number;
  package_title: string;
  client_name: string;
  client_email: string;
  original_file_name: string;
  file_type: string;
  uploaded_at: string;
}

export interface InvoiceDetail {
  id: number;
  package_id: number;
  client_id: number;
  original_file_name: string;
  stored_file_name: string;
  file_path: string;
  file_type: string;
  status: InvoiceStatus;
  rejection_reason: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
}

export interface StatsAdmin {
  total_packages: number;
  pending_reviews: number;
  shipment_requests: number;
  shipped_packages: number;
}

export interface StatsClient {
  total_packages: number;
  pending_uploads: number;
  approved_packages: number;
  shipped_packages: number;
}
