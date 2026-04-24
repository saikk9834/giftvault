# GiftVault — Mobile App Design Document

## Brand Identity

GiftVault is a **dark-mode-first**, luxurious personal gift tracker and social surprise-sharing app. The aesthetic draws from high-end product apps — think Apple Wallet meets Pinterest meets a premium jewelry box. Every interaction should feel intentional, smooth, and delightful.

---

## Color Palette

| Token | Dark Value | Light Value | Usage |
|-------|-----------|-------------|-------|
| `background` | `#0D0D0F` | `#F8F7FF` | Screen backgrounds |
| `surface` | `#1A1A2E` | `#FFFFFF` | Cards, modals, sheets |
| `surface2` | `#16213E` | `#F0EEF8` | Elevated surfaces |
| `primary` | `#C084FC` | `#9333EA` | Accent, CTAs (violet/purple) |
| `secondary` | `#F472B6` | `#EC4899` | Secondary accent (pink) |
| `gold` | `#F59E0B` | `#D97706` | Gift highlights, stars |
| `foreground` | `#F1F0FF` | `#1A1A2E` | Primary text |
| `muted` | `#8B8BA7` | `#6B7280` | Secondary text |
| `border` | `#2D2D4E` | `#E5E7EB` | Borders, dividers |
| `success` | `#4ADE80` | `#22C55E` | Unlock success |
| `error` | `#F87171` | `#EF4444` | Errors |

**Gradient Accents:**
- Hero gradient: `#C084FC → #F472B6` (purple to pink)
- Gold shimmer: `#F59E0B → #FCD34D → #F59E0B`
- Dark card: `#1A1A2E → #0D0D0F`

---

## Typography

- **Headings**: System font bold, large sizes (28–36px)
- **Body**: System font regular, 14–16px, line-height 1.5
- **Labels**: System font medium, 11–13px, letter-spacing 0.5
- **Accent numbers**: Tabular figures for dates/counts

---

## Screen List

### 1. Onboarding / Welcome Screen
- Full-screen gradient background with animated gift box icon
- App name "GiftVault" in large bold text with subtitle
- "Get Started" CTA button (gradient fill)
- Skip to main app option

### 2. Home / Vault Screen (Tab 1)
- Header: "My Vault" title + search icon + filter icon
- Stats row: total gifts, this year, occasions
- Gift grid (2-column masonry-style) with image cards
- Each card: photo thumbnail, title, date chip, occasion badge
- FAB (floating action button) to add new gift
- Empty state: animated gift box with "Start your vault" prompt

### 3. Add Gift Screen (Modal/Sheet)
- Full-screen modal with drag-to-dismiss
- Photo picker (up to 5 photos, horizontal scroll)
- Form fields: Title, Date, Occasion (picker), Tags (chip input), Notes
- Save button with gradient background
- Camera capture option

### 4. Gift Detail Screen
- Hero image with parallax scroll effect
- Back button overlay on image
- Gift metadata: title, date, occasion, tags
- Notes section
- Photo gallery strip (if multiple photos)
- Edit / Delete actions in header

### 5. Surprises Screen (Tab 2)
- Header: "Surprises" + compose icon
- Two sections: "Incoming" and "Sent"
- Each surprise card: sender avatar, countdown timer, locked/unlocked state
- Locked cards show blur overlay with lock icon
- Unlocked cards show gift preview thumbnail

### 6. Surprise Detail / Unlock Screen
- Full-screen immersive view
- Locked state: blurred gift preview + puzzle/riddle card
- Answer input field with submit button
- Countdown timer display
- Wrong answer: subtle shake animation + hint
- Correct answer: confetti explosion + gift reveal animation

### 7. Send Surprise Screen (Modal)
- Friend selector (avatar grid)
- Gift content composer: text + image
- Puzzle/riddle input with answer field
- Delivery date/time picker
- Preview before send

### 8. Friends Screen (Tab 3)
- Header: "Friends" + add friend icon
- Friend list with avatars, usernames, online indicators
- Pending requests section
- Add friend: search by username or share invite link
- Empty state with invite prompt

### 9. Profile Screen (Tab 4)
- User avatar (large, circular) + username + display name
- Stats: gifts logged, surprises sent/received
- Settings section: theme toggle, notifications, about
- Logout option

---

## Key User Flows

### Flow 1: Add a Gift
Home → FAB tap → Add Gift modal slides up → Fill form + pick photo → Save → Card appears in grid with entrance animation

### Flow 2: Send a Surprise
Surprises tab → Compose icon → Select friend → Add gift content + puzzle → Set delivery date → Send → Confirmation animation

### Flow 3: Unlock a Surprise
Push notification → Open app → Surprises tab → Tap locked card → View puzzle → Enter answer → Correct: confetti + reveal → Wrong: shake + retry

### Flow 4: Add a Friend
Friends tab → Add icon → Search username → Send request → Friend accepts → Appears in list

---

## Component Design

### GiftCard
- Rounded corners (16px)
- Image fills top 65% of card
- Bottom strip: title (bold), date (muted small)
- Occasion badge (colored chip, top-right overlay)
- Press: scale 0.97 + opacity 0.9

### SurpriseCard
- Full-width card with gradient border
- Locked: blurred image + lock icon + countdown
- Unlocked: clear image + "Tap to view" label
- Sender info: avatar + name on left

### GradientButton
- Full-width or auto-width
- Purple-to-pink gradient fill
- White text, bold
- Press: scale 0.97 + haptic light

### TagChip
- Small pill shape
- Muted background, primary text
- Removable (× icon)

---

## Animation Principles

- **Gift reveal**: scale from 0.3 → 1.0 with spring, opacity 0 → 1, confetti particles
- **Card entrance**: fade + translateY(20) → 0, staggered by index
- **Blur unlock**: intensity 80 → 0 over 600ms
- **Confetti**: 50 particles, random colors from palette, physics-based fall
- **Haptics**: Light on tap, Medium on toggle, Success on unlock
- **Transitions**: 250ms ease-out for most, 400ms spring for reveals

---

## Navigation Structure

```
Root Stack
├── (tabs)/
│   ├── index (Vault / Home)
│   ├── surprises (Surprises)
│   ├── friends (Friends)
│   └── profile (Profile)
├── gift/[id] (Gift Detail)
├── surprise/[id] (Surprise Detail/Unlock)
├── add-gift (Add Gift Modal)
└── send-surprise (Send Surprise Modal)
```
