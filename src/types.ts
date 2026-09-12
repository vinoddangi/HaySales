export interface Customer {
  id: string; // Document ID
  Id: number; // Numeric sequence ID
  Name: string; // Customer name
  totalOutstandingDue?: number; // Added to support tracking dues!
}
