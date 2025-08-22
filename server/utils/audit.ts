import { storage } from "../storage";
import type { InsertAuditLog } from "@shared/schema";

export async function createAuditLog(logData: InsertAuditLog): Promise<void> {
  try {
    await storage.createAuditLog(logData);
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - we don't want audit logging failures to break the main flow
  }
}
