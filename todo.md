# GiftVault TODO

## Theme & Branding
- [x] Configure dark-mode-first color palette (purple/pink/gold)
- [x] Update theme.config.js with GiftVault brand colors
- [x] Generate and set app logo/icon
- [x] Update app.config.ts with app name and branding

## Navigation & Structure
- [x] Set up 4-tab navigation (Vault, Surprises, Friends, Profile)
- [x] Add icon mappings for all tabs
- [x] Create root stack for modals and detail screens

## Data Layer
- [x] Define Gift data model and types
- [x] Define SurpriseGift data model and types
- [x] Define Friend/User data model and types
- [x] Create GiftStore with AsyncStorage persistence
- [x] Create SurpriseStore with AsyncStorage persistence
- [x] Create FriendsStore with AsyncStorage persistence

## Shared Components
- [x] GradientButton component
- [x] GiftCard component (grid card with image)
- [x] SurpriseCard component (locked/unlocked states)
- [x] TagChip component
- [x] EmptyState component
- [x] OccasionBadge component
- [x] Avatar component

## Gift Tracker Feature
- [x] Vault/Home screen with gift grid
- [x] Search bar with live filtering
- [x] Sort/filter controls (date, occasion, name)
- [x] Add Gift modal/screen
- [x] Photo picker integration (up to 5 photos)
- [x] Gift form: title, date, occasion, tags, notes
- [x] Gift Detail screen with hero image
- [ ] Edit gift functionality
- [x] Delete gift with confirmation

## Surprise Gift System
- [x] Surprises screen with incoming/sent sections
- [x] SurpriseCard with locked/available/unlocked states
- [x] Surprise Detail / Unlock screen
- [x] Puzzle/riddle display
- [x] Answer input and validation
- [x] Gift reveal animation (scale + confetti)
- [x] Blur-to-reveal transition
- [x] Countdown timer component
- [x] Send Surprise modal
- [x] Friend selector in send flow
- [x] Delivery date picker

## Friends System
- [x] Friends screen with friend list
- [x] Add friend by username search
- [x] Friend request UI (pending/accepted)
- [x] Share invite link functionality
- [ ] Friend profile mini-view

## Profile Screen
- [x] Profile screen with user stats
- [x] Avatar display
- [x] Edit display name inline
- [x] Settings: notifications toggle, version info
- [x] App info section
- [x] Firebase integration note card

## Animations & Polish
- [x] Gift reveal confetti animation (50 particles)
- [x] Blur unlock transition (animated intensity)
- [x] Press feedback (scale + haptics) on all interactive elements
- [x] Gradient backgrounds and overlays
- [x] Gradient accent on available surprises
- [x] FAB with purple-pink gradient
- [ ] Card entrance staggered animations
- [ ] Loading skeletons for gift grid

## Cloud Database Migration
- [x] Define gifts table in Drizzle schema
- [x] Define surprises table in Drizzle schema
- [x] Define friends table in Drizzle schema
- [x] Run db:push migration
- [x] Build gifts tRPC router (list, create, update, delete, getById)
- [x] Build surprises tRPC router (list, create, unlock, delete)
- [x] Build friends tRPC router (list, add, accept, remove)
- [x] Build photo upload tRPC mutation (S3 storage)
- [x] Replace gift-store.ts AsyncStorage with tRPC hooks
- [x] Replace surprise-store.ts AsyncStorage with tRPC hooks
- [x] Replace friends-store.ts AsyncStorage with tRPC hooks
- [x] Add login screen with Manus OAuth
- [x] Protect all screens behind auth check
- [x] Update Vault screen to use tRPC queries
- [x] Update Add Gift screen to use tRPC mutations
- [x] Update Gift Detail screen to use tRPC queries
- [x] Update Surprises screen to use tRPC queries
- [x] Update Send Surprise screen to use tRPC mutations
- [x] Update Friends screen to use tRPC queries
- [x] Update Profile screen to use auth user data
- [x] Write tRPC integration tests
