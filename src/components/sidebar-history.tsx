//@ts-nocheck
'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { MoreHorizontalIcon, TrashIcon } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { IChat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

type GroupedChats = {
  today: IChat[];
  yesterday: IChat[];
  lastWeek: IChat[];
  lastMonth: IChat[];
  older: IChat[];
};

const ChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: IChat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild isActive={isActive}>
      <Link href={`/chat/${chat._id}`} onClick={() => setOpenMobile(false)}>
        <span>{chat.title}</span>
      </Link>
    </SidebarMenuButton>
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
          showOnHover={!isActive}
        >
          <MoreHorizontalIcon />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
          onSelect={() => onDelete(chat._id as string)}
        >
          <TrashIcon />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </SidebarMenuItem>
);

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<IChat>>(user ? '/api/history' : null, fetcher, {
    fallbackData: [],
  });
  //

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!deleteId) return;

    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((currentHistory) => {
          if (currentHistory) {
            return currentHistory.filter((h) => h._id !== deleteId);
          }
          return [];
        });
        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/chat');
    }
  };

  const groupedChats = useMemo(() => {
    if (!history) return {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: []
    };

    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return history.reduce(
      (groups, chat) => {
        const chatDate = new Date(chat.createdAt || now);

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else {
          groups.older.push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats,
    );
  }, [history]);

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            <div>Login to save and revisit previous chats!</div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item, index) => (
              <div
                key={`skeleton-${index}`}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!history || history.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            <div>
              Your conversations will appear here once you start chatting!
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Render sections only if they have chats
  const renderChatSection = (sectionName: keyof GroupedChats) => {
    const sectionChats = groupedChats[sectionName];
    if (sectionChats.length === 0) return null;

    return (
      <>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
          {sectionName === 'today' ? 'Today' : 
           sectionName === 'yesterday' ? 'Yesterday' : 
           sectionName === 'lastWeek' ? 'Last 7 days' : 
           sectionName === 'lastMonth' ? 'Last 30 days' : 
           'Older'}
        </div>
        {sectionChats.map((chat) => (
          <ChatItem
            key={`${sectionName}-${chat._id}`}
            chat={chat}
            isActive={chat._id === id}
            onDelete={(chatId) => {
              setDeleteId(chatId);
              setShowDeleteDialog(true);
            }}
            setOpenMobile={setOpenMobile}
          />
        ))}
      </>
    );
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {renderChatSection('today')}
            {renderChatSection('yesterday')}
            {renderChatSection('lastWeek')}
            {renderChatSection('lastMonth')}
            {renderChatSection('older')}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}