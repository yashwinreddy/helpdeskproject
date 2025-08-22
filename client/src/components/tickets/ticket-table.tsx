import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type { TicketWithDetails } from '@shared/schema';
import { TICKET_STATUSES, CATEGORIES } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

interface TicketTableProps {
  tickets: TicketWithDetails[];
}

export function TicketTable({ tickets }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500" data-testid="text-no-tickets">No tickets found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="table-tickets">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" className="rounded border-gray-300" data-testid="checkbox-select-all" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AI Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((ticket) => {
              const statusInfo = TICKET_STATUSES[ticket.status];
              const categoryInfo = CATEGORIES[ticket.category];
              const confidence = ticket.agentSuggestion?.confidence || 0;
              
              return (
                <tr 
                  key={ticket.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  data-testid={`row-ticket-${ticket.id}`}
                >
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`checkbox-ticket-${ticket.id}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <Link href={`/tickets/${ticket.id}`}>
                        <a className="text-sm font-medium text-gray-900 hover:text-primary-600" data-testid={`link-ticket-${ticket.id}`}>
                          #{ticket.id.slice(-6)} - {ticket.title}
                        </a>
                      </Link>
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                        {ticket.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={statusInfo.color === 'green' ? 'default' : 'secondary'}
                      className={statusInfo.color === 'green' ? 'bg-green-100 text-green-800' : 
                               statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                               statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                               statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                               'bg-gray-100 text-gray-800'}
                      data-testid={`badge-status-${ticket.status}`}
                    >
                      {statusInfo.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="outline"
                      className={categoryInfo.color === 'blue' ? 'border-blue-200 text-blue-800' :
                               categoryInfo.color === 'red' ? 'border-red-200 text-red-800' :
                               categoryInfo.color === 'green' ? 'border-green-200 text-green-800' :
                               'border-gray-200 text-gray-800'}
                      data-testid={`badge-category-${ticket.category}`}
                    >
                      {categoryInfo.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900" data-testid={`text-customer-${ticket.id}`}>
                    {ticket.createdByUser.email}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.assigneeUser ? (
                      <div className="flex items-center" data-testid={`assignee-${ticket.id}`}>
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">
                            {ticket.assigneeUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900">{ticket.assigneeUser.name}</span>
                      </div>
                    ) : ticket.status === 'resolved' && ticket.agentSuggestion?.autoClosed ? (
                      <div className="flex items-center" data-testid={`assignee-ai-${ticket.id}`}>
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                          </svg>
                        </div>
                        <span className="text-sm text-gray-900">AI Agent</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500" data-testid={`assignee-unassigned-${ticket.id}`}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.agentSuggestion && (
                      <div className="flex items-center" data-testid={`ai-score-${ticket.id}`}>
                        <Progress 
                          value={confidence * 100} 
                          className="w-16 mr-2"
                          data-testid={`progress-confidence-${ticket.id}`}
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {(confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500" data-testid={`text-created-${ticket.id}`}>
                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
