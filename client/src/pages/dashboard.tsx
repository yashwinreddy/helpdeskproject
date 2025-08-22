import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TicketTable } from '@/components/tickets/ticket-table';
import { Link } from 'wouter';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import type { DashboardStats, TicketWithDetails } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets'],
  });

  const dashboardStats = stats as DashboardStats;
  const tickets = (recentTickets as TicketWithDetails[])?.slice(0, 5) || [];

  if (statsLoading || ticketsLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-300 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-300 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-300 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="page-dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Dashboard</h2>
        <p className="text-gray-600" data-testid="text-page-description">Overview of your helpdesk activity</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="stats-grid">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600" data-testid="stat-total-label">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-value">
                  {dashboardStats?.totalTickets || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600 text-sm font-medium">+12%</span>
              <span className="text-gray-500 text-sm ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600" data-testid="stat-open-label">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-open-value">
                  {dashboardStats?.openTickets || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-red-600 mr-1" />
              <span className="text-red-600 text-sm font-medium">+3</span>
              <span className="text-gray-500 text-sm ml-2">since yesterday</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600" data-testid="stat-auto-label">Auto-Resolved</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-auto-value">
                  {dashboardStats?.autoResolved || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600 text-sm font-medium">85%</span>
              <span className="text-gray-500 text-sm ml-2">success rate</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600" data-testid="stat-response-label">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-response-value">
                  {dashboardStats?.avgResponseTime || "2.4h"}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600 text-sm font-medium">-15%</span>
              <span className="text-gray-500 text-sm ml-2">faster</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets Table */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900" data-testid="text-recent-tickets-title">
              Recent Tickets
            </CardTitle>
            <Link href="/tickets">
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary/80"
                data-testid="link-view-all-tickets"
              >
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-recent-tickets">
                <thead className="bg-gray-50">
                  <tr>
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
                      Assignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50" data-testid={`row-recent-ticket-${ticket.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900" data-testid={`text-ticket-title-${ticket.id}`}>
                            #{ticket.id.slice(-6)} - {ticket.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {ticket.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={ticket.status === 'resolved' ? 'default' : 'secondary'}
                          className={
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            ticket.status === 'waiting_human' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'triaged' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }
                          data-testid={`badge-ticket-status-${ticket.id}`}
                        >
                          {ticket.status === 'resolved' ? 'Resolved' :
                           ticket.status === 'waiting_human' ? 'Waiting Human' :
                           ticket.status === 'triaged' ? 'Triaged' : 'Open'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize" data-testid={`text-ticket-category-${ticket.id}`}>
                        {ticket.category === 'tech' ? 'Technical' : ticket.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900" data-testid={`text-ticket-assignee-${ticket.id}`}>
                        {ticket.assigneeUser ? ticket.assigneeUser.name :
                         ticket.status === 'resolved' && ticket.agentSuggestion?.autoClosed ? 'AI Agent' : 
                         'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500" data-testid={`text-ticket-created-${ticket.id}`}>
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-ticket-${ticket.id}`}>
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500" data-testid="text-no-recent-tickets">No recent tickets</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
