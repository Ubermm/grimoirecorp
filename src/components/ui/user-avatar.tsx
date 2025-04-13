import { User } from 'next-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  // Get initials from user's name or email
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // Fallback to first two characters of email
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'U'; // Ultimate fallback
  };

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {user?.image ? (
        <AvatarImage 
          src={user.image}
          alt={user.name || user.email || "User"}
        />
      ) : null}
      <AvatarFallback>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}