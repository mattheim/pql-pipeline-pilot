export const PQL_STATUSES = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  qualified: { label: 'Qualified', color: 'bg-info text-info-foreground' },
  enriched: { label: 'Enriched', color: 'bg-warning text-warning-foreground' },
  ready_for_review: { label: 'Ready for Review', color: 'bg-primary text-primary-foreground' },
  approved: { label: 'Approved', color: 'bg-success text-success-foreground' },
  sent: { label: 'Sent', color: 'bg-success text-success-foreground' },
  rejected: { label: 'Rejected', color: 'bg-destructive text-destructive-foreground' },
} as const;

export type PqlStatus = keyof typeof PQL_STATUSES;

// Update this to your local agents API base URL
export const AGENTS_API_BASE_URL = 'http://localhost:8000';
