export const PQL_STATUSES = {
  pending: { label: 'Pending', color: 'bg-warning text-warning-foreground' },
  qualified: { label: 'Qualified', color: 'bg-success text-success-foreground' },
  rejected: { label: 'Rejected', color: 'bg-destructive text-destructive-foreground' },
} as const;

export type PqlStatus = keyof typeof PQL_STATUSES;

// Update this to your local agents API base URL
export const AGENTS_API_BASE_URL = 'http://localhost:8000';
