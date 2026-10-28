import { useState } from 'react';
import { PipelineOverview } from '@/components/PipelineOverview';
import { ReviewQueue } from '@/components/ReviewQueue';
import { PqlDetailPanel } from '@/components/PqlDetailPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PQL_STATUSES } from '@/lib/constants';

export default function Dashboard() {
  const [selectedPql, setSelectedPql] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  return (
    <div className="dashboard-content min-w-0 space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Pipeline Overview</h1>
        <p className="text-sm text-muted-foreground">Monitor and manage your PQL pipeline</p>
      </div>

      <PipelineOverview />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Review Queue</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(PQL_STATUSES).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Split only when the available content width can accommodate both panels. */}
      <div className={`dashboard-review-grid grid min-w-0 grid-cols-1 gap-6 ${selectedPql ? 'has-selection' : ''}`}>
        <ReviewQueue
          onSelect={setSelectedPql}
          selectedId={selectedPql}
          statusFilter={statusFilter === 'all' ? undefined : statusFilter}
        />
        {selectedPql && (
          <div className="dashboard-detail min-w-0">
            <PqlDetailPanel pqlId={selectedPql} onClose={() => setSelectedPql(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
