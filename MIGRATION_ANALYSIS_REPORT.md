# BacheLORE: Firebase/MongoDB to MSSQL Migration Analysis Report

**Project**: BacheLORE - Bachelor Life Management Platform  
**Current Database**: MongoDB (via Mongoose)  
**Target Database**: Microsoft SQL Server (MSSQL)  
**Prepared On**: March 27, 2026  
**Prepared For**: VS Code with Copilot & SQL Server Management Studio 22

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Current Technology Stack](#current-technology-stack)
4. [Database Analysis](#database-analysis)
5. [Architecture Summary](#architecture-summary)
6. [MSSQL Schema Design](#mssql-schema-design)
7. [Migration Implementation Plan](#migration-implementation-plan)
8. [Code Changes Required](#code-changes-required)
9. [Risk Analysis & Mitigations](#risk-analysis--mitigations)
10. [Post-Migration Verification](#post-migration-verification)

---

## Executive Summary

**BacheLORE** is a comprehensive Student Life Management Platform built with a **Node.js Express backend** and **React frontend**, currently using **MongoDB** as the database. The migration to **MSSQL** will require:

- **~15 database tables** to be created with proper relationships and constraints
- **Backend driver change**: Mongoose → **mssql** or **Sequelize** ORM
- **~40-50 API endpoints** to be updated for new database calls
- **Frontend**: Minimal changes (API calls remain the same)
- **Estimated migration time**: 3-5 weeks for development, testing, and deployment
- **Complexity**: Moderate (straightforward relational mapping, no complex aggregations)

---

## Project Overview

### Project Description
BacheLORE is a student-centric platform providing multiple interconnected services:

### Core Features & Modules

| Module | Purpose | Primary Entities |
|--------|---------|-----------------|
| **Authentication** | User signup/login with JWT tokens | User, Admin sessions |
| **Tuition Management** | Post, apply, and book tuition services | Tuition, AppliedTuition, BookedTuition |
| **Maid Services** | Book domestic help/cleaning services | Maid, AppliedMaid, BookedMaid |
| **Roommate Finder** | Connect students looking for roommates | RoommateListing, AppliedRoommate, BookedRoommate, AppliedToHost |
| **House Rental** | List and browse property rentals | HouseRentListing, AppliedToHost |
| **Marketplace** | Student-to-student buying/selling platform | MarketplaceListing |
| **Subscription** | Payment processing & subscription management | SubscriptionPayment |
| **Announcements** | Admin-issued platform announcements | Announcement |
| **Activity Feed** | User activity tracking | Contact (messaging) |

### User Roles
- **Regular Student**: Can browse services, apply for listings, post offerings
- **Host Roommate**: Student offering room space (subset of Regular Student with flag)
- **Admin**: Platform management, content moderation, special operations (via ADMIN_CODE)

### Status Assessment
- ✅ **Core Features**: Fully implemented
- ⚠️ **Known Issues**: Admin login validation, some optional fields in models
- ⚠️ **Incomplete Features**: 
  - Bill splitting feature (Bills.jsx exists but minimal backend)
  - Some API endpoints may lack proper error handling
  - No audit logging system

---

## Current Technology Stack

### Backend
| Layer | Technology | Version | Details |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | N/A | Express server |
| **Framework** | Express | 5.1.0 | REST API framework |
| **Database Client** | Mongoose | 8.18.1 | MongoDB ODM |
| **Authentication** | JWT + bcryptjs | 9.0.2 / 2.4.3 | Token-based auth |
| **HTTP Client** | Axios | 1.11.0 | Internal API calls |
| **Middleware** | CORS | 2.8.5 | Cross-origin support |
| **Env Management** | dotenv | 17.2.3 | Configuration loading |
| **Dev Tools** | nodemon | 3.1.11 | Auto-reload development |

### Frontend
| Layer | Technology | Version | Details |
|-------|-----------|---------|---------|
| **Framework** | React | 19.1.0 | Component-based UI |
| **Build Tool** | Vite | 7.0.4 | Fast build system |
| **Routing** | React Router | 7.7.1 | Client-side navigation |
| **HTTP Client** | Axios | 1.11.0 | API requests |
| **Styling** | Bootstrap | 5.3.7 | CSS framework |
| **Icons** | Bootstrap Icons | 1.13.1 | Icon library |

### Deployment
- **Backend**: Railway (currently deployed at `https://backenddd.up.railway.app`)
- **Frontend**: Vercel (configuration present in `vercel.json`)

---

## Database Analysis

### Current MongoDB Schema & Collections

#### 1. **Users Collection**
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (bcrypt hashed),
  phone: String,
  university: String,
  year: String,
  semester: String,
  eduEmail: String,
  roommateCategory: Enum ['HostRoommate', 'SeekerRoommate'],
  isAvailableAsHost: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Tuitions Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  subject: String,
  days: String,
  salary: String,
  location: String,
  description: String,
  contact: String,
  postedBy: String,
  createdAt: Date
}
```

#### 3. **AppliedTuitions Collection**
```javascript
{
  _id: ObjectId,
  tuitionId: ObjectId (ref: Tuition),
  name: String,
  email: String,
  contact: String,
  message: String,
  createdAt: Date
}
```

#### 4. **BookedTuitions Collection**
```javascript
{
  _id: ObjectId,
  tuitionRef: ObjectId (ref: Tuition),
  title: String,
  subject: String,
  days: String,
  salary: String,
  location: String,
  description: String,
  contact: String,
  applicantName: String,
  applicantEmail: String,
  applicantContact: String,
  message: String,
  bookedAt: Date
}
```

#### 5. **Maids Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  hourlyRate: String,
  location: String,
  description: String,
  contact: String,
  createdAt: Date
}
```

#### 6. **AppliedMaids Collection**
```javascript
{
  _id: ObjectId,
  maidId: ObjectId (ref: Maid),
  name: String,
  email: String,
  contact: String,
  message: String,
  createdAt: Date
}
```

#### 7. **BookedMaids Collection**
```javascript
{
  _id: ObjectId,
  maidRef: ObjectId (ref: Maid),
  name: String,
  hourlyRate: String,
  location: String,
  contact: String,
  applicantName: String,
  applicantEmail: String,
  applicantContact: String,
  message: String,
  busyUntil: Date (optional, deprecated),
  bookedAt: Date
}
```

#### 8. **RoommateListings Collection**
```javascript
{
  _id: ObjectId,
  userRef: ObjectId (ref: User),
  name: String,
  email: String,
  contact: String,
  location: String,
  roomsAvailable: String,
  details: String,
  createdAt: Date
}
```

#### 9. **AppliedRoommates Collection**
```javascript
{
  _id: ObjectId,
  userRef: ObjectId (ref: User),
  name: String,
  email: String,
  contact: String,
  location: String,
  roomsAvailable: String,
  message: String,
  createdAt: Date
}
```

#### 10. **BookedRoommates Collection**
```javascript
{
  _id: ObjectId,
  listingRef: ObjectId (ref: RoommateListing),
  hostRef: ObjectId (ref: User),
  hostName: String,
  hostEmail: String,
  hostContact: String,
  location: String,
  roomsAvailable: String,
  details: String,
  applicantRef: ObjectId (ref: User),
  applicantName: String,
  applicantEmail: String,
  applicantContact: String,
  message: String,
  bookedAt: Date
}
```

#### 11. **HouseRentListings Collection**
```javascript
{
  _id: ObjectId,
  ownerRef: ObjectId (ref: User),
  title: String,
  description: String,
  location: String,
  price: Number,
  rooms: Number,
  images: [String],
  contact: String,
  verified: Boolean,
  createdAt: Date
}
```

#### 12. **MarketplaceListings Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  price: Number,
  image: String,
  contact: String,
  sellerEmail: String,
  buyerEmail: String,
  status: Enum ['available', 'sold'],
  createdAt: Date
}
```

#### 13. **Announcements Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  message: String,
  author: String,
  createdAt: Date
}
```

#### 14. **SubscriptionPayments Collection**
```javascript
{
  _id: ObjectId,
  userEmail: String,
  amount: Number,
  paymentMethod: String,
  transactionId: String,
  status: Enum ['pending', 'completed', 'failed'],
  paidAt: Date,
  details: Object
}
```

#### 15. **Contacts Collection** (Messaging)
```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  message: String,
  createdAt: Date
}
```

#### 16. **AppliedToHost Collection**
```javascript
{
  _id: ObjectId,
  listingRef: ObjectId (ref: RoommateListing),
  applicantRef: ObjectId (ref: User),
  name: String,
  email: String,
  message: String,
  createdAt: Date
}
```

### Key Observations

| Aspect | Notes |
|--------|-------|
| **Total Collections** | 16 collections mapped to tables |
| **ObjectId Usage** | All use MongoDB ObjectId; will convert to UNIQUEIDENTIFIER (GUID) in MSSQL |
| **Relationships** | Foreign key references via ObjectId; mostly one-to-many |
| **Data Types** | Strings used for numeric fields (salary, hourlyRate) - **NEEDS REVIEW** |
| **Timestamps** | Using Mongoose `timestamps: true` for createdAt/updatedAt |
| **Enums** | Limited use (roommateCategory, status fields) |
| **Indexes** | `unique` indexes on email fields; others auto-generated |
| **Constraints** | Minimal constraints; relying on application logic |

---

## Architecture Summary

### Backend Architecture

#### API Endpoint Structure
```
/api
├── /signup              → User registration
├── /login               → Authentication
├── /admin               → Admin operations
├── /announcements       → News & updates
├── /tuitions            → Tuition listings
├── /applied-tuitions    → Applications for tuitions
├── /booked-tuitions     → Confirmed tuition bookings
├── /maids               → Maid service listings
├── /applied-maids       → Maid service applications
├── /booked-maids        → Confirmed maid bookings
├── /roommates           → Roommate listings
├── /house-rent          → Property rentals
├── /activity            → User activity/messaging
├── /subscription        → Payment processing
└── /marketplace         → Buy/sell marketplace
```

#### Authentication Flow

```
User Registration
└─ POST /api/signup → signupController.signup()
   ├─ Validate email format & educational domain
   ├─ Validate strong password
   ├─ Hash password with bcryptjs (10 rounds)
   └─ Save to User collection

User Login
└─ POST /api/login → loginController.login()
   ├─ Fetch user by email
   ├─ Compare hashed password
   ├─ Support legacy plaintext password migration
   └─ Return user data (no JWT token returned immediately)

Admin Authentication
└─ POST /api/admin (adminLogin) → adminController.adminLogin()
   ├─ Accept ADMIN_CODE from request
   ├─ Validate against process.env.ADMIN_CODE
   ├─ Generate JWT token with role: 'admin'
   └─ Token valid for 2 hours
```

**Current Limitation**: User login does NOT return JWT. Frontend relies on localStorage for auth state.

#### Database Call Patterns

**Pattern 1: Simple CRUD**
```javascript
// GET all records
const records = await Model.find().sort({ createdAt: -1 });

// CREATE
const newRecord = new Model({ ...data });
await newRecord.save();

// UPDATE (not commonly used)
await Model.findByIdAndUpdate(id, update);
```

**Pattern 2: Foreign Key References**
```javascript
// Find with population
const booking = await BookedTuition.findById(id)
  .populate('tuitionRef');
```

**Pattern 3: Array Fields**
```javascript
// HouseRentListing with array of images
images: [{ type: String }]
```

#### Authorization Pattern
```javascript
// Check admin via JWT or ADMIN_CODE
const authHeader = req.headers.authorization || '';
if (authHeader.startsWith('Bearer ')) {
  const token = authHeader.slice(7);
  const payload = jwt.verify(token, JWT_SECRET);
  if (payload && payload.role === 'admin') isAdmin = true;
}
const adminCode = req.body.adminCode || req.query.adminCode;
if (!isAdmin && adminCode !== ADMIN_CODE) {
  return res.status(403).json({ msg: 'Forbidden: Admins only' });
}
```

### Frontend Architecture

#### Component Structure
```
src/
├── pages/                  (15 page components)
│   ├── Home.jsx           (Landing page)
│   ├── PublicHome.jsx     (Public home)
│   ├── Login.jsx          (User login)
│   ├── AdminLogin.jsx     (Admin login)
│   ├── Signup.jsx         (User registration)
│   ├── Tuition.jsx        (Tuition listings)
│   ├── Maids.jsx          (Maid services)
│   ├── Roommates.jsx      (Roommate search)
│   ├── RoommateListings.jsx
│   ├── HouseRent.jsx      (Property rentals)
│   ├── Marketplace.jsx    (Buy/sell items)
│   ├── Announcements.jsx  (View announcements)
│   ├── Subscribe.jsx      (Subscription page)
│   ├── Bills.jsx          (Bill splitting - partial)
│   └── AdminDashboard.jsx (Admin panel)
└── components/            (Reusable components)
    ├── Navbar.jsx         (Navigation)
    ├── Footer.jsx         (Footer)
    ├── Login.jsx          (Reusable login)
    ├── Signup.jsx         (Reusable signup)
    ├── Card*.jsx          (Various card components)
    ├── *Modal.jsx         (Detail modals)
    └── *Form.jsx          (Form components)
```

#### API Communication
- **Base URL**: `https://backenddd.up.railway.app/api` (hardcoded)
- **HTTP Client**: Axios
- **Auth**: localStorage tokens (not currently returned from login)
- **CORS**: Enabled on backend

#### State Management
- **Auth State**: localStorage (`bachelore_auth`, `bachelore_user`)
- **Event Listeners**: Custom window events for auth changes
- **Component State**: React hooks (useState)

---

## MSSQL Schema Design

### Rationale for Schema Conversion

| MongoDB Concept | MSSQL Equivalent | Notes |
|-----------------|------------------|-------|
| ObjectId | UNIQUEIDENTIFIER (NEWID()) | GUIDs for unique identification |
| String fields | VARCHAR(MAX) or VARCHAR(n) | Use appropriate max length |
| Number | INT, BIGINT, or DECIMAL | Based on expected range |
| Date | DATETIME2 | High precision timestamps |
| Enum | VARCHAR + CHECK constraint | Ensure valid values |
| Array (images) | Separate junction table | Normalize for MSSQL |
| JSON Object | VARCHAR(MAX) | Store as JSON text if needed |
| Unique constraint | UNIQUE constraint | Ensure data uniqueness |
| Index | INDEX | Query optimization |

### Complete MSSQL Schema

```sql
-- ============================================================================
-- MSSQL Schema for BacheLORE
-- ============================================================================

-- Enable identity for auto-increment
SET IDENTITY_INSERT [dbo].[Users] ON;

-- ============================================================================
-- 1. USERS Table
-- ============================================================================
CREATE TABLE [dbo].[Users] (
    [UserId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [FullName] VARCHAR(255),
    [Email] VARCHAR(255) NOT NULL UNIQUE,
    [Password] VARCHAR(255) NOT NULL,
    [Phone] VARCHAR(20) NOT NULL,
    [University] VARCHAR(255) NOT NULL,
    [Year] VARCHAR(50) NOT NULL,
    [Semester] VARCHAR(50) NOT NULL,
    [EduEmail] VARCHAR(255) NOT NULL,
    [RoommateCategory] VARCHAR(50) DEFAULT 'SeekerRoommate',
    [IsAvailableAsHost] BIT DEFAULT 0,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT CK_RoommateCategory CHECK ([RoommateCategory] IN ('HostRoommate', 'SeekerRoommate'))
);

CREATE INDEX [IX_Users_Email] ON [dbo].[Users]([Email]);

-- ============================================================================
-- 2. TUITIONS Table
-- ============================================================================
CREATE TABLE [dbo].[Tuitions] (
    [TuitionId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Title] VARCHAR(255) NOT NULL,
    [Subject] VARCHAR(255) NOT NULL,
    [Days] VARCHAR(255) NOT NULL,
    [Salary] VARCHAR(100) NOT NULL,  -- Could be DECIMAL; keeping STRING for compatibility
    [Location] VARCHAR(255) NOT NULL,
    [Description] VARCHAR(MAX) NOT NULL,
    [Contact] VARCHAR(20) NOT NULL,
    [PostedBy] VARCHAR(255),  -- Admin email
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT CK_Tuition_Contact CHECK ([Contact] LIKE '01[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);

CREATE INDEX [IX_Tuitions_CreatedAt] ON [dbo].[Tuitions]([CreatedAt] DESC);

-- ============================================================================
-- 3. APPLIED_TUITIONS Table
-- ============================================================================
CREATE TABLE [dbo].[AppliedTuitions] (
    [AppliedTuitionId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [TuitionId] UNIQUEIDENTIFIER NOT NULL,
    [Name] VARCHAR(255) NOT NULL,
    [Email] VARCHAR(255) NOT NULL,
    [Contact] VARCHAR(20) NOT NULL,
    [Message] VARCHAR(MAX),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AppliedTuitions_Tuition FOREIGN KEY ([TuitionId]) 
        REFERENCES [dbo].[Tuitions]([TuitionId]) ON DELETE CASCADE
);

CREATE INDEX [IX_AppliedTuitions_TuitionId] ON [dbo].[AppliedTuitions]([TuitionId]);
CREATE INDEX [IX_AppliedTuitions_CreatedAt] ON [dbo].[AppliedTuitions]([CreatedAt] DESC);

-- ============================================================================
-- 4. BOOKED_TUITIONS Table
-- ============================================================================
CREATE TABLE [dbo].[BookedTuitions] (
    [BookedTuitionId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [TuitionRef] UNIQUEIDENTIFIER NOT NULL,
    [Title] VARCHAR(255) NOT NULL,
    [Subject] VARCHAR(255) NOT NULL,
    [Days] VARCHAR(255) NOT NULL,
    [Salary] VARCHAR(100) NOT NULL,
    [Location] VARCHAR(255) NOT NULL,
    [Description] VARCHAR(MAX) NOT NULL,
    [Contact] VARCHAR(20) NOT NULL,
    [ApplicantName] VARCHAR(255) NOT NULL,
    [ApplicantEmail] VARCHAR(255) NOT NULL,
    [ApplicantContact] VARCHAR(20) NOT NULL,
    [Message] VARCHAR(MAX),
    [BookedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_BookedTuitions_Tuition FOREIGN KEY ([TuitionRef]) 
        REFERENCES [dbo].[Tuitions]([TuitionId]) ON DELETE CASCADE
);

CREATE INDEX [IX_BookedTuitions_TuitionRef] ON [dbo].[BookedTuitions]([TuitionRef]);
CREATE INDEX [IX_BookedTuitions_ApplicantEmail] ON [dbo].[BookedTuitions]([ApplicantEmail]);

-- ============================================================================
-- 5. MAIDS Table
-- ============================================================================
CREATE TABLE [dbo].[Maids] (
    [MaidId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] VARCHAR(255) NOT NULL,
    [HourlyRate] VARCHAR(100) NOT NULL,
    [Location] VARCHAR(255),
    [Description] VARCHAR(MAX),
    [Contact] VARCHAR(20),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX [IX_Maids_CreatedAt] ON [dbo].[Maids]([CreatedAt] DESC);

-- ============================================================================
-- 6. APPLIED_MAIDS Table
-- ============================================================================
CREATE TABLE [dbo].[AppliedMaids] (
    [AppliedMaidId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [MaidId] UNIQUEIDENTIFIER NOT NULL,
    [Name] VARCHAR(255) NOT NULL,
    [Email] VARCHAR(255) NOT NULL,
    [Contact] VARCHAR(20) NOT NULL,
    [Message] VARCHAR(MAX),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AppliedMaids_Maid FOREIGN KEY ([MaidId]) 
        REFERENCES [dbo].[Maids]([MaidId]) ON DELETE CASCADE
);

CREATE INDEX [IX_AppliedMaids_MaidId] ON [dbo].[AppliedMaids]([MaidId]);
CREATE INDEX [IX_AppliedMaids_CreatedAt] ON [dbo].[AppliedMaids]([CreatedAt] DESC);

-- ============================================================================
-- 7. BOOKED_MAIDS Table
-- ============================================================================
CREATE TABLE [dbo].[BookedMaids] (
    [BookedMaidId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [MaidRef] UNIQUEIDENTIFIER NOT NULL,
    [Name] VARCHAR(255) NOT NULL,
    [HourlyRate] VARCHAR(100) NOT NULL,
    [Location] VARCHAR(255),
    [Contact] VARCHAR(20),
    [ApplicantName] VARCHAR(255) NOT NULL,
    [ApplicantEmail] VARCHAR(255) NOT NULL,
    [ApplicantContact] VARCHAR(20) NOT NULL,
    [Message] VARCHAR(MAX),
    [BusyUntil] DATETIME2,  -- Deprecated/optional
    [BookedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_BookedMaids_Maid FOREIGN KEY ([MaidRef]) 
        REFERENCES [dbo].[Maids]([MaidId]) ON DELETE CASCADE
);

CREATE INDEX [IX_BookedMaids_MaidRef] ON [dbo].[BookedMaids]([MaidRef]);
CREATE INDEX [IX_BookedMaids_ApplicantEmail] ON [dbo].[BookedMaids]([ApplicantEmail]);

-- ============================================================================
-- 8. ROOMMATE_LISTINGS Table
-- ============================================================================
CREATE TABLE [dbo].[RoommateListings] (
    [RoommateListingId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserRef] UNIQUEIDENTIFIER,
    [Name] VARCHAR(255) NOT NULL,
    [Email] VARCHAR(255),
    [Contact] VARCHAR(20),
    [Location] VARCHAR(255),
    [RoomsAvailable] VARCHAR(100),
    [Details] VARCHAR(MAX),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_RoommateListings_User FOREIGN KEY ([UserRef]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE SET NULL
);

CREATE INDEX [IX_RoommateListings_UserRef] ON [dbo].[RoommateListings]([UserRef]);
CREATE INDEX [IX_RoommateListings_CreatedAt] ON [dbo].[RoommateListings]([CreatedAt] DESC);

-- ============================================================================
-- 9. APPLIED_ROOMMATES Table
-- ============================================================================
CREATE TABLE [dbo].[AppliedRoommates] (
    [AppliedRoommateId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserRef] UNIQUEIDENTIFIER,
    [Name] VARCHAR(255),
    [Email] VARCHAR(255),
    [Contact] VARCHAR(20),
    [Location] VARCHAR(255),
    [RoomsAvailable] VARCHAR(100),
    [Message] VARCHAR(MAX),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AppliedRoommates_User FOREIGN KEY ([UserRef]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE SET NULL
);

CREATE INDEX [IX_AppliedRoommates_UserRef] ON [dbo].[AppliedRoommates]([UserRef]);
CREATE INDEX [IX_AppliedRoommates_CreatedAt] ON [dbo].[AppliedRoommates]([CreatedAt] DESC);

-- ============================================================================
-- 10. BOOKED_ROOMMATES Table
-- ============================================================================
CREATE TABLE [dbo].[BookedRoommates] (
    [BookedRoommateId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ListingRef] UNIQUEIDENTIFIER NOT NULL,
    [HostRef] UNIQUEIDENTIFIER,
    [HostName] VARCHAR(255),
    [HostEmail] VARCHAR(255),
    [HostContact] VARCHAR(20),
    [Location] VARCHAR(255),
    [RoomsAvailable] VARCHAR(100),
    [Details] VARCHAR(MAX),
    [ApplicantRef] UNIQUEIDENTIFIER,
    [ApplicantName] VARCHAR(255) NOT NULL,
    [ApplicantEmail] VARCHAR(255) NOT NULL,
    [ApplicantContact] VARCHAR(20),
    [Message] VARCHAR(MAX),
    [BookedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_BookedRoommates_Listing FOREIGN KEY ([ListingRef]) 
        REFERENCES [dbo].[RoommateListings]([RoommateListingId]) ON DELETE CASCADE,
    CONSTRAINT FK_BookedRoommates_Host FOREIGN KEY ([HostRef]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE SET NULL,
    CONSTRAINT FK_BookedRoommates_Applicant FOREIGN KEY ([ApplicantRef]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE SET NULL
);

CREATE INDEX [IX_BookedRoommates_ListingRef] ON [dbo].[BookedRoommates]([ListingRef]);
CREATE INDEX [IX_BookedRoommates_HostRef] ON [dbo].[BookedRoommates]([HostRef]);
CREATE INDEX [IX_BookedRoommates_ApplicantRef] ON [dbo].[BookedRoommates]([ApplicantRef]);

-- ============================================================================
-- 11. HOUSE_RENT_LISTINGS Table
-- ============================================================================
CREATE TABLE [dbo].[HouseRentListings] (
    [HouseRentListingId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [OwnerRef] UNIQUEIDENTIFIER,
    [Title] VARCHAR(255) NOT NULL,
    [Description] VARCHAR(MAX),
    [Location] VARCHAR(255),
    [Price] INT,
    [Rooms] INT,
    [Contact] VARCHAR(20),
    [Verified] BIT DEFAULT 0,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_HouseRentListings_Owner FOREIGN KEY ([OwnerRef]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE SET NULL
);

CREATE INDEX [IX_HouseRentListings_OwnerRef] ON [dbo].[HouseRentListings]([OwnerRef]);
CREATE INDEX [IX_HouseRentListings_CreatedAt] ON [dbo].[HouseRentListings]([CreatedAt] DESC);
CREATE INDEX [IX_HouseRentListings_Verified] ON [dbo].[HouseRentListings]([Verified]);

-- ============================================================================
-- 12. HOUSE_RENT_IMAGES Table (Normalized from array)
-- ============================================================================
CREATE TABLE [dbo].[HouseRentImages] (
    [HouseRentImageId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [HouseRentListingId] UNIQUEIDENTIFIER NOT NULL,
    [ImageUrl] VARCHAR(MAX) NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_HouseRentImages_Listing FOREIGN KEY ([HouseRentListingId]) 
        REFERENCES [dbo].[HouseRentListings]([HouseRentListingId]) ON DELETE CASCADE
);

CREATE INDEX [IX_HouseRentImages_HouseRentListingId] ON [dbo].[HouseRentImages]([HouseRentListingId]);

-- ============================================================================
-- 13. MARKETPLACE_LISTINGS Table
-- ============================================================================
CREATE TABLE [dbo].[MarketplaceListings] (
    [MarketplaceListingId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Title] VARCHAR(255) NOT NULL,
    [Description] VARCHAR(MAX) NOT NULL,
    [Price] DECIMAL(10, 2) NOT NULL,
    [Image] VARCHAR(MAX),
    [Contact] VARCHAR(20) NOT NULL,
    [SellerEmail] VARCHAR(255) NOT NULL,
    [BuyerEmail] VARCHAR(255),
    [Status] VARCHAR(50) DEFAULT 'available',
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT CK_MarketplaceStatus CHECK ([Status] IN ('available', 'sold'))
);

CREATE INDEX [IX_MarketplaceListings_SellerEmail] ON [dbo].[MarketplaceListings]([SellerEmail]);
CREATE INDEX [IX_MarketplaceListings_Status] ON [dbo].[MarketplaceListings]([Status]);
CREATE INDEX [IX_MarketplaceListings_CreatedAt] ON [dbo].[MarketplaceListings]([CreatedAt] DESC);

-- ============================================================================
-- 14. ANNOUNCEMENTS Table
-- ============================================================================
CREATE TABLE [dbo].[Announcements] (
    [AnnouncementId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Title] VARCHAR(255) NOT NULL,
    [Message] VARCHAR(MAX) NOT NULL,
    [Author] VARCHAR(255),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX [IX_Announcements_CreatedAt] ON [dbo].[Announcements]([CreatedAt] DESC);

-- ============================================================================
-- 15. SUBSCRIPTION_PAYMENTS Table
-- ============================================================================
CREATE TABLE [dbo].[SubscriptionPayments] (
    [SubscriptionPaymentId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserEmail] VARCHAR(255) NOT NULL,
    [Amount] DECIMAL(10, 2) NOT NULL,
    [PaymentMethod] VARCHAR(100) NOT NULL,
    [TransactionId] VARCHAR(255),
    [Status] VARCHAR(50) DEFAULT 'pending',
    [PaidAt] DATETIME2 DEFAULT GETUTCDATE(),
    [Details] VARCHAR(MAX),  -- JSON stored as text
    CONSTRAINT CK_PaymentStatus CHECK ([Status] IN ('pending', 'completed', 'failed'))
);

CREATE INDEX [IX_SubscriptionPayments_UserEmail] ON [dbo].[SubscriptionPayments]([UserEmail]);
CREATE INDEX [IX_SubscriptionPayments_Status] ON [dbo].[SubscriptionPayments]([Status]);
CREATE INDEX [IX_SubscriptionPayments_PaidAt] ON [dbo].[SubscriptionPayments]([PaidAt] DESC);

-- ============================================================================
-- 16. CONTACTS Table (Messaging)
-- ============================================================================
CREATE TABLE [dbo].[Contacts] (
    [ContactId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [SenderId] UNIQUEIDENTIFIER NOT NULL,
    [ReceiverId] UNIQUEIDENTIFIER NOT NULL,
    [Message] VARCHAR(MAX) NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Contacts_Sender FOREIGN KEY ([SenderId]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE CASCADE,
    CONSTRAINT FK_Contacts_Receiver FOREIGN KEY ([ReceiverId]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE CASCADE
);

CREATE INDEX [IX_Contacts_SenderId] ON [dbo].[Contacts]([SenderId]);
CREATE INDEX [IX_Contacts_ReceiverId] ON [dbo].[Contacts]([ReceiverId]);
CREATE INDEX [IX_Contacts_CreatedAt] ON [dbo].[Contacts]([CreatedAt] DESC);

-- ============================================================================
-- 17. APPLIED_TO_HOST Table
-- ============================================================================
CREATE TABLE [dbo].[AppliedToHost] (
    [AppliedToHostId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ListingRef] UNIQUEIDENTIFIER NOT NULL,
    [ApplicantRef] UNIQUEIDENTIFIER,
    [Name] VARCHAR(255),
    [Email] VARCHAR(255),
    [Message] VARCHAR(MAX),
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_AppliedToHost_Listing FOREIGN KEY ([ListingRef]) 
        REFERENCES [dbo].[RoommateListings]([RoommateListingId]) ON DELETE CASCADE,
    CONSTRAINT FK_AppliedToHost_Applicant FOREIGN KEY ([ApplicantRef]) 
        REFERENCES [dbo].[Users]([UserId]) ON DELETE SET NULL
);

CREATE INDEX [IX_AppliedToHost_ListingRef] ON [dbo].[AppliedToHost]([ListingRef]);
CREATE INDEX [IX_AppliedToHost_ApplicantRef] ON [dbo].[AppliedToHost]([ApplicantRef]);
CREATE INDEX [IX_AppliedToHost_CreatedAt] ON [dbo].[AppliedToHost]([CreatedAt] DESC);
```

### Key Schema Notes

| Consideration | Implementation |
|---------------|-----------------|
| **Primary Keys** | UNIQUEIDENTIFIER with NEWID() default (replaces ObjectId) |
| **Foreign Keys** | Full constraints with CASCADE/SET NULL delete policies |
| **Indexes** | Added on frequently searched/sorted columns (Email, CreatedAt, Status) |
| **Constraints** | CHECK constraints for enum-like fields and phone validation |
| **Data Types** | Salary and HourlyRate kept as VARCHAR for backward compatibility |
| **NULL Handling** | Optional fields set NULL; required fields NOT NULL |
| **Timestamps** | DATETIME2 with GETUTCDATE() for precision |
| **Array Normalization** | HouseRentImages table created for image array |
| **JSON Storage** | Details and JSON fields stored as VARCHAR(MAX) |

---

## Migration Implementation Plan

### Phase 1: Preparation (Week 1)

#### 1.1 Database Setup
- [ ] Provision MSSQL Server instance (Azure, AWS, or local)
- [ ] Create new database named `BACHELORE`
- [ ] Run schema creation script above
- [ ] Verify all tables and constraints created successfully
- [ ] Create database user with appropriate permissions

#### 1.2 Dependency Analysis
- [ ] Review all Mongoose queries in controllers
- [ ] Document all database patterns used
- [ ] Identify custom business logic that depends on MongoDB behavior
- [ ] Create mapping document: MongoDB method → MSSQL equivalent

#### 1.3 ORM Selection & Setup
**Recommended**: **Sequelize** ORM (more suitable for relational DBs)

Alternative: **knex.js** + **mssql** package

**Installation**:
```bash
npm install sequelize mssql tedious
# OR
npm install knex mssql
```

### Phase 2: Backend Code Migration (Week 2-3)

#### 2.1 Model Layer Conversion

**BEFORE (Mongoose)**:
```javascript
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
```

**AFTER (Sequelize)**:
```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  UserId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  FullName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  Email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  Password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Phone: DataTypes.STRING,
  University: DataTypes.STRING,
  Year: DataTypes.STRING,
  Semester: DataTypes.STRING,
  EduEmail: DataTypes.STRING,
  RoommateCategory: {
    type: DataTypes.ENUM('HostRoommate', 'SeekerRoommate'),
    defaultValue: 'SeekerRoommate',
  },
  IsAvailableAsHost: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'Users',
});

export default User;
```

#### 2.2 Database Configuration File

**Create**: `backend/config/database.js`

```javascript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 1433,
  username: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'BACHELORE',
  logging: false, // Set to console.log for query logging
  pool: {
    max: 10,
    min: 2,
    idle: 10000,
  },
});

export default sequelize;
```

#### 2.3 Controller Updates

**BEFORE**:
```javascript
export const getTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.find().sort({ createdAt: -1 });
    res.json(tuitions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

**AFTER**:
```javascript
export const getTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.findAll({
      order: [['CreatedAt', 'DESC']],
    });
    res.json(tuitions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

#### 2.4 Common Query Conversions

| MongoDB | Sequelize |
|---------|-----------|
| `Model.find()` | `Model.findAll()` |
| `Model.findOne()` | `Model.findOne()` |
| `Model.findById(id)` | `Model.findByPk(id)` |
| `Model.create(data)` | `Model.create(data)` |
| `.save()` | Built-in to create/update |
| `.sort({ field: -1 })` | `order: [['field', 'DESC']]` |
| `.populate('ref')` | `include: [{ association: 'refName' }]` |
| `.select('field')` | `attributes: ['field']` |

#### 2.5 Relationship Definitions

**Example: User → Tuitions (One-to-Many)**

```javascript
// models/User.js
User.hasMany(Tuition, {
  foreignKey: 'PostedBy',
  as: 'tuitions',
});

// models/Tuition.js
Tuition.belongsTo(User, {
  foreignKey: 'PostedBy',
  as: 'author',
});
```

### Phase 3: Data Migration (Week 3-4)

#### 3.1 Data Export from MongoDB

```javascript
// scripts/exportMongoData.js
import mongoose from 'mongoose';
import fs from 'fs';

mongoose.connect(process.env.MONGO_URL);

const collections = [
  'User', 'Tuition', 'AppliedTuition', 'BookedTuition',
  'Maid', 'AppliedMaid', 'BookedMaid',
  'RoommateListing', 'AppliedRoommate', 'BookedRoommate',
  'HouseRentListing', 'MarketplaceListing',
  'Announcement', 'SubscriptionPayment', 'Contact', 'AppliedToHost'
];

for (const collection of collections) {
  const Model = (await import(`../models/${collection}.js`)).default;
  const data = await Model.find();
  fs.writeFileSync(
    `./exports/${collection}.json`,
    JSON.stringify(data, null, 2)
  );
}
```

#### 3.2 Data Import to MSSQL

```javascript
// scripts/importMssqlData.js
import fs from 'fs';
import sequelize from '../config/database.js';
import User from '../models/User.js';
// Import all models...

const collections = ['User', 'Tuition', ...];

for (const collection of collections) {
  const data = JSON.parse(
    fs.readFileSync(`./exports/${collection}.json`, 'utf-8')
  );
  
  // Map MongoDB ObjectId → GUID if needed
  const mappedData = data.map(doc => ({
    ...doc,
    UserId: doc._id,  // Convert ObjectId reference
  }));
  
  await sequelize.models[collection].bulkCreate(mappedData);
  console.log(`✅ Imported ${collection}`);
}
```

### Phase 4: Testing & Deployment (Week 4-5)

#### 4.1 Functional Testing
- [ ] Test all API endpoints with new MSSQL backend
- [ ] Verify CRUD operations (Create, Read, Update, Delete)
- [ ] Test relationships and foreign keys
- [ ] Validate data integrity and constraints
- [ ] Test authentication and authorization flows

#### 4.2 Performance Testing
- [ ] Load test with 1000+ concurrent users
- [ ] Test query performance with indexes
- [ ] Verify no N+1 query problems
- [ ] Monitor database connections

#### 4.3 Deployment
- [ ] Update `.env` with MSSQL connection details
- [ ] Deploy backend to staging environment
- [ ] Smoke test all endpoints
- [ ] Deploy to production
- [ ] Monitor application logs for errors

---

## Code Changes Required

### Files to Modify

#### 1. Backend Initialization (`backend/index.js`)

```javascript
// BEFORE
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB Connected");
    // ...
  });

// AFTER
import sequelize from './config/database.js';
sequelize.authenticate()
  .then(() => {
    console.log("MSSQL Connected");
    return sequelize.sync(); // Or use migrations
  })
  .then(() => {
    // Start server
  });
```

#### 2. Model Files (All in `backend/models/`)

**Replace all 16 model files with Sequelize equivalents**

Example transformations already shown above.

#### 3. Controller Files (All in `backend/controllers/`)

Update ~40 controller methods from Mongoose to Sequelize syntax.

**Common patterns to update**:
- `Model.find()` → `Model.findAll()`
- `ModelField: ObjectId ref` → relationships
- `.populate()` → `.include()`
- `.new()` + `.save()` → `.create()`

#### 4. Package.json Dependencies

```json
{
  "dependencies": {
    // Remove
    "mongoose": "^8.18.1",
    
    // Add
    "sequelize": "^6.35.0",
    "mssql": "^10.0.0",
    "tedious": "^18.0.0"
  }
}
```

#### 5. Environment Variables (`.env`)

```bash
# BEFORE
MONGO_URL=mongodb+srv://...

# AFTER
DB_HOST=your-server.database.windows.net
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourStrongPassword
DB_NAME=BACHELORE
```

### Files NOT Requiring Changes

- ✅ Frontend components (API calls remain same)
- ✅ Routes (Express routing unchanged)
- ✅ Controllers (logic unchanged, only queries)
- ✅ Frontend `.env` or configuration

---

## Risk Analysis & Mitigations

### Identified Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| **Data Loss During Migration** | Critical | Low | Backup MongoDB before migration; validate data count match |
| **Query Performance Degradation** | High | Medium | Add indexes; run performance tests; use Query Profiler |
| **ObjectId to GUID Conversion Issues** | High | Medium | Use migration script with UUID library; test data integrity |
| **Timestamp Handling Differences** | Medium | Medium | Ensure DATETIME2 precision; use UTC consistently |
| **Connection Pool Exhaustion** | Medium | Low | Configure Sequelize pool; monitor active connections |
| **Foreign Key Constraint Violations** | High | Medium | Disable FK checks during import; validate after |
| **Application Downtime** | Critical | Low | Use canary deployment; run parallel systems during transition |
| **Legacy Data Records** | Medium | High | Migrate all records; handle nulls and defaults properly |
| **String vs Numeric Data Type Conflicts** | Medium | High | Keep Salary/HourlyRate as VARCHAR initially; refactor later |

### Detailed Mitigation Strategies

#### 1. Database Backup Strategy
```bash
# Before migration
BACKUP DATABASE BACHELORE TO DISK = 'C:\Backups\BACHELORE_PreMigration.bak'

# Keep MongoDB running during transition (dual-write pattern)
```

#### 2. Data Validation Checklist
```sql
-- Post-migration validation queries
SELECT COUNT(*) FROM [Users]; -- Should match MongoDB count
SELECT COUNT(*) FROM [Tuitions];
SELECT COUNT(*) FROM [AppliedTuitions];
-- ... check all tables

-- Verify foreign keys
SELECT * FROM [AppliedTuitions] t
LEFT JOIN [Tuitions] dt ON t.TuitionId = dt.TuitionId
WHERE dt.TuitionId IS NULL; -- Should be 0 records
```

#### 3. Parallel Running Strategy
- **Week 1-2**: Deploy new MSSQL backend on separate URL
- **Week 3**: Route 10% of traffic to MSSQL, monitor for issues
- **Week 4**: Route 100% of traffic to MSSQL
- **Week 5**: Maintain MongoDB backup for 2 weeks before decommission

#### 4. Rollback Plan
```bash
# If critical issues:
1. Switch traffic back to MongoDB backend
2. Investigate MSSQL backend logs
3. Fix issues in separate environment
4. Retry migration
```

---

## Post-Migration Verification

### Automated Testing Suite

```javascript
// tests/integration/database.test.js
describe('MSSQL Migration Tests', () => {
  test('User creation and retrieval', async () => {
    const user = await User.create({
      FullName: 'Test User',
      Email: 'test@example.com',
      // ...
    });
    const found = await User.findByPk(user.UserId);
    expect(found.Email).toBe('test@example.com');
  });

  test('Foreign key relationships', async () => {
    const user = await User.findAll({
      include: [{ association: 'tuitions' }]
    });
    // Verify relationships work correctly
  });

  // Add tests for each entity...
});
```

### Performance Benchmarks

| Query Type | Expected Time | Target |
|------------|---------------|---------| | Find all users (1000 records) | < 50ms | < 100ms |
| Find by email | < 10ms | < 20ms |
| Create new record | < 50ms | < 100ms |
| Complex join query | < 200ms | < 500ms |

### Monitoring Setup

Monitor these metrics post-migration:
- Database connection pool utilization
- Average query response time
- Error rates in application logs
- Memory usage on database server
- Disk I/O performance

---

## Recommendations & Next Steps

### Immediate Actions
1. **Set up MSSQL environment** (locally or cloud)
2. **Create schema** using SQL script provided
3. **Install Sequelize** and tedious driver
4. **Migrate 2-3 models** as proof of concept
5. **Test 1-2 endpoint** with new database

### Medium-term Optimizations
- Implement database connection pooling
- Add audit logging for compliance
- Create views for complex queries
- Implement caching layer (Redis)
- Add database monitoring dashboard

### Long-term Considerations
- Implement database replication for high availability
- Set up automated backups (daily + weekly)
- Create disaster recovery plan
- Document data governance policies
- Plan for schema versioning/migrations

---

## Summary Table

| Aspect | Current (MongoDB) | Target (MSSQL) | Effort |
|--------|------------------|-----------------|--------|
| **Database Client** | Mongoose | Sequelize | Medium |
| **Connection Management** | Built-in | Pool config | Low |
| **Schema** | Flexible | Structured | High |
| **Foreign Keys** | Soft references | Hard constraints | Medium |
| **Data Types** | Loose | Strict | Medium |
| **Indexes** | Limited | Comprehensive | Medium |
| **Security** | Application-level | DB-level + Application | Medium |
| **Scalability** | Horizontal | Vertical + Horizontal | Low |

---

## Appendix: Useful Commands

### MSSQL Commands
```sql
-- Check database size
SELECT 
  name,
  (size * 8 / 1024) AS 'Size (MB)'
FROM sys.master_files
WHERE database_id = DB_ID('BACHELORE');

-- View all tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;

-- Check foreign keys
SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'BookedTuitions';

-- Disable all FK constraints (for migration)
EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';

-- Re-enable all FK constraints
EXEC sp_MSForEachTable 'ALTER TABLE ? CHECK CONSTRAINT ALL';
```

### Node.js/npm Commands
```bash
# Install dependencies
npm install sequelize mssql tedious

# Run migrations
npm run migrate

# Seed data
npm run seed

# Test database connection
npm run test:db

# Generate Sequelize models (optional automation)
npx sequelize-cli model:generate
```

---

**End of Migration Analysis Report**

*For questions or clarifications, refer to the code snippets and schema provided above. This report should serve as the definitive guide for migrating BacheLORE from MongoDB to MSSQL.*
