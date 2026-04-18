# Emergency Priority System - Complete Implementation

## Overview
A medically-aware, intelligent system that prioritizes life-threatening blood requests over less urgent ones across all features: search, notifications, and display.

## Core Principle
**Critical cases ALWAYS appear first**, even if they are farther away than normal requests.

## Priority Levels

### 🔴 Critical (Priority Value: 3)
- **Life-threatening emergencies**
- **Notifies**: Top 10 donors
- **Display**: Red border, pulsing "HIGH PRIORITY" badge, #1-3 rank badges
- **Notification**: "🚨 CRITICAL: O+ Blood Needed! Life-threatening emergency!"
- **Always appears first** regardless of distance

### 🟡 Urgent (Priority Value: 2)
- **Time-sensitive requests**
- **Notifies**: Top 5 donors
- **Display**: Orange border, rank badges for top 3
- **Notification**: "⚡ URGENT: O+ Blood Request"
- **Appears after critical**, before normal

### 🟢 Normal (Priority Value: 1)
- **Standard requests**
- **Notifies**: Top 3 donors
- **Display**: Standard border
- **Notification**: "🩸 O+ Blood Request"
- **Appears last**, sorted by distance

## Database Schema

### Priority Value Column
```sql
ALTER TABLE requests 
ADD COLUMN priority_value INTEGER DEFAULT 1;
```

### Auto-calculation Trigger
```sql
CREATE FUNCTION set_priority_value()
RETURNS TRIGGER AS $$
BEGIN
  NEW.priority_value := CASE 
    WHEN NEW.urgency = 'critical' THEN 3
    WHEN NEW.urgency = 'urgent' THEN 2
    ELSE 1
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Indexes for Performance
```sql
-- Priority-based queries
CREATE INDEX idx_requests_priority_created 
ON requests(priority_value DESC, created_at DESC);

-- Location-based queries
CREATE INDEX idx_requests_location 
ON requests(latitude, longitude) 
WHERE status IN ('pending', 'accepted');
```

## Sorting Algorithm

### Priority-First Sorting
```typescript
.sort((a, b) => {
  // 1. Sort by priority (descending) - higher priority first
  const priorityDiff = (b.priority_value ?? 1) - (a.priority_value ?? 1);
  if (priorityDiff !== 0) return priorityDiff;
  
  // 2. Within same priority, sort by distance (ascending) - closer first
  if (a.distanceKm !== null && b.distanceKm !== null) {
    return a.distanceKm - b.distanceKm;
  }
  
  // 3. If no distance data, sort by created_at (newest first)
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});
```

### Example Sorting Result
```
Request List:
1. 🔴 Critical O+ - 5 km away    ← Appears FIRST
2. 🔴 Critical A+ - 8 km away
3. 🟡 Urgent O+ - 2 km away      ← Even though closer
4. 🟡 Urgent B+ - 3 km away
5. 🟢 Normal O+ - 1 km away      ← Even though closest
```

## Smart Notification System

### Donor Selection Logic
```typescript
// 1. Fetch all available donors with matching blood group
const allDonors = await fetchAvailableDonors(bloodGroup);

// 2. Calculate distance for each donor
const rankedDonors = allDonors
  .map(donor => ({
    ...donor,
    distanceKm: calculateDistance(requester, donor)
  }))
  .sort((a, b) => a.distanceKm - b.distanceKm);

// 3. Select top N based on urgency
const notifyCount = urgency === 'critical' ? 10 : urgency === 'urgent' ? 5 : 3;
const topDonors = rankedDonors.slice(0, notifyCount);

// 4. Send priority-based notifications
await notifyDonors(topDonors, urgency);
```

### Notification Messages

#### Critical
```
Title: "🚨 CRITICAL: O+ Blood Needed!"
Message: "Life-threatening emergency! O+ blood needed immediately in Mumbai. 
         You're one of 10 top-matched donors."
```

#### Urgent
```
Title: "⚡ URGENT: O+ Blood Request"
Message: "Urgent blood request! O+ needed in Mumbai. 
         You're one of 5 top-matched donors."
```

#### Normal
```
Title: "🩸 O+ Blood Request"
Message: "O+ blood needed in Mumbai. 
         You're one of 3 top-matched donors."
```

## UI Implementation

### Request Form (Enhanced Emergency Level Selector)

```tsx
<div className="grid grid-cols-3 gap-2">
  {/* Normal */}
  <button className="py-3 px-3 rounded-xl border-2">
    <div className="text-2xl">🟢</div>
    <div>Normal</div>
    <div className="text-xs">Top 3 notified</div>
  </button>
  
  {/* Urgent */}
  <button className="py-3 px-3 rounded-xl border-2">
    <div className="text-2xl">🟡</div>
    <div>Urgent</div>
    <div className="text-xs">Top 5 notified</div>
  </button>
  
  {/* Critical */}
  <button className="py-3 px-3 rounded-xl border-2 animate-pulse">
    <div className="text-2xl">🔴</div>
    <div>Critical</div>
    <div className="text-xs">Top 10 notified</div>
  </button>
</div>
```

### Request Card Display

#### Critical Request Card
```tsx
<div className="border-2 border-red-300 shadow-red-100 shadow-lg relative">
  {/* High Priority Badge */}
  <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
    🚨 HIGH PRIORITY
  </div>
  
  {/* Rank Badge */}
  <div className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 text-white rounded-full">
    #1
  </div>
  
  {/* Urgency Badge */}
  <span className="bg-red-100 text-red-700 border-red-200">
    🚨 CRITICAL
  </span>
</div>
```

#### Urgent Request Card
```tsx
<div className="border-2 border-orange-200">
  {/* Rank Badge (if top 3) */}
  <div className="absolute -top-2 -left-2 w-8 h-8 bg-orange-500 text-white rounded-full">
    #2
  </div>
  
  {/* Urgency Badge */}
  <span className="bg-orange-100 text-orange-700 border-orange-200">
    ⚡ URGENT
  </span>
</div>
```

#### Normal Request Card
```tsx
<div className="border-2 border-border">
  {/* Urgency Badge */}
  <span className="bg-green-100 text-green-700 border-green-200">
    🟢 NORMAL
  </span>
</div>
```

## Donor Experience Flow

### 1. Donor Opens "Donate Blood" Page
```
Loading requests...
↓
Fetching all pending/accepted requests
↓
Calculating distance for each
↓
Sorting by priority first, then distance
↓
Display sorted list
```

### 2. Donor Sees Prioritized List
```
┌─────────────────────────────────────┐
│  🚨 HIGH PRIORITY    #1             │
│  ┌───────────────────────────────┐  │
│  │ 🔴 CRITICAL  O+               │  │
│  │ City Hospital - 5 km away     │  │
│  │ 2 units needed                │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  #2                                 │
│  ┌───────────────────────────────┐  │
│  │ 🟡 URGENT  A+                 │  │
│  │ Metro Hospital - 2 km away    │  │
│  │ 1 unit needed                 │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │ 🟢 NORMAL  B+                 │  │
│  │ Local Clinic - 1 km away      │  │
│  │ 1 unit needed                 │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3. Donor Receives Notification
- **Critical**: Immediate notification with high priority sound
- **Urgent**: Standard notification
- **Normal**: Standard notification

### 4. Donor Makes Decision
- Sees priority level clearly
- Understands urgency
- Can prioritize critical cases
- Makes informed decision

## Medical Benefits

### 1. Faster Response for Critical Cases
- Critical requests always visible first
- More donors notified (10 vs 3)
- Reduces decision time
- Increases survival chances

### 2. Efficient Resource Allocation
- Right number of donors for each urgency
- Prevents notification fatigue
- Focuses attention on critical cases

### 3. Better Donor Decision-Making
- Clear visual indicators
- Priority information upfront
- Distance context within priority
- Informed choices

### 4. Reduced Response Delay
- Critical cases get immediate attention
- No need to scroll through normal requests
- Priority badges catch attention
- Pulsing animation for critical

## Performance Optimizations

### 1. Database Indexes
```sql
-- Fast priority queries
CREATE INDEX idx_requests_priority_created 
ON requests(priority_value DESC, created_at DESC);

-- Fast location queries
CREATE INDEX idx_requests_location 
ON requests(latitude, longitude);
```

### 2. Efficient Sorting
- Priority comparison first (O(1))
- Distance comparison only within same priority
- Cached distance calculations

### 3. Smart Notification Batching
- Fetch all donors once
- Calculate distances in memory
- Select top N efficiently
- Batch notification creation

## Testing Scenarios

### Scenario 1: Mixed Priority Requests
```
Input:
- Critical O+ at 10 km
- Urgent O+ at 3 km
- Normal O+ at 1 km

Expected Output:
1. Critical O+ (10 km) ← First
2. Urgent O+ (3 km)
3. Normal O+ (1 km)
```

### Scenario 2: Same Priority, Different Distances
```
Input:
- Critical O+ at 10 km
- Critical A+ at 5 km
- Critical B+ at 2 km

Expected Output:
1. Critical B+ (2 km) ← Closest critical
2. Critical A+ (5 km)
3. Critical O+ (10 km)
```

### Scenario 3: Notification Counts
```
Critical Request:
- Notifies: Top 10 donors
- Creates: 10 matches
- Sends: 10 notifications

Urgent Request:
- Notifies: Top 5 donors
- Creates: 5 matches
- Sends: 5 notifications

Normal Request:
- Notifies: Top 3 donors
- Creates: 3 matches
- Sends: 3 notifications
```

## Future Enhancements

1. **Dynamic Priority Adjustment**
   - Auto-escalate to critical after X hours
   - Time-based urgency increase

2. **Priority-Based ETA**
   - Faster ETA calculations for critical
   - Priority routing suggestions

3. **Emergency Alerts**
   - SMS for critical cases
   - Push notifications with priority

4. **Analytics Dashboard**
   - Response time by priority
   - Success rate by urgency
   - Donor response patterns

5. **Machine Learning**
   - Predict optimal notify count
   - Learn from historical data
   - Adjust priorities automatically

## Success Metrics

- **Response Time**: Critical < 5 min, Urgent < 15 min, Normal < 30 min
- **Fulfillment Rate**: Critical > 95%, Urgent > 85%, Normal > 70%
- **Donor Engagement**: Higher acceptance for critical cases
- **System Efficiency**: Reduced notification spam, better targeting

## Conclusion

This emergency priority system ensures that life-threatening blood requests receive immediate attention, improving patient outcomes and optimizing donor resources. The system is medically-aware, user-friendly, and efficient.
