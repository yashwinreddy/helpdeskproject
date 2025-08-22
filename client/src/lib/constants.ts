export const TICKET_STATUSES = {
  open: { label: "Open", color: "blue" },
  triaged: { label: "Triaged", color: "yellow" },
  waiting_human: { label: "Waiting Human", color: "orange" },
  resolved: { label: "Resolved", color: "green" },
  closed: { label: "Closed", color: "gray" },
} as const;

export const CATEGORIES = {
  billing: { label: "Billing", color: "blue" },
  tech: { label: "Technical", color: "red" },
  shipping: { label: "Shipping", color: "green" },
  other: { label: "Other", color: "gray" },
} as const;

export const USER_ROLES = {
  admin: { label: "Admin", color: "purple" },
  agent: { label: "Agent", color: "blue" },
  user: { label: "User", color: "gray" },
} as const;

export const AUDIT_ACTIONS = {
  TICKET_CREATED: "Ticket Created",
  TRIAGE_STARTED: "Triage Started", 
  AGENT_CLASSIFIED: "AI Classified",
  KB_RETRIEVED: "KB Retrieved",
  DRAFT_GENERATED: "Draft Generated",
  AUTO_CLOSED: "Auto-Closed",
  ASSIGNED_TO_HUMAN: "Assigned to Human",
  REPLY_SENT: "Reply Sent",
  TICKET_ASSIGNED: "Ticket Assigned",
  TRIAGE_COMPLETED: "Triage Completed",
  TRIAGE_ERROR: "Triage Error",
} as const;
