import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Ticket, 
  BookOpen, 
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onCreateTicket: () => void;
}

export function Sidebar({ onCreateTicket }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, testId: 'link-dashboard' },
    { name: 'Tickets', href: '/tickets', icon: Ticket, testId: 'link-tickets' },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen, testId: 'link-kb' },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'], testId: 'link-settings' },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <nav className="w-64 bg-white border-r border-gray-200 px-4 py-6" data-testid="sidebar">
      <div className="space-y-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <a 
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="px-3 mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Quick Actions
          </p>
        </div>
        <Button 
          onClick={onCreateTicket}
          className="w-full flex items-center px-3 py-2 text-sm font-medium"
          data-testid="button-create-ticket"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>
    </nav>
  );
}
