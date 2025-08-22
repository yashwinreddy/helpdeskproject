import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuditTrail } from '@/components/tickets/audit-trail';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Bot, User } from 'lucide-react';
import { Link } from 'wouter';
import type { TicketWithDetails } from '@shared/schema';
import { TICKET_STATUSES, CATEGORIES } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';

export default function TicketDetail() {
  const params = useParams();
  const ticketId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [replyContent, setReplyContent] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: [`/api/tickets/${ticketId}`],
    enabled: !!ticketId,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ content, status }: { content: string; status?: string }) => {
      return api.replyToTicket(ticketId!, content, status);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reply sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/audit`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setReplyContent('');
      setNewStatus('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  const triggerTriageMutation = useMutation({
    mutationFn: () => api.triggerTriage(ticketId!),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Triage triggered successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/audit`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to trigger triage",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-300 rounded w-64 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-300 rounded-xl animate-pulse"></div>
            <div className="h-48 bg-gray-300 rounded-xl animate-pulse"></div>
          </div>
          <div className="h-96 bg-gray-300 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const ticketData = ticket as TicketWithDetails;
  
  if (!ticketData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket Not Found</h2>
          <Link href="/tickets">
            <Button>Back to Tickets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = TICKET_STATUSES[ticketData.status];
  const categoryInfo = CATEGORIES[ticketData.category];
  const canReply = user?.role === 'admin' || user?.role === 'agent';
  const canTriage = user?.role === 'admin' || user?.role === 'agent';

  const handleSendReply = () => {
    if (!replyContent.trim()) return;
    replyMutation.mutate({ 
      content: replyContent,
      status: newStatus || undefined
    });
  };

  return (
    <div className="p-6" data-testid="page-ticket-detail">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tickets">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="text-ticket-title">
              #{ticketData.id.slice(-6)} - {ticketData.title}
            </h2>
            <div className="flex items-center space-x-4 mt-2">
              <Badge 
                variant={statusInfo.color === 'green' ? 'default' : 'secondary'}
                className={
                  statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                  statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }
                data-testid="badge-ticket-status"
              >
                {statusInfo.label}
              </Badge>
              <span className="text-sm text-gray-500" data-testid="text-ticket-meta">
                Created {formatDistanceToNow(new Date(ticketData.createdAt), { addSuffix: true })} by {ticketData.createdByUser.email}
              </span>
            </div>
          </div>
        </div>
        
        {canTriage && ticketData.status === 'open' && (
          <Button
            onClick={() => triggerTriageMutation.mutate()}
            disabled={triggerTriageMutation.isPending}
            variant="outline"
            data-testid="button-trigger-triage"
          >
            {triggerTriageMutation.isPending ? "Triaging..." : "Trigger Triage"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Ticket */}
          <Card className="bg-gray-50" data-testid="card-original-ticket">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-500 text-white">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900" data-testid="text-customer-name">
                      {ticketData.createdByUser.name}
                    </span>
                    <span className="text-gray-500 text-sm" data-testid="text-customer-timestamp">
                      {formatDistanceToNow(new Date(ticketData.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-gray-700" data-testid="text-ticket-description">
                    {ticketData.description}
                  </p>
                  {ticketData.attachmentUrls && ticketData.attachmentUrls.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                      {ticketData.attachmentUrls.map((url, index) => (
                        <a 
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm block"
                          data-testid={`link-attachment-${index}`}
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Response */}
          {ticketData.agentSuggestion && ticketData.replies.some(r => r.authorType === 'system') && (
            <Card className="bg-purple-50 border-purple-200" data-testid="card-ai-response">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600">
                      <Bot className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900" data-testid="text-ai-agent">AI Agent</span>
                      <span className="text-gray-500 text-sm" data-testid="text-ai-timestamp">
                        {formatDistanceToNow(new Date(ticketData.agentSuggestion.createdAt), { addSuffix: true })}
                      </span>
                      {ticketData.agentSuggestion.autoClosed && (
                        <Badge className="bg-green-100 text-green-800" data-testid="badge-auto-resolved">
                          Auto-resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3" data-testid="text-ai-reply">
                      {ticketData.agentSuggestion.draftReply}
                    </p>
                    
                    {ticketData.agentSuggestion.articleIds.length > 0 && (
                      <div className="mt-4 p-3 bg-white rounded border border-purple-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Referenced Articles:</p>
                        <ul className="space-y-1" data-testid="list-referenced-articles">
                          {ticketData.agentSuggestion.articleIds.map((articleId, index) => (
                            <li key={articleId} className="text-sm">
                              <span className="text-primary">{index + 1}. Article {articleId.slice(-6)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Replies */}
          {ticketData.replies.filter(r => r.authorType === 'agent').map((reply) => (
            <Card key={reply.id} className="bg-white" data-testid={`card-reply-${reply.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {reply.author?.name.split(' ').map(n => n[0]).join('') || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900" data-testid={`text-reply-author-${reply.id}`}>
                        {reply.author?.name || 'Agent'}
                      </span>
                      <span className="text-gray-500 text-sm" data-testid={`text-reply-timestamp-${reply.id}`}>
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-700" data-testid={`text-reply-content-${reply.id}`}>
                      {reply.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* AI Analysis Panel */}
          {ticketData.agentSuggestion && (
            <Card className="bg-blue-50 border-blue-200" data-testid="card-ai-analysis">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-blue-900">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Category:</span>
                    <span className="text-blue-800 ml-1 capitalize" data-testid="text-ai-category">
                      {ticketData.agentSuggestion.predictedCategory === 'tech' ? 'Technical' : ticketData.agentSuggestion.predictedCategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Confidence:</span>
                    <span className="text-blue-800 ml-1" data-testid="text-ai-confidence">
                      {(ticketData.agentSuggestion.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Processing Time:</span>
                    <span className="text-blue-800 ml-1" data-testid="text-ai-latency">
                      {(ticketData.agentSuggestion.modelInfo as any)?.latencyMs || '0'}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Model:</span>
                    <span className="text-blue-800 ml-1" data-testid="text-ai-model">
                      {(ticketData.agentSuggestion.modelInfo as any)?.model || 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reply Form */}
          {canReply && (
            <Card data-testid="card-reply-form">
              <CardHeader>
                <CardTitle>Add Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                    data-testid="textarea-reply"
                  />
                  <div className="flex items-center justify-between">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-48" data-testid="select-reply-status">
                        <SelectValue placeholder="Change status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No status change</SelectItem>
                        <SelectItem value="triaged">Triaged</SelectItem>
                        <SelectItem value="waiting_human">Waiting Human</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyContent.trim() || replyMutation.isPending}
                      data-testid="button-send-reply"
                    >
                      {replyMutation.isPending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Audit Trail */}
        <div className="lg:col-span-1">
          <AuditTrail ticketId={ticketId!} />
        </div>
      </div>
    </div>
  );
}
