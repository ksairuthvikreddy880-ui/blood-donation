# Blood Exchange Feature

## Overview
The Blood Exchange feature enables intelligent hospital-to-hospital blood inventory management, helping optimize blood distribution across the healthcare network.

## Features

### 1. Hospital Inventory Dashboard
- Real-time view of blood inventory across multiple hospitals
- Displays:
  - Hospital name
  - Blood group
  - Current units available
  - Required units
  - Difference (surplus/shortage)
  - Status indicator

### 2. Status Indicators
- 🔴 **Shortage**: Current units < Required units (Red badge)
- 🟢 **Surplus**: Current units > Required units (Green badge)
- ⚪ **Balanced**: Current units = Required units (Gray badge)

### 3. Intelligent Matching Algorithm
The system automatically:
- Identifies hospitals with shortages and surpluses
- Matches hospitals with the same blood group
- Calculates optimal transfer amounts
- Suggests transfers to balance inventory

### 4. Suggested Transfers
- Visual display of recommended transfers
- Shows:
  - Blood group
  - Number of units to transfer
  - Source hospital (surplus)
  - Destination hospital (shortage)
- One-click "Initiate Transfer" button

### 5. User Interface
- Clean, responsive table layout
- Color-coded status indicators
- Animated transitions
- Mobile-friendly design
- Informational section explaining how the system works

## Navigation
- Available in the main navbar for authenticated users
- Route: `/blood-exchange`
- Visible alongside "Blood Centres" link

## Demo Data
Currently uses static demo data with 6 hospitals:
1. City General Hospital (O-, Shortage)
2. Metro Medical Center (O-, Surplus)
3. St. Mary's Hospital (A+, Shortage)
4. Central Care Hospital (A+, Surplus)
5. Regional Health Center (B+, Balanced)
6. Community Hospital (AB-, Shortage)

## Technical Implementation

### Components
- **BloodExchange.tsx**: Main page component
- Integrated with existing Navbar and Footer
- Uses shadcn/ui components (Card, Badge, Button)
- Framer Motion animations

### Logic
```typescript
// Status calculation
difference = current_units - required_units
if (difference < 0) → Shortage
if (difference > 0) → Surplus
if (difference === 0) → Balanced

// Transfer matching
For each blood group:
  - Find hospitals with shortage
  - Find hospitals with surplus
  - Calculate transfer amount = min(shortage_amount, surplus_amount)
  - Suggest transfer
```

## Future Enhancements
- Real-time database integration
- Transfer request workflow
- Approval system
- Transfer history tracking
- Notifications for hospitals
- Distance-based optimization
- Emergency priority transfers
- Integration with blood bank inventory
