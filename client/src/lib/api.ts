import { apiRequest } from '@/lib/queryClient';
import type { 
  LoginData, 
  InsertTicket, 
  InsertArticle,
  InsertConfig
} from '@shared/schema';

export const api = {
  // Auth
  login: async (credentials: LoginData) => {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    return response.json();
  },
  
  register: async (userData: any) => {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    return response.json();
  },

  // Tickets
  createTicket: async (ticket: InsertTicket) => {
    const response = await apiRequest('POST', '/api/tickets', ticket);
    return response.json();
  },
  
  replyToTicket: async (ticketId: string, content: string, status?: string) => {
    const response = await apiRequest('POST', `/api/tickets/${ticketId}/reply`, { 
      content, 
      status 
    });
    return response.json();
  },

  assignTicket: async (ticketId: string, assigneeId: string) => {
    const response = await apiRequest('POST', `/api/tickets/${ticketId}/assign`, { 
      assigneeId 
    });
    return response.json();
  },

  // KB Articles
  createArticle: async (article: InsertArticle) => {
    const response = await apiRequest('POST', '/api/kb', article);
    return response.json();
  },
  
  updateArticle: async (id: string, updates: Partial<InsertArticle>) => {
    const response = await apiRequest('PUT', `/api/kb/${id}`, updates);
    return response.json();
  },
  
  deleteArticle: async (id: string) => {
    await apiRequest('DELETE', `/api/kb/${id}`);
  },

  // Config
  updateConfig: async (config: Partial<InsertConfig>) => {
    const response = await apiRequest('PUT', '/api/config', config);
    return response.json();
  },

  // Manual triage
  triggerTriage: async (ticketId: string) => {
    const response = await apiRequest('POST', `/api/agent/triage/${ticketId}`);
    return response.json();
  },
};
