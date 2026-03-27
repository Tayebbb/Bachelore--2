# BacheLORE MongoDB to MSSQL Migration - Complete Guide

**Project**: BacheLORE - Bachelor Life Management Platform  
**Current Database**: MongoDB (Mongoose)  
**Target Database**: MSSQL (Sequelize)  
**Prepared On**: March 27, 2026  
**Total Effort**: ~210 hours (4-5 weeks, 1 developer)  
**Complexity**: Medium

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Database Analysis](#database-analysis)
5. [MSSQL Schema](#mssql-schema)
6. [Migration Plan](#migration-plan)
7. [Code Migration Guide](#code-migration-guide)
8. [Implementation Examples](#implementation-examples)
9. [Migration Checklist](#migration-checklist)
10. [Risk Management](#risk-management)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Procedures](#deployment-procedures)

---

## EXECUTIVE SUMMARY

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total Tables** | 17 |
| **Models to Migrate** | 16 |
| **Controllers to Update** | 13-15 |
| **API Endpoints** | ~40-50 |
| **Lines of Code Modified** | 2000-3000+ |
| **Estimated Timeline** | 4-5 weeks |
| **Developer Count** | 1-2 |
| **Risk Level** | Medium |

### Why Migrate?
- ✅ Relational data integrity with FK constraints
- ✅ Better performance with proper indexing
- ✅ Scalability for enterprise deployments
- ✅ ACID compliance built-in
- ✅ Mature backup/recovery features

### Success Criteria
✅ All data migrated correctly  
✅ All 40-50 API endpoints functional  
✅ Performance within 5-10% of original  
✅ 99.9% uptime in first week  
✅ < 0.1% error rate  
✅ Full test coverage (95%+)

---

## PROJECT OVERVIEW

### Core Modules

| Module | Purpose | Key Entities |
|--------|---------|--------------|
| **Authentication** | Signup/login with JWT | User |
| **Tuition Management** | Post, apply, book tutoring | Tuition, AppliedTuition, BookedTuition |
| **Maid Services** | Book cleaning/domestic help | Maid, AppliedMaid, BookedMaid |
| **Roommate Finder** | Connect students seeking roommates | RoommateListing, AppliedRoommate, BookedRoommate |
| **House Rentals** | Browse & book properties | HouseRentListing, HouseRentImages |
| **Marketplace** | Student buy/sell platform | MarketplaceListing |
| **Payments** | Subscription tracking | SubscriptionPayment |
| **Announcements** | Admin broadcasts | Announcement |
| **Activity** | Messaging & tracking | Contact |

### User Roles
- **Student**: Browse services, apply/book listings, post offerings
- **Host**: Offer rooms (subset of Student with flag)
- **Admin**: Manage content, verify listings, post announcements

---

## TECHNOLOGY STACK

### Current Stack

**Backend**
```
Node.js + Express 5.1.0
├── Mongoose 8.18.1 (MongoDB ODM)
├── JWT 9.0.2 (Authentication)
├── bcryptjs 2.4.3 (Password hashing)
├── Axios 1.11.0 (HTTP client)
├── CORS 2.8.5 (Cross-origin)
└── dotenv 17.2.3 (Config)
```

**Frontend**
```
React 19.1.0 + Vite 7.0.4
├── React Router 7.7.1 (Navigation)
├── Axios 1.11.0 (API calls)
├── Bootstrap 5.3.7 (Styling)
└── Bootstrap Icons 1.13.1 (Icons)
```

### Target Stack

**Backend (CHANGED)**
```
Node.js + Express 5.1.0 (SAME)
├── Sequelize 6.35.0 (MSSQL ORM) ✓ NEW
├── mssql 10.0.0 (Driver) ✓ NEW
├── tedious 18.0.0 (Connection) ✓ NEW
├── JWT 9.0.2 (Authentication) (SAME)
├── bcryptjs 2.4.3 (Password hashing) (SAME)
└── ... other packages SAME
```

**Frontend (NO CHANGES)**
```
React + Vite (All same, API stays same)
```

---

## DATABASE ANALYSIS

### Current MongoDB Collections → MSSQL Tables

#### 1. Users Table
```javascript
// MongoDB
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (bcrypt),
  phone: String,
  university: String,
  year: String,
  semester: String,
  eduEmail: String,
  roommateCategory: Enum['HostRoommate','SeekerRoommate'],
  isAvailableAsHost: Boolean,
  timestamps: { createdAt, updatedAt }
}

// MSSQL Equivalent
[UserId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID()
[FullName] VARCHAR(255)
[Email] VARCHAR(255) NOT NULL UNIQUE
[Password] VARCHAR(255) NOT NULL
[Phone] VARCHAR(20) NOT NULL
[University] VARCHAR(255) NOT NULL
[Year] VARCHAR(50) NOT NULL
[Semester] VARCHAR(50) NOT NULL
[EduEmail] VARCHAR(255) NOT NULL
[RoommateCategory] VARCHAR(50) CHECK IN ('HostRoommate','SeekerRoommate')
[IsAvailableAsHost] BIT DEFAULT 0
[CreatedAt] DATETIME2 DEFAULT GETUTCDATE()
[UpdatedAt] DATETIME2 DEFAULT GETUTCDATE()
```

#### 2. Tuitions Table
```javascript
// MongoDB
{ _id, title, subject, days, salary, location, description, contact, postedBy, createdAt }

// MSSQL
[TuitionId] UNIQUEIDENTIFIER PRIMARY KEY
[Title] VARCHAR(255) NOT NULL
[Subject] VARCHAR(255) NOT NULL
[Days] VARCHAR(255) NOT NULL
[Salary] VARCHAR(100) NOT NULL
[Location] VARCHAR(255) NOT NULL
[Description] VARCHAR(MAX) NOT NULL
[Contact] VARCHAR(20) NOT NULL CHECK LIKE '01[0-9]{9}'
[PostedBy] VARCHAR(255)
[CreatedAt] DATETIME2 DEFAULT GETUTCDATE()
```

#### 3-4. AppliedTuitions & BookedTuitions
```javascript
// AppliedTuitions
[AppliedTuitionId] UNIQUEIDENTIFIER PRIMARY KEY
[TuitionId] UNIQUEIDENTIFIER NOT NULL FK → Tuitions
[Name] VARCHAR(255) NOT NULL
[Email] VARCHAR(255) NOT NULL
[Contact] VARCHAR(20) NOT NULL
[Message] VARCHAR(MAX)
[CreatedAt] DATETIME2

// BookedTuitions
[BookedTuitionId] UNIQUEIDENTIFIER PRIMARY KEY
[TuitionRef] UNIQUEIDENTIFIER NOT NULL FK → Tuitions
[Title], [Subject], [Days], [Salary], [Location], [Description], [Contact] (all VARCHAR)
[ApplicantName] VARCHAR(255) NOT NULL
[ApplicantEmail] VARCHAR(255) NOT NULL
[ApplicantContact] VARCHAR(20) NOT NULL
[Message] VARCHAR(MAX)
[BookedAt] DATETIME2
```

#### 5-7. Maid Services (3 tables)
```javascript
// Maids
[MaidId], [Name], [HourlyRate], [Location], [Description], [Contact], [CreatedAt]

// AppliedMaids
[AppliedMaidId], [MaidId] FK, [Name], [Email], [Contact], [Message], [CreatedAt]

// BookedMaids
[BookedMaidId], [MaidRef] FK, [Name], [HourlyRate], [Location], [Contact]
[ApplicantName], [ApplicantEmail], [ApplicantContact], [Message], [BusyUntil], [BookedAt]
```

#### 8-10. Roommate Services (4 tables)
```javascript
// RoommateListings
[RoommateListingId], [UserRef] FK, [Name], [Email], [Contact], [Location], [RoomsAvailable], [Details], [CreatedAt]

// AppliedRoommates
[AppliedRoommateId], [UserRef] FK, [Name], [Email], [Contact], [Location], [RoomsAvailable], [Message], [CreatedAt]

// BookedRoommates
[BookedRoommateId], [ListingRef] FK, [HostRef] FK, [HostName], [HostEmail], [HostContact]
[Location], [RoomsAvailable], [Details], [ApplicantRef] FK, [ApplicantName], [ApplicantEmail], [ApplicantContact], [Message], [BookedAt]

// AppliedToHost
[AppliedToHostId], [ListingRef] FK, [ApplicantRef] FK, [Name], [Email], [Message], [CreatedAt]
```

#### 11-12. House Rentals (2 tables - normalized)
```javascript
// HouseRentListings
[HouseRentListingId], [OwnerRef] FK → Users, [Title], [Description], [Location], [Price] INT
[Rooms] INT, [Contact], [Verified] BIT, [CreatedAt]

// HouseRentImages (NEW - normalized from array)
[HouseRentImageId], [HouseRentListingId] FK, [ImageUrl], [CreatedAt]
```

#### 13. MarketplaceListings
```javascript
[MarketplaceListingId], [Title], [Description], [Price] DECIMAL(10,2), [Image]
[Contact], [SellerEmail], [BuyerEmail], [Status] VARCHAR(50) CHECK IN ('available','sold'), [CreatedAt]
```

#### 14-16. Other Tables
```javascript
// Announcements
[AnnouncementId], [Title], [Message], [Author], [CreatedAt]

// SubscriptionPayments
[SubscriptionPaymentId], [UserEmail], [Amount] DECIMAL(10,2), [PaymentMethod]
[TransactionId], [Status] VARCHAR(50) CHECK IN ('pending','completed','failed'), [PaidAt], [Details] VARCHAR(MAX)

// Contacts (Messaging)
[ContactId], [SenderId] FK → Users, [ReceiverId] FK → Users, [Message] VARCHAR(MAX), [CreatedAt]
```

### Field Naming Convention
- MongoDB: `camelCase` (fullName, createdAt)
- MSSQL: `PascalCase` (FullName, CreatedAt)
- Primary Keys: `[TableName]Id` (UserId, TuitionId)
- Foreign Keys: `[ReferencedTable]Id` (TuitionId, HostRef)

---

## MSSQL SCHEMA

### Complete SQL Schema (Ready to Copy-Paste)

```sql
-- ============================================================================
-- BacheLORE MSSQL Database Schema
-- Execute this entire script to create the database structure
-- ============================================================================

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
    [Salary] VARCHAR(100) NOT NULL,
    [Location] VARCHAR(255) NOT NULL,
    [Description] VARCHAR(MAX) NOT NULL,
    [Contact] VARCHAR(20) NOT NULL,
    [PostedBy] VARCHAR(255),
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
    [BusyUntil] DATETIME2,
    [BookedAt] DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_BookedMaids_Maid FOREIGN KEY ([MaidRef]) 
        REFERENCES [dbo].[Maids]([MaidId]) ON DELETE CASCADE
);
CREATE INDEX [IX_BookedMaids_MaidRef] ON [dbo].[BookedMaids]([MaidRef]);

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
    [Details] VARCHAR(MAX),
    CONSTRAINT CK_PaymentStatus CHECK ([Status] IN ('pending', 'completed', 'failed'))
);
CREATE INDEX [IX_SubscriptionPayments_UserEmail] ON [dbo].[SubscriptionPayments]([UserEmail]);
CREATE INDEX [IX_SubscriptionPayments_Status] ON [dbo].[SubscriptionPayments]([Status]);

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
```

---

## MIGRATION PLAN

### Phase 0: Pre-Migration Planning

**Timeline**: Before Week 1

**Tasks**:
- [ ] Provision MSSQL server (local, Azure, or AWS)
- [ ] Verify MSSQL version 2016+ installed
- [ ] Backup production MongoDB (`mongodump`)
- [ ] Create new MSSQL database named `BACHELORE`
- [ ] Create database user with proper permissions
- [ ] Document MongoDB connection strings for reference
- [ ] Confirm Node.js version 14+
- [ ] Schedule team kickoff meeting
- [ ] Create project repository branch (`feature/mssql-migration`)

**Backup Command**:
```bash
mongodump --uri="mongodb+srv://..." --out ./mongo_backup_$(date +%Y%m%d)
```

---

### Phase 1: Environment Setup (Week 1)

**Goals**:
- Sequelize installed and configured
- MSSQL schema created
- Database connection tested

**Tasks**:

#### 1.1 Install Dependencies
```bash
cd backend
npm install sequelize mssql tedious
npm install --save-dev @types/sequelize
```

#### 1.2 Create Database Configuration
**File: `backend/config/database.js`**

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
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  pool: {
    max: 10,
    min: 2,
    idle: 10000,
    acquire: 30000,
  },
  dialectOptions: {
    options: {
      useUTC: true,
      dateFirst: 1,
    },
  },
  timezone: '+00:00',
});

export default sequelize;
```

#### 1.3 Update Environment Variables
**File: `.env`**

```bash
# Remove MongoDB URL
# MONGO_URL=mongodb+srv://...

# Add MSSQL Connection
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourPassword
DB_NAME=BACHELORE
DB_LOGGING=false

# Keep existing
PORT=5000
JWT_SECRET=your_jwt_secret
ADMIN_CODE=choton2025
```

#### 1.4 Execute Schema
```sql
-- Copy entire schema from "MSSQL Schema" section
-- Paste into MSSQL Management Studio
-- Execute as one script
```

#### 1.5 Verify Setup
```bash
node -e "
import sequelize from './config/database.js';
try {
  await sequelize.authenticate();
  console.log('✅ Database connection successful');
  const tables = await sequelize.query(\"SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo'\");
  console.log('Tables created:', tables.length);
} catch (err) {
  console.error('❌ Connection failed:', err.message);
}
"
```

---

### Phase 2: Model Migration (Weeks 1-2)

**Goals**:
- 16 models converted to Sequelize
- All relationships defined
- Models tested

**Key Model Pattern**:

```javascript
// BEFORE: Mongoose
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  university: { type: String, required: true },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  eduEmail: { type: String, required: true },
  roommateCategory: { type: String, enum: ['HostRoommate','SeekerRoommate'], default: 'SeekerRoommate' },
  isAvailableAsHost: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;

// AFTER: Sequelize
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
    validate: { isEmail: true },
  },
  Password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  University: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Year: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Semester: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  EduEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
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

**Models to Migrate** (in order):
1. User.js
2. Tuition.js, AppliedTuition.js, BookedTuition.js
3. Maid.js, AppliedMaid.js, BookedMaid.js
4. RoommateListing.js, AppliedRoommate.js, BookedRoommate.js
5. HouseRentListing.js, HouseRentImage.js (NEW)
6. AppliedToHost.js
7. MarketplaceListing.js
8. Announcement.js
9. SubscriptionPayment.js
10. Contact.js

**Define Relationships** (after all models created):

```javascript
// In a file like `backend/models/index.js` or at end of each model:

// User relationships
User.hasMany(RoommateListing, { foreignKey: 'UserRef' });
User.hasMany(BookedRoommate, { foreignKey: 'HostRef', as: 'hostedBookings' });
User.hasMany(BookedRoommate, { foreignKey: 'ApplicantRef', as: 'applicantBookings' });
User.hasMany(HouseRentListing, { foreignKey: 'OwnerRef' });
User.hasMany(Contact, { foreignKey: 'SenderId', as: 'sentMessages' });
User.hasMany(Contact, { foreignKey: 'ReceiverId', as: 'receivedMessages' });

RoommateListing.belongsTo(User, { foreignKey: 'UserRef' });
BookedRoommate.belongsTo(RoommateListing, { foreignKey: 'ListingRef' });
BookedRoommate.belongsTo(User, { foreignKey: 'HostRef', as: 'host' });
BookedRoommate.belongsTo(User, { foreignKey: 'ApplicantRef', as: 'applicant' });

HouseRentListing.hasMany(HouseRentImage, { foreignKey: 'HouseRentListingId', as: 'images' });
HouseRentImage.belongsTo(HouseRentListing, { foreignKey: 'HouseRentListingId' });

AppliedTuition.belongsTo(Tuition, { foreignKey: 'TuitionId' });
Tuition.hasMany(AppliedTuition, { foreignKey: 'TuitionId' });

// ... and so on for other relationships
```

---

### Phase 3: Controller Migration (Weeks 2-3)

**Goals**:
- 13-15 controllers updated to Sequelize
- All endpoints tested
- Complex queries working

**Migration Pattern**:

```javascript
// ===== BEFORE: Mongoose =====
export const getTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.find().sort({ createdAt: -1 });
    res.json(tuitions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTuition = async (req, res) => {
  try {
    const { title, subject, days, salary, location, description, contact } = req.body;
    if (!title || !subject || !days || !salary || !location || !description || !contact) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    const tuition = new Tuition({
      title, subject, days, salary, location, description, contact, postedBy: 'admin'
    });
    await tuition.save();
    res.status(201).json({ msg: 'Tuition posted', tuition });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== AFTER: Sequelize =====
export const getTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.findAll({
      order: [['CreatedAt', 'DESC']]
    });
    res.json(tuitions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTuition = async (req, res) => {
  try {
    const { title, subject, days, salary, location, description, contact } = req.body;
    if (!title || !subject || !days || !salary || !location || !description || !contact) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    const tuition = await Tuition.create({
      Title: title,
      Subject: subject,
      Days: days,
      Salary: salary,
      Location: location,
      Description: description,
      Contact: contact,
      PostedBy: 'admin'
    });
    res.status(201).json({ msg: 'Tuition posted', tuition });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

**Controllers to Update**:
- signupController.js
- loginController.js
- tuitionController.js
- appliedTuitionController.js
- bookedTuitionController.js
- maidController.js
- appliedMaidController.js
- bookedMaidController.js
- roommateController.js
- houseRentController.js
- appliedToHostController.js
- marketplaceController.js
- announcementController.js
- subscriptionController.js
- activityController.js
- adminController.js

---

### Phase 4: Data Migration (Week 3)

**Export from MongoDB**:

```bash
# File: scripts/exportMongo.js
mongodump --uri="..." --out ./mongo_export

# Or use Node script to JSON
```

**Transform Data**:

```javascript
// File: scripts/transformData.js
import fs from 'fs';

const collections = ['User', 'Tuition', 'AppliedTuition', ...];

for (const collection of collections) {
  const data = JSON.parse(fs.readFileSync(`./mongo_export/${collection}.json`));
  
  // Convert field names and IDs
  const transformed = data.map(doc => ({
    // Map all fields from camelCase to PascalCase
    // Convert _id to GUID or keep as UUID
    ...doc,
  }));
  
  fs.writeFileSync(`./exports/${collection}.json`, JSON.stringify(transformed, null, 2));
}
```

**Import to MSSQL**:

```javascript
// File: scripts/importMssql.js
import sequelize from '../config/database.js';
import * as Models from '../models/index.js';

const importData = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    // Import in order (respect FKs)
    const order = ['User', 'Tuition', 'AppliedTuition', 'BookedTuition', ...];
    
    for (const modelName of order) {
      const data = JSON.parse(fs.readFileSync(`./exports/${modelName}.json`));
      await Models[modelName].bulkCreate(data, { transaction });
      console.log(`✅ Imported ${modelName}: ${data.length} records`);
    }
    
    await transaction.commit();
    console.log('✅ Migration complete');
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Migration failed:', err);
  }
};

importData();
```

**Verify Migration**:

```sql
-- Check record counts
SELECT 'Users' AS TableName, COUNT(*) AS RecordCount FROM [dbo].[Users]
UNION ALL
SELECT 'Tuitions', COUNT(*) FROM [dbo].[Tuitions]
UNION ALL
SELECT 'AppliedTuitions', COUNT(*) FROM [dbo].[AppliedTuitions]
-- ... etc for all tables

-- Check for orphaned FK
SELECT * FROM [dbo].[AppliedTuitions] apt
LEFT JOIN [dbo].[Tuitions] t ON apt.TuitionId = t.TuitionId
WHERE t.TuitionId IS NULL;
```

---

### Phase 5: Testing (Week 4)

**Unit Tests**:

```javascript
// tests/models/user.test.js
import User from '../../models/User.js';

describe('User Model', () => {
  test('Create user', async () => {
    const user = await User.create({
      FullName: 'John Doe',
      Email: 'john@test.edu',
      Password: 'hash...',
      Phone: '01234567890',
      University: 'DU',
      Year: '1st',
      Semester: 'Fall',
      EduEmail: 'john@du.edu.bd'
    });
    expect(user.UserId).toBeDefined();
    expect(user.Email).toBe('john@test.edu');
  });
});

// tests/controllers/tuition.test.js
import request from 'supertest';
import app from '../../index.js';

describe('Tuition API', () => {
  test('GET /api/tuitions returns list', async () => {
    const res = await request(app).get('/api/tuitions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/tuitions creates tuition', async () => {
    const res = await request(app)
      .post('/api/tuitions')
      .send({
        title: 'Math Tuition',
        subject: 'Calculus',
        days: '3 days/week',
        salary: '5000',
        location: 'Dhaka',
        description: 'Learn calculus',
        contact: '01234567890',
        adminCode: 'choton2025'
      });
    expect(res.status).toBe(201);
    expect(res.body.tuition.Title).toBe('Math Tuition');
  });
});
```

**Integration Tests**:
- [ ] Full user signup → login → browse → apply workflow
- [ ] All CRUD operations on each entity
- [ ] Complex queries with relationships
- [ ] Authorization checks
- [ ] Error handling

**Performance Tests**:
- [ ] Query response time < 100ms average
- [ ] Complex joins < 500ms
- [ ] Load test with 100+ concurrent users
- [ ] Database connection pool not exhausted

---

### Phase 6: Staging Deployment (Week 4-5)

**Deploy to Staging**:
```bash
git checkout staging
git merge feature/mssql-migration
npm install --production
npm start
```

**Smoke Tests**:
```bash
curl http://localhost:5000/health
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.edu",...}'
```

**Monitor Logs**:
```bash
tail -f logs/application.log
```

---

### Phase 7: Production Deployment (Week 5)

**Pre-Deployment**:
- [ ] Final database backup
- [ ] Deployment window scheduled (off-peak)
- [ ] Rollback procedure tested
- [ ] Team on standby
- [ ] Monitoring configured

**Deployment**:
```bash
# 1. Set maintenance mode
export MAINTENANCE_MODE=1

# 2. Deploy new code
git pull origin main
npm install --production

# 3. Update environment
export DB_HOST=prod-mssql.database.windows.net
export DB_USER=prod_user
export DB_PASSWORD=***
export DB_NAME=BACHELORE_PROD

# 4. Restart app
npm start

# 5. Verify
curl http://localhost:5000/health
```

**Post-Deployment**:
- [ ] Monitor error rates (first 1 hour)
- [ ] Monitor database connections
- [ ] Monitor response times
- [ ] Check user reports
- [ ] Keep MongoDB backup for 30 days

---

## CODE MIGRATION GUIDE

### Query Conversion Reference

#### FIND / FIND ALL

```javascript
// Mongoose
const user = await User.findOne({ email: 'x@y.com' });
const users = await User.find({ university: 'DU' });
const allUsers = await User.find();

// Sequelize
const user = await User.findOne({ where: { Email: 'x@y.com' } });
const users = await User.findAll({ where: { University: 'DU' } });
const allUsers = await User.findAll();
```

#### FIND BY ID

```javascript
// Mongoose
const user = await User.findById(id);

// Sequelize
const user = await User.findByPk(id);
```

#### CREATE

```javascript
// Mongoose
const user = new User({ fullName, email, password });
await user.save();

// Sequelize (simpler)
const user = await User.create({ FullName: fullName, Email: email, Password: password });
```

#### UPDATE

```javascript
// Mongoose
user.email = 'new@test.com';
await user.save();

// Sequelize
user.Email = 'new@test.com';
await user.save();

// Or update directly
await User.update({ Email: 'new@test.com' }, { where: { UserId: id } });
```

#### DELETE

```javascript
// Mongoose
await User.findByIdAndDelete(id);

// Sequelize
await User.destroy({ where: { UserId: id } });
```

#### SORT

```javascript
// Mongoose
const items = await Tuition.find().sort({ createdAt: -1 });

// Sequelize
const items = await Tuition.findAll({ order: [['CreatedAt', 'DESC']] });
```

#### PAGINATION

```javascript
// Mongoose
const items = await Item.find().limit(10).skip(20);

// Sequelize
const items = await Item.findAll({ limit: 10, offset: 20 });
```

#### COMPLEX FILTERING

```javascript
// Mongoose
const listing = await HouseRentListing.find({
  price: { $gte: 5000, $lte: 20000 },
  verified: true
});

// Sequelize
import { Op } from 'sequelize';
const listing = await HouseRentListing.findAll({
  where: {
    Price: { [Op.gte]: 5000, [Op.lte]: 20000 },
    Verified: true
  }
});
```

#### RELATIONSHIPS

```javascript
// Mongoose - Populate
const booking = await BookedTuition.findById(id).populate('tuitionRef');

// Sequelize - Include
const booking = await BookedTuition.findByPk(id, {
  include: [{ model: Tuition, as: 'tuition' }]
});
```

#### COUNT

```javascript
// Mongoose
const count = await User.countDocuments();

// Sequelize
const count = await User.count();
```

#### TRANSACTIONS

```javascript
// Mongoose
const session = await mongoose.startSession();
session.startTransaction();
try {
  await User.create([...], { session });
  await Tuition.create([...], { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
}

// Sequelize
const transaction = await sequelize.transaction();
try {
  await User.create({...}, { transaction });
  await Tuition.create({...}, { transaction });
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
}
```

### Field Naming

| MongoDB | MSSQL | Example |
|---------|-------|---------|
| _id | [TableName]Id | UserId, TuitionId |
| fullName | FullName | User.FullName |
| createdAt | CreatedAt | MarketplaceListing.CreatedAt |
| email | Email | User.Email |
| roommateCategory | RoommateCategory | User.RoommateCategory |

### Operators

| Operation | Mongoose | Sequelize |
|-----------|----------|-----------|
| Equals | `{ field: value }` | `{ [Op.eq]: value }` |
| Not equals | `{ field: { $ne: value } }` | `{ [Op.ne]: value }` |
| Greater than | `{ $gt: value }` | `{ [Op.gt]: value }` |
| Greater or equal | `{ $gte: value }` | `{ [Op.gte]: value }` |
| Less than | `{ $lt: value }` | `{ [Op.lt]: value }` |
| Less or equal | `{ $lte: value }` | `{ [Op.lte]: value }` |
| In array | `{ $in: [...] }` | `{ [Op.in]: [...] }` |
| Like (string) | `{ $regex: pattern }` | `{ [Op.like]: '%pattern%' }` |
| And | `{ $and: [...] }` | `{ [Op.and]: [...] }` |
| Or | `{ $or: [...] }` | `{ [Op.or]: [...] }` |

---

## IMPLEMENTATION EXAMPLES

### Example 1: User Signup

```javascript
// BEFORE: Mongoose
export const signup = async (req, res) => {
  try {
    const { fullName, email, password, university, year, semester, eduEmail, phone } = req.body;
    
    if (!fullName || !email || !password || !university || !year || !semester || !eduEmail || !phone) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({ msg: "Password must be at least 8 characters..." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName, email, password: hashed, university, year, semester, eduEmail, phone
    });
    const saved = await newUser.save();
    res.status(201).json({ msg: "User registered successfully", user: { id: saved._id, email: saved.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// AFTER: Sequelize
export const signup = async (req, res) => {
  try {
    const { fullName, email, password, university, year, semester, eduEmail, phone } = req.body;
    
    if (!fullName || !email || !password || !university || !year || !semester || !eduEmail || !phone) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({ msg: "Password must be at least 8 characters..." });
    }

    const existingUser = await User.findOne({ where: { Email: email } });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      FullName: fullName,
      Email: email,
      Password: hashed,
      University: university,
      Year: year,
      Semester: semester,
      EduEmail: eduEmail,
      Phone: phone
    });
    
    res.status(201).json({ 
      msg: "User registered successfully", 
      user: { id: newUser.UserId, email: newUser.Email } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Example 2: Get Tuitions with Complex Filters

```javascript
// BEFORE: Mongoose
export const searchTuitions = async (req, res) => {
  try {
    const { subject, location, maxSalary } = req.query;
    
    const filter = {};
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (maxSalary) filter.salary = { $lte: parseInt(maxSalary) };
    
    const tuitions = await Tuition.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(tuitions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// AFTER: Sequelize
import { Op } from 'sequelize';

export const searchTuitions = async (req, res) => {
  try {
    const { subject, location, maxSalary } = req.query;
    
    const where = {};
    if (subject) where.Subject = { [Op.like]: `%${subject}%` };
    if (location) where.Location = { [Op.like]: `%${location}%` };
    if (maxSalary) where.Salary = { [Op.lte]: parseInt(maxSalary) };
    
    const tuitions = await Tuition.findAll({
      where,
      order: [['CreatedAt', 'DESC']],
      limit: 20
    });
    
    res.json(tuitions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Example 3: Booked Tuitions with Relationships

```javascript
// BEFORE: Mongoose
export const getBookedTuition = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await BookedTuition.findById(id)
      .populate('tuitionRef', 'title subject salary location');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// AFTER: Sequelize
export const getBookedTuition = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await BookedTuition.findByPk(id, {
      include: [{
        model: Tuition,
        as: 'tuition',
        attributes: ['Title', 'Subject', 'Salary', 'Location']
      }]
    });
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Model Association (define once)
BookedTuition.belongsTo(Tuition, { foreignKey: 'TuitionRef', as: 'tuition' });
```

### Example 4: Create with Related Records (Transaction)

```javascript
// BEFORE: Mongoose
export const applyForTuition = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { tuitionId, name, email, contact, message } = req.body;
    
    const tuition = await Tuition.findById(tuitionId).session(session);
    if (!tuition) {
      await session.abortTransaction();
      return res.status(404).json({ msg: 'Tuition not found' });
    }
    
    const application = new AppliedTuition({
      tuitionId, name, email, contact, message
    });
    await application.save({ session });
    
    await session.commitTransaction();
    res.status(201).json({ msg: 'Application submitted', application });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  }
};

// AFTER: Sequelize
export const applyForTuition = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { tuitionId, name, email, contact, message } = req.body;
    
    const tuition = await Tuition.findByPk(tuitionId, { transaction });
    if (!tuition) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Tuition not found' });
    }
    
    const application = await AppliedTuition.create({
      TuitionId: tuitionId,
      Name: name,
      Email: email,
      Contact: contact,
      Message: message
    }, { transaction });
    
    await transaction.commit();
    res.status(201).json({ msg: 'Application submitted', application });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};
```

### Example 5: Update with Partial Data

```javascript
// BEFORE: Mongoose
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({ msg: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// AFTER: Sequelize
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Map field names
    const mappedData = {
      FullName: updateData.fullName,
      Phone: updateData.phone,
      Year: updateData.year,
      Semester: updateData.semester,
    };
    
    // Remove undefined values
    Object.keys(mappedData).forEach(key => 
      mappedData[key] === undefined && delete mappedData[key]
    );
    
    await User.update(mappedData, { where: { UserId: userId } });
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({ msg: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Example 6: Delete with Cascade

```javascript
// BEFORE: Mongoose (manual cascade)
export const deleteTuition = async (req, res) => {
  try {
    const { tuitionId } = req.params;
    
    // Manual cascade
    await AppliedTuition.deleteMany({ tuitionId });
    await BookedTuition.deleteMany({ tuitionRef: tuitionId });
    await Tuition.findByIdAndDelete(tuitionId);
    
    res.json({ msg: 'Tuition deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// AFTER: Sequelize (automatic cascade)
export const deleteTuition = async (req, res) => {
  try {
    const { tuitionId } = req.params;
    
    // Cascade is handled by database (ON DELETE CASCADE)
    await Tuition.destroy({ where: { TuitionId: tuitionId } });
    
    res.json({ msg: 'Tuition deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Example 7: House Rentals with Normalized Images

```javascript
// BEFORE: Mongoose (array)
const houseRent = await HouseRentListing.findById(id)
  .select('images title location price');
// Returns: { images: ['url1', 'url2'], title: '...', ... }

// Add image
const house = await HouseRentListing.findById(id);
house.images.push('newImageUrl');
await house.save();

// AFTER: Sequelize (normalized table)
const houseRent = await HouseRentListing.findByPk(id, {
  include: [{
    model: HouseRentImage,
    as: 'images',
    attributes: ['ImageUrl'],
    required: false
  }],
  attributes: ['Title', 'Location', 'Price']
});

// Add image (create new record)
await HouseRentImage.create({
  HouseRentListingId: id,
  ImageUrl: 'newImageUrl'
});
```

---

## MIGRATION CHECKLIST

### Phase 0: Pre-Migration
- [ ] Provision MSSQL server
- [ ] Backup MongoDB (`mongodump`)
- [ ] Create MSSQL database
- [ ] Create database user
- [ ] Verify Node.js version
- [ ] Schedule team kickoff
- [ ] Create project branch

### Phase 1: Setup (Week 1)
- [ ] Install Sequelize dependencies
- [ ] Create database config file
- [ ] Update .env with DB credentials
- [ ] Execute SQL schema in MSSQL
- [ ] Test database connection
- [ ] Verify all 17 tables created

### Phase 2: Models (Weeks 1-2)
- [ ] Create User.js model
- [ ] Create Tuition*.js models (3 files)
- [ ] Create Maid*.js models (3 files)
- [ ] Create Roommate*.js models (4 files)
- [ ] Create HouseRent*.js models (2 files)
- [ ] Create AppliedToHost.js
- [ ] Create MarketplaceListing.js
- [ ] Create Announcement.js
- [ ] Create SubscriptionPayment.js
- [ ] Create Contact.js
- [ ] Define all model relationships
- [ ] Test model creation/queries
- [ ] Verify primary & foreign keys

### Phase 3: Controllers (Weeks 2-3)
- [ ] Update signupController.js
- [ ] Update loginController.js
- [ ] Update tuitionController.js
- [ ] Update appliedTuitionController.js
- [ ] Update bookedTuitionController.js
- [ ] Update maidController.js
- [ ] Update appliedMaidController.js
- [ ] Update bookedMaidController.js
- [ ] Update roommateController.js
- [ ] Update houseRentController.js
- [ ] Update appliedToHostController.js
- [ ] Update marketplaceController.js
- [ ] Update announcementController.js
- [ ] Update subscriptionController.js
- [ ] Update activityController.js
- [ ] Test all endpoints
- [ ] Verify error handling

### Phase 4: Data (Week 3)
- [ ] Export MongoDB data
- [ ] Transform field names & types
- [ ] Import to MSSQL
- [ ] Verify record counts match
- [ ] Check for orphaned FKs
- [ ] Validate data integrity
- [ ] Sample random records

### Phase 5: Testing (Week 4)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance test queries
- [ ] Load test with 100 users
- [ ] Test error scenarios
- [ ] Verify complex relationships
- [ ] Check response times

### Phase 6: Staging (Week 4-5)
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Test all user workflows
- [ ] Monitor application logs
- [ ] Get stakeholder sign-off
- [ ] Performance OK?

### Phase 7: Production (Week 5)
- [ ] Final database backup
- [ ] Verify rollback plan
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Monitor database connections
- [ ] Check response times
- [ ] Verify no user issues

### Phase 8: Cleanup
- [ ] Remove MongoDB code
- [ ] Archive migration scripts
- [ ] Update documentation
- [ ] Set up automated backups
- [ ] Configure monitoring alerts
- [ ] Train operations team

---

## RISK MANAGEMENT

### Identified Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Data Loss | Critical | Low | Pre-migration backup + validation queries |
| Performance Degradation | High | Medium | Add indexes, load testing, query optimization |
| ObjectId Conversion Issues | High | Medium | Automated UUID mapping, data validation |
| Query Syntax Errors | High | Medium | Code review, comprehensive testing |
| FK Constraint Violations | High | High | Pre-import data validation, test import |
| Downtime | Medium | Low | Canary deployment, parallel testing |
| Connection Pool Exhaustion | Medium | Low | Sequelize config, monitoring alerts |
| Timestamp Issues | Low | Low | Use UTC, validate timestamps |

### Mitigation Strategies

1. **Data Backup**
   ```bash
   # Before migration
   mongodump --uri="..." --out ./mongodump_$(date +%Y%m%d_%H%M%S)
   BACKUP DATABASE BACHELORE TO DISK = 'D:\backups\PRE_MIGRATION.bak'
   ```

2. **Validation Queries**
   ```sql
   -- Verify counts
   SELECT 'Users' TableName, COUNT(*) Cnt FROM Users
   UNION ALL
   SELECT 'Tuitions', COUNT(*) FROM Tuitions
   -- etc
   
   -- Check orphaned FKs
   SELECT * FROM AppliedTuitions WHERE TuitionId NOT IN 
     (SELECT TuitionId FROM Tuitions)
   ```

3. **Performance Testing**
   ```javascript
   // Load test script
   const start = Date.now();
   for(let i=0; i<1000; i++) {
     await Tuition.findAll();
   }
   console.log(`Average: ${(Date.now()-start)/1000}ms`);
   ```

4. **Canary Deployment**
   - Route 10% traffic to MSSQL backend
   - Monitor error rates
   - Gradually increase to 100%
   - Keep MongoDB as fallback

---

## TESTING STRATEGY

### Unit Tests

```javascript
// Each model gets tested
test('User model creates with valid data', async () => {
  const user = await User.create({
    FullName: 'Test', Email: 'test@test.edu', Password: 'hash',
    Phone: '01234567890', University: 'DU', Year: '1st',
    Semester: 'Fall', EduEmail: 'test@du.edu.bd'
  });
  expect(user.UserId).toBeDefined();
  expect(user.Email).toBe('test@test.edu');
});

test('User model rejects duplicate email', async () => {
  await User.create({ Email: 'dup@test.edu', ... });
  expect(User.create({ Email: 'dup@test.edu', ... }))
    .rejects.toThrow();
});
```

### Integration Tests

```javascript
// Test full workflows
test('Complete signup → login → browse workflow', async () => {
  // 1. Signup
  const signupRes = await request(app).post('/api/signup')
    .send({ fullName: 'John', email: 'john@test.edu', ... });
  expect(signupRes.status).toBe(201);
  
  // 2. Login
  const loginRes = await request(app).post('/api/login')
    .send({ email: 'john@test.edu', password: '...' });
  expect(loginRes.status).toBe(200);
  
  // 3. Browse services
  const browseRes = await request(app).get('/api/tuitions');
  expect(browseRes.status).toBe(200);
  expect(Array.isArray(browseRes.body)).toBe(true);
});
```

### Performance Benchmarks

| Query | Target | Acceptable |
|-------|--------|-----------|
| SELECT all (1000 records) | < 50ms | < 100ms |
| SELECT by ID | < 10ms | < 20ms |
| INSERT record | < 50ms | < 100ms |
| Complex JOIN | < 200ms | < 500ms |

---

## DEPLOYMENT PROCEDURES

### Pre-Deployment Checklist
- [ ] Database backup created and verified
- [ ] Rollback procedure tested
- [ ] Team standing by
- [ ] Monitoring alerts configured
- [ ] Communication channel active

### Deployment Steps
```bash
# 1. Maintenance mode
export MAINTENANCE_MODE=1

# 2. Deploy code
git pull origin main
npm install --production

# 3. Verify startup
npm start &

# 4. Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/tuitions

# 5. Monitor (30 min)
tail -f logs/application.log
```

### Rollback if Needed
```bash
# 1. Alert team
# 2. Switch traffic to MongoDB backend
export DB_DRIVER=mongoose
npm restart
# 3. Investigate logs
# 4. Restore from backup if needed
```

---

## DEPLOYMENT SUCCESS CRITERIA

✅ **Migration is Successful When:**

```
Data Integrity:
✓ All record counts match MongoDB
✓ No orphaned foreign keys
✓ All relationships intact

Functionality:
✓ All 40-50 API endpoints working
✓ Authentication/authorization functional
✓ Complex queries return correct data
✓ All CRUD operations working

Performance:
✓ Average query time < 100ms
✓ Complex joins < 500ms
✓ Response time degradation < 10%
✓ No connection pool issues

Stability:
✓ Error rate < 0.1%
✓ 99.9% uptime first week
✓ No unhandled exceptions
✓ No user-reported critical issues

Operations:
✓ Automated backups working
✓ Monitoring alerts active
✓ Team trained
✓ Documentation updated
```

---

## QUICK START COMMANDS

### Setup
```bash
cd backend
npm install sequelize mssql tedious
cp .env.example .env
# Update .env with MSSQL credentials
```

### Database Setup
```bash
# Copy schema from MSSQL Schema section
# Paste into MSSQL Management Studio
# Click Execute

# Verify
sqlcmd -S localhost -U sa -P password -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"
```

### Start Development
```bash
npm start
# Test with curl http://localhost:5000/health
```

### Run Tests
```bash
npm test
npm test -- tests/models/
npm test -- tests/controllers/
```

---

## TROUBLESHOOTING

### Connection Error
```
Solution: Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
Test: Verify MSSQL service running, firewall rules correct
```

### Type Mismatch Error
```
Solution: Verify field names match MSSQL schema (PascalCase)
Example: fullName → FullName, email → Email
```

### FK Constraint Error
```
Solution: Ensure parent record exists before creating child
Check: Table records exist with correct IDs
```

### Slow Queries
```
Solution: Check indexes exist in MSSQL
Run: EXEC sp_helpindex 'Tuitions'
Create: CREATE INDEX IX_Tuitions_Email ON Tuitions(Email)
```

---

## CONCLUSION

This migration represents a strategic move to a **more enterprise-grade, relational database system** while maintaining all existing functionality. With proper planning, testing, and phased deployment, BacheLORE can successfully migrate from MongoDB to MSSQL in **4-5 weeks**.

**Key Success Factors**:
- ✅ Follow phases sequentially
- ✅ Test thoroughly at each phase
- ✅ Keep backups at each step
- ✅ Monitor carefully in production
- ✅ Have rollback plan ready
- ✅ Communicate with team

**Next Step**: Begin Phase 0 pre-migration planning today.

---

**Document Version**: 1.0  
**Created**: March 27, 2026  
**Status**: Ready for Implementation  
**Questions?** Refer to specific sections above

