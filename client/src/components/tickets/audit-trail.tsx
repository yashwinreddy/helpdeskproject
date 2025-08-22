import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuditLog } from '@shared/schema';
import { AUDIT_ACTIONS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

interface AuditTrailProps {
  ticketId: string;
}

export function AuditTrail({ ticketId }: AuditTrailProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: [`/api/tickets/${ticketId}/audit`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const logs = auditLogs as AuditLog[];

  return (
    <Card data-testid="card-audit-trail">
      <CardHeader>
        <CardTitle className="text-sm">Audit Trail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {logs?.map((log) => (
          <div key={log.id} className="flex items-start space-x-3" data-testid={`audit-log-${log.id}`}>
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getAuditColor(log.action)}`}></div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-gray-900" data-testid={`audit-action-${log.id}`}>
                {AUDIT_ACTIONS[log.action as keyof typeof AUDIT_ACTIONS] || log.action}
              </p>
              {log.meta && (
                <div className="text-gray-600 mt-1" data-testid={`audit-meta-${log.id}`}>
                  {renderAuditMeta(log.action, log.meta as any) as React.ReactNode}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1" data-testid={`audit-timestamp-${log.id}`}>
                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        
        {logs && logs.length > 0 && (
          <div className="mt-4 p-3 bg-white rounded border text-sm">
            <p className="font-medium text-gray-700 mb-1">Trace ID</p>
            <p className="text-gray-600 font-mono text-xs" data-testid="text-trace-id">
              {logs[0]?.traceId}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getAuditColor(action: string): string {
  switch (action) {
    case 'TICKET_CREATED':
      return 'bg-blue-500';
    case 'AGENT_CLASSIFIED':
      return 'bg-purple-500';
    case 'KB_RETRIEVED':
      return 'bg-green-500';
    case 'DRAFT_GENERATED':
      return 'bg-yellow-500';
    case 'AUTO_CLOSED':
      return 'bg-green-600';
    case 'ASSIGNED_TO_HUMAN':
      return 'bg-orange-500';
    case 'REPLY_SENT':
      return 'bg-blue-600';
    case 'TRIAGE_ERROR':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

function renderAuditMeta(action: string, meta: any): React.ReactNode {
  switch (action) {
    case 'AGENT_CLASSIFIED':
      return (
        <div>
          Category: {meta.predictedCategory} ({(meta.confidence * 100).toFixed(0)}% confidence)
        </div>
      );
    case 'KB_RETRIEVED':
      return (
        <div>
          {meta.articlesFound} articles found and analyzed
        </div>
      );
    case 'DRAFT_GENERATED':
      return (
        <div>
          Response composed with {meta.citationsCount} citations
        </div>
      );
    case 'AUTO_CLOSED':
      return (
        <div>
          Confidence {(meta.confidence * 100).toFixed(0)}% ≥ {(meta.threshold * 100).toFixed(0)}% threshold
        </div>
      );
    case 'ASSIGNED_TO_HUMAN':
      return (
        <div>
          Confidence {(meta.confidence * 100).toFixed(0)}% below {(meta.threshold * 100).toFixed(0)}% threshold
        </div>
      );
    case 'REPLY_SENT':
      return (
        <div>
          by {meta.agentId} ({meta.contentLength} characters)
        </div>
      );
    default:
      return null;
  }
}
