import { useState } from "react";
import Layout from "@/components/Layout";
import { usePageTitle } from "@/hooks/use-page-title";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, UserPlus, MessageCircle, Sparkles, ChevronRight, Download, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type FilterType = "all" | "likes" | "followers" | "mentions";

interface Notification {
  id: string;
  type: "follow" | "like" | "mention" | "system" | "multi-like";
  user?: string;
  content: string;
  time: string;
  isUnread: boolean;
  section: "recent" | "earlier";
  actionLabel?: string;
  trackName?: string;
  commentPreview?: string;
  otherCount?: number;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "follow",
    user: "Aura",
    content: "followed you",
    time: "2m ago",
    isUnread: true,
    section: "recent",
    actionLabel: "Follow Back",
  },
  {
    id: "2",
    type: "like",
    user: "Sonic",
    content: "liked",
    trackName: "Neon Dreams",
    time: "15m ago",
    isUnread: true,
    section: "recent",
  },
  {
    id: "3",
    type: "system",
    content: 'Your track "Cyber Pulse" is ready.',
    time: "1h ago",
    isUnread: false,
    section: "earlier",
  },
  {
    id: "4",
    type: "mention",
    user: "Luna",
    content: "mentioned you in a comment",
    commentPreview: '"This beat is absolutely insane! How..."',
    time: "3h ago",
    isUnread: false,
    section: "earlier",
  },
  {
    id: "5",
    type: "multi-like",
    user: "Elias",
    content: "liked your comment",
    otherCount: 4,
    time: "5h ago",
    isUnread: false,
    section: "earlier",
  },
];

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "likes", label: "Likes" },
  { key: "followers", label: "Followers" },
  { key: "mentions", label: "Mentions" },
];

function NotificationIcon({ type }: { type: Notification["type"] }) {
  const iconMap = {
    follow: <UserPlus className="w-6 h-6 text-primary" />,
    like: <Heart className="w-6 h-6 text-red-500" />,
    mention: <MessageCircle className="w-6 h-6 text-secondary" />,
    system: <Sparkles className="w-6 h-6 text-primary" />,
    "multi-like": <Users className="w-5 h-5 text-primary" />,
  };
  return iconMap[type];
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 px-4 min-h-[80px] py-3 justify-between group hover:bg-white/5 transition-colors rounded-lg"
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <NotificationIcon type={notification.type} />
          </div>
          {notification.isUnread && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full border-2 border-background" />
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <p className="text-sm font-medium leading-tight">
            {notification.user && (
              <span className="font-bold text-primary">{notification.user}</span>
            )}
            {notification.type === "multi-like" && notification.otherCount && (
              <span className="text-muted-foreground"> and {notification.otherCount} others</span>
            )}
            {notification.type === "system" && <span className="font-bold">AI: </span>}
            {" "}
            {notification.content}
            {notification.trackName && (
              <span className="text-primary italic"> "{notification.trackName}"</span>
            )}
          </p>
          {notification.commentPreview && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notification.commentPreview}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
        </div>
      </div>
      <div className="shrink-0">
        {notification.actionLabel ? (
          <Button size="sm" className="text-xs font-bold neon-shadow" data-testid={`button-action-${notification.id}`}>
            {notification.actionLabel}
          </Button>
        ) : notification.type === "system" ? (
          <Button variant="ghost" size="icon" className="text-muted-foreground" data-testid={`button-download-${notification.id}`} aria-label="Download notification item" title="Download notification item">
            <Download className="w-4 h-4" />
          </Button>
        ) : notification.type === "mention" ? (
          <MessageCircle className="w-5 h-5 text-muted-foreground/30" />
        ) : notification.type === "multi-like" ? (
          <Heart className="w-5 h-5 text-primary fill-primary" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
        )}
      </div>
    </motion.div>
  );
}

export default function Activity() {
  usePageTitle("Activity");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredNotifications = NOTIFICATIONS.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "likes") return n.type === "like" || n.type === "multi-like";
    if (activeFilter === "followers") return n.type === "follow";
    if (activeFilter === "mentions") return n.type === "mention";
    return true;
  });

  const recentItems = filteredNotifications.filter((n) => n.section === "recent");
  const earlierItems = filteredNotifications.filter((n) => n.section === "earlier");

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-activity-title">
            <Bell className="w-6 h-6 text-primary" />
            Activity
          </h1>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "shrink-0 h-9 px-5 rounded-lg text-sm font-semibold transition-all",
                activeFilter === filter.key
                  ? "bg-primary text-white neon-shadow"
                  : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
              data-testid={`filter-${filter.key}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            {recentItems.length > 0 && (
              <>
                <div className="px-1 pt-4 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80" data-testid="text-section-recent">
                    Recent
                  </h3>
                </div>
                {recentItems.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </>
            )}

            {earlierItems.length > 0 && (
              <>
                <div className="px-1 pt-6 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40" data-testid="text-section-earlier">
                    Earlier
                  </h3>
                </div>
                {earlierItems.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </>
            )}

            {filteredNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="container-empty-activity">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-1">No activity yet</h3>
                <p className="text-sm text-muted-foreground">
                  When something happens, you'll see it here.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
