import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketTable } from '@/components/tickets/ticket-table';
import { CreateTicketModal } from '@/components/tickets/create-ticket-modal';
import type { TicketWithDetails } from '@shared/schema';
import { Plus } from 'lucide-react';

export default function Tickets() {
  const { user } = useAuth();
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMyTickets, setShowMyTickets] = useState<boolean>(false);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (statusFilter) queryParams.append('status', statusFilter);
  if (categoryFilter) queryParams.append('category', categoryFilter);
  if (showMyTickets) queryParams.append('my', 'true');
  
  const queryKey = [`/api/tickets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`];

  const { data: tickets, isLoading } = useQuery({
    queryKey,
  });

  const allTickets = tickets as TicketWithDetails[] || [];
  
  // Apply client-side search filter
  const filteredTickets = searchQuery 
    ? allTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.createdByUser.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allTickets;

  return (
    <div className="p-6" data-testid="page-tickets">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Support Tickets</h2>
          <p className="text-gray-600" data-testid="text-page-description">Manage and track all support requests</p>
        </div>
        <Button 
          onClick={() => setCreateTicketOpen(true)}
          className="bg-primary hover:bg-primary/90"
          data-testid="button-create-ticket"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6" data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="triaged">Triaged</SelectItem>
                  <SelectItem value="waiting_human">Waiting Human</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="tech">Technical</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Search:</label>
              <Input 
                type="text" 
                placeholder="Search tickets..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
                data-testid="input-search"
              />
            </div>
            
            {user?.role === 'user' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="myTickets"
                  checked={showMyTickets}
                  onChange={(e) => setShowMyTickets(e.target.checked)}
                  className="rounded border-gray-300"
                  data-testid="checkbox-my-tickets"
                />
                <label htmlFor="myTickets" className="text-sm font-medium text-gray-700">
                  My Tickets Only
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <TicketTable tickets={filteredTickets} />
      )}

      <CreateTicketModal 
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
      />
    </div>
  );
}
