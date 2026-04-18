# Notification Bell Feature

## Overview
Smart notification system with a bell icon in the navbar that shows real-time notifications to users.

## Features

### 1. Notification Bell Icon
- **Location**: Top-right of navbar (desktop)
- **Icon**: 🔔 Bell icon
- **Badge**: Red circle with unread count (e.g., "3")
- **Hover**: Background highlight on hover

### 2. Unread Count Badge
- Shows number of unread notifications
- Displays "9+" if more than 9 unread
- Red background with white text
- Positioned at top-right of bell icon

### 3. Notification Dropdown
**Opens on click**, displays:
- Header with "Notifications" title
- Unread count in header
- List of top 5 most recent notifications
- "View all notifications →" link at bottom

### 4. Notification Items
Each notification shows:
- **Icon**: Emoji based on type
  - 🩸 Match notifications (blood request matches)
  - 🎉 Accepted notifications (donor accepted)
  - ✅ Completed notifications (donation completed)
  - 🔔 Default for other types
- **Title**: Bold notification title
- **Message**: Brief description (2 lines max)
- **Time**: Relative time (e.g., "2m ago", "1h ago", "3d ago")
- **Unread indicator**: Blue dot for unread notifications
- **Background**: Light blue tint for unread items

### 5. Smart Notification System
- **Top 5 Only**: Shows only 5 most recent notifications
- **Real-time**: Automatically updates when new notifications arrive
- **Auto-mark read**: Marks notification as read when clicked
- **Navigation**: Clicking notification navigates to relevant page

### 6. Notification Types

#### Match Notification (🩸)
```
Title: "🩸 Urgent Blood Request"
Message: "O+ blood needed 2 km away. You're a top match!"
```

#### Top Donor Selection (🟢)
```
Title: "🟢 You are selected as top donor"
Message: "You're one of 5 top-matched donors for this request."
```

#### Donor Accepted (🎉)
```
Title: "🎉 Donor Found!"
Message: "A donor accepted your O+ blood request."
```

#### Donation Completed (✅)
```
Title: "✅ Donation Completed"
Message: "Thank you for saving a life!"
```

## UI Design

### Notification Bell
```
┌─────────────────┐
│  🔔  (3)        │  ← Bell with badge
└─────────────────┘
```

### Dropdown (Expanded)
```
┌──────────────────────────────────────┐
│  Notifications          3 unread     │
├──────────────────────────────────────┤
│  🩸  Urgent O+ request               │
│      2 km away. You're a top match!  │
│      2m ago                      •   │
├──────────────────────────────────────┤
│  🟢  You are selected as top donor   │
│      One of 5 top-matched donors     │
│      15m ago                     •   │
├──────────────────────────────────────┤
│  🎉  Donor Found!                    │
│      A donor accepted your request   │
│      1h ago                          │
├──────────────────────────────────────┤
│  View all notifications →            │
└──────────────────────────────────────┘
```

## Technical Implementation

### State Management
```typescript
const [notifOpen, setNotifOpen] = useState(false);
const [notifications, setNotifications] = useState<AppNotification[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
```

### Real-time Subscription
```typescript
useEffect(() => {
  if (!user) return;
  
  // Load initial notifications
  const loadNotifications = async () => {
    const notifs = await db.notifications.list(user.id);
    setNotifications(notifs.slice(0, 5)); // Top 5 only
    setUnreadCount(notifs.filter(n => !n.read).length);
  };

  loadNotifications();

  // Subscribe to new notifications
  const channel = db.notifications.subscribeForUser(user.id, (newNotif) => {
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    setUnreadCount(prev => prev + 1);
  });

  return () => channel.unsubscribe();
}, [user]);
```

### Mark as Read
```typescript
const handleNotificationClick = async (notif: AppNotification) => {
  if (!notif.read) {
    await db.notifications.markRead(notif.id);
    setUnreadCount(prev => Math.max(0, prev - 1));
  }
  
  // Navigate to relevant page
  if (notif.request_id) {
    navigate(`/request/${notif.request_id}`);
  }
};
```

### Time Formatting
```typescript
const formatTimeAgo = (dateString: string) => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};
```

## User Experience Flow

1. **New Notification Arrives**
   - Bell icon shows badge with count
   - Badge animates (optional)
   - Real-time update via Supabase subscription

2. **User Clicks Bell**
   - Dropdown opens with smooth animation
   - Shows top 5 notifications
   - Unread notifications highlighted

3. **User Clicks Notification**
   - Notification marked as read
   - Badge count decreases
   - User navigated to relevant page
   - Dropdown closes

4. **User Clicks Outside**
   - Dropdown closes
   - Notifications remain in state

## Responsive Design

### Desktop (≥768px)
- Bell icon in navbar
- Dropdown positioned below bell
- Width: 320px (80 in Tailwind)
- Max height: 384px (96 in Tailwind)

### Mobile (<768px)
- Bell icon in mobile menu (future enhancement)
- Full-width dropdown
- Touch-friendly tap targets

## Animation

### Dropdown Animation
```typescript
initial={{ opacity: 0, y: 10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 10, scale: 0.95 }}
transition={{ duration: 0.15 }}
```

### Badge Pulse (Optional Enhancement)
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

## Integration with Smart Notification System

### Top 5 Donors Get Notified
When a blood request is created:
1. System ranks all available donors
2. Selects top 5 based on:
   - Distance
   - Availability
   - Donation history
3. Sends notification to top 5 only
4. Notification message: "🟢 You are selected as top donor"

### Notification Message Examples

**For Top Donors:**
```
Title: "🟢 You are selected as top donor"
Message: "You're one of 5 top-matched donors for O+ blood request 2 km away."
```

**For Urgent Requests:**
```
Title: "🩸 Urgent O+ request"
Message: "Critical blood needed at City Hospital. Can you help?"
```

**For Accepted Requests:**
```
Title: "🎉 Donor is on the way!"
Message: "A donor accepted your request. Estimated arrival: 15 min."
```

## Database Schema

### notifications table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'match', 'accepted', 'completed', 'info'
  read BOOLEAN DEFAULT FALSE,
  request_id UUID REFERENCES requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Future Enhancements

1. **Push Notifications**
   - Browser push notifications
   - Mobile app notifications

2. **Notification Preferences**
   - User can choose notification types
   - Quiet hours setting

3. **Notification Actions**
   - Quick actions in dropdown
   - "Accept" / "Reject" buttons

4. **Notification Categories**
   - Filter by type
   - Separate tabs for different categories

5. **Mark All as Read**
   - Bulk action button
   - Clear all notifications

6. **Notification Sound**
   - Optional sound on new notification
   - Different sounds for different types

## Testing Checklist

- [ ] Bell icon displays correctly
- [ ] Badge shows correct unread count
- [ ] Dropdown opens/closes on click
- [ ] Notifications load on mount
- [ ] Real-time updates work
- [ ] Mark as read functionality
- [ ] Navigation on click works
- [ ] Time formatting is correct
- [ ] Emoji icons display properly
- [ ] Responsive on mobile
- [ ] Animations are smooth
- [ ] Top 5 limit enforced
