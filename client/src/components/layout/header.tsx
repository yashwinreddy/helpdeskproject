import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { USER_ROLES } from '@/lib/constants';

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const userInitials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const roleInfo = USER_ROLES[user.role as keyof typeof USER_ROLES];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40" data-testid="header">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m13 0h-3m-12 1v1a3 3 0 003 3h6a3 3 0 003-3V9a3 3 0 00-3-3H9a3 3 0 00-3 3v2"></path>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Smart Helpdesk</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button variant="ghost" size="sm" data-testid="button-notifications">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8" data-testid="avatar-user">
                <AvatarFallback className="bg-gray-300 text-gray-600 text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700" data-testid="text-username">
                {user.name}
              </span>
              <Badge 
                variant={roleInfo.color === 'blue' ? 'default' : 'secondary'}
                className="text-xs"
                data-testid={`badge-role-${user.role}`}
              >
                {roleInfo.label}
              </Badge>
              <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
