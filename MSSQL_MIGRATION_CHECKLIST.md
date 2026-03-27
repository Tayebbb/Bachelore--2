# BacheLORE MSSQL Migration: Comprehensive Checklist

**Project**: BacheLORE - Bachelor Life Management Platform  
**Migration Target**: MongoDB → MSSQL  
**Estimated Timeline**: 4-5 weeks  
**Last Updated**: March 27, 2026

---

## Phase 0: Pre-Migration Planning

### Environment Setup
- [ ] **Database Server Provisioning**
  - [ ] Provision MSSQL Server instance
    - [ ] Local development (for testing)
    - [ ] Staging environment
    - [ ] Production environment
  - [ ] Create database user accounts with appropriate permissions
  - [ ] Configure firewall rules and network access
  - [ ] Set up SSL/TLS for database connections
  - [ ] Test connectivity from development machine

- [ ] **Version Compatibility Check**
  - [ ] MSSQL Server version: 2016+ (recommend 2019+)
  - [ ] Node.js version: 14+
  - [ ] npm/yarn package manager installed

### Documentation & Planning
- [ ] Review full migration analysis report
- [ ] Identify all MongoDB queries across codebase
  - [ ] Read MIGRATION_ANALYSIS_REPORT.md
  - [ ] Read SEQUELIZE_MIGRATION_GUIDE.md
  - [ ] Read IMPLEMENTATION_EXAMPLES.md
- [ ] Create backup of production MongoDB
- [ ] Communicate timeline to stakeholders
- [ ] Plan deployment schedule (off-peak hours)
- [ ] Identify potential rollback procedures

---

## Phase 1: Local Development Setup (Week 1)

### ORM & Dependencies Installation
- [ ] Install Sequelize
  ```bash
  npm install sequelize mssql tedious
  ```
- [ ] Install dev dependencies
  ```bash
  npm install --save-dev @types/sequelize
  ```
- [ ] Update backend/package.json to reflect changes
- [ ] Create `.npmrc` if needed for private packages
- [ ] Verify all node_modules installed correctly
- [ ] Update .gitignore if necessary

### Database Configuration
- [ ] Create `backend/config/database.js`
  - [ ] Set up Sequelize instance
  - [ ] Configure connection pool
  - [ ] Set logging level appropriately
  - [ ] Add error handling
  - [ ] Test local connection
- [ ] Update `.env` with new database credentials
  ```
  DB_HOST=localhost
  DB_PORT=1433
  DB_USER=sa
  DB_PASSWORD=YourPassword
  DB_NAME=BACHELORE_DEV
  ```
- [ ] Create database on MSSQL server
- [ ] Connect to test database and verify connectivity

### Schema Creation
- [ ] Execute full schema SQL script in MSSQL Management Studio
  ```sql
  -- Run the schema from MIGRATION_ANALYSIS_REPORT.md
  ```
- [ ] Verify all 17 tables created
  ```sql
  SELECT COUNT(*) AS TableCount FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = 'dbo';
  ```
- [ ] Verify all foreign keys
  ```sql
  SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE;
  ```
- [ ] Verify all indexes
  ```sql
  SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Users');
  ```
- [ ] Create default indexes for performance
- [ ] Document database schema with comments (optional)

---

## Phase 2: Model Migration (Weeks 1-2)

### User Model
- [ ] Create `backend/models/User.js` (Sequelize)
  - [ ] Define all fields with correct types
  - [ ] Add ENUM constraint for RoommateCategory
  - [ ] Add validations (email format, etc.)
  - [ ] Test field capitalization
  - [ ] Verify primary key (GUID)
  - [ ] Test model creation

### Tuition Service Models
- [ ] Migrate `Tuition.js`
  - [ ] Define all fields
  - [ ] Add phone validation constraint
  - [ ] Test createdAt default
  - [ ] Test index on CreatedAt
- [ ] Migrate `AppliedTuition.js`
  - [ ] Define foreign key relationship to Tuition
  - [ ] Test relationship definitions
  - [ ] Verify cascade delete works
- [ ] Migrate `BookedTuition.js`
  - [ ] Define foreign key relationship
  - [ ] Test all fields populate correctly
  - [ ] Verify no null constraint violations

### Maid Service Models
- [ ] Migrate `Maid.js`
- [ ] Migrate `AppliedMaid.js`
  - [ ] Test FK relationship to Maid
- [ ] Migrate `BookedMaid.js`
  - [ ] Test all fields
  - [ ] Test optional BusyUntil field

### Roommate Models
- [ ] Migrate `RoommateListing.js`
  - [ ] Set up FK relationship to User
- [ ] Migrate `AppliedRoommate.js`
- [ ] Migrate `BookedRoommate.js`
  - [ ] Multiple FK relationships (listing, host, applicant)
  - [ ] Test all relationships work correctly
- [ ] Migrate `AppliedToHost.js`

### House Rent Models
- [ ] Migrate `HouseRentListing.js`
  - [ ] Set up FK relationship to User
  - [ ] Test image array handling
- [ ] Create `HouseRentImage.js` (NEW - normalized table)
  - [ ] Handle array normalization
  - [ ] Test cascading deletes

### Other Models
- [ ] Migrate `MarketplaceListing.js`
  - [ ] Test ENUM for status field
- [ ] Migrate `Announcement.js`
- [ ] Migrate `SubscriptionPayment.js`
  - [ ] Field capitalization for amount/status
- [ ] Migrate `Contact.js`
  - [ ] FK relationships to User (senderId, receiverId)
- [ ] Verify all model relationships defined correctly

### Model Relationship Testing
- [ ] Test User → many relationships
- [ ] Test cascade deletes work
- [ ] Test `.include()` (populate equivalent) works
- [ ] Test `.associations` are recognized
- [ ] Run simple queries on each model

---

## Phase 3: Controller Migration (Weeks 2-3)

### Authentication Controllers
- [ ] Update `signupController.js`
  - [ ] Change `User.findOne({ email })` → `User.findOne({ where: { Email: email } })`
  - [ ] Change `.save()` to `.create()`
  - [ ] Update field names (camelCase → PascalCase)
  - [ ] Test endpoint: POST /api/signup
  - [ ] Verify password hashing works
  - [ ] Test duplicate email validation

- [ ] Update `loginController.js`
  - [ ] Update query syntax
  - [ ] Test password comparison with bcrypt
  - [ ] Test endpoint: POST /api/login
  - [ ] Verify user object returned correctly

### Tuition Controllers
- [ ] Update `tuitionController.js`
  - [ ] Migrate getTuitions() - find + sort
  - [ ] Migrate createTuition() - create with validation
  - [ ] Test GET /api/tuitions
  - [ ] Test POST /api/tuitions (with admin code)
  - [ ] Verify sorting works

- [ ] Update `appliedTuitionController.js`
  - [ ] Migrate all CRUD operations
  - [ ] Test FK relationship to Tuition
  - [ ] Test POST /api/applied-tuitions

- [ ] Update `bookedTuitionController.js`
  - [ ] Migrate getBookedTuitions with population
  - [ ] Test relationships work correctly
  - [ ] Test GET /api/booked-tuitions

### Maid Service Controllers
- [ ] Update `maidController.js`
- [ ] Update `appliedMaidController.js`
- [ ] Update `bookedMaidController.js`
- [ ] Test all maid-related endpoints

### Roommate Controllers
- [ ] Update `roommateController.js`
  - [ ] Complex relationships (multiple users)
  - [ ] Test array data handling if any
  - [ ] Test all roommate endpoints

### House Rent Controllers
- [ ] Update `houseRentController.js`
  - [ ] Handle image array normalization (use HouseRentImage table)
  - [ ] Update image CRUD operations
  - [ ] Test image reading/writing

### Other Controllers
- [ ] Update `adminController.js`
- [ ] Update `announcementController.js`
- [ ] Update `subscriptionController.js`
- [ ] Update `marketplaceController.js`
- [ ] Update `activityController.js` (Contact/messaging)

### Controller Testing Checklist
- [ ] All endpoints return correct status codes (201, 200, 400, 404, 500)
- [ ] Error handling works
- [ ] Field names match MSSQL schema
- [ ] Relationships are properly included/excluded
- [ ] Sorting/pagination works correctly

---

## Phase 4: Data Migration (Week 3)

### Pre-Migration Data Backup
- [ ] Backup MongoDB
  ```
  mongodump --uri="mongodb+srv://..." --out ./mongo_backup
  ```
- [ ] Backup MSSQL (if populated)
  ```sql
  BACKUP DATABASE BACHELORE TO DISK = 'D:\Backups\before_migration.bak'
  ```
- [ ] Verify backups are readable/restorable

### Data Export from MongoDB
- [ ] Create export script (`scripts/exportMongo.js`)
  - [ ] Export all 16-17 collections
  - [ ] Save as JSON files
  - [ ] Verify export file sizes
  ```bash
  node scripts/exportMongo.js
  ```

### Data Transformation
- [ ] Create transformation script (`scripts/transformData.js`)
  - [ ] Convert MongoDB ObjectId → UUID (NEWID())
  - [ ] Convert field names (lowercase → PascalCase)
  - [ ] Convert dates to ISO 8601 format
  - [ ] Normalize array fields (images)
  - [ ] Handle enum values
  - [ ] Validate transformed data

### Data Import to MSSQL
- [ ] Create import script (`scripts/importMssql.js`)
  - [ ] Disable FK constraints
  - [ ] Bulk insert records
  - [ ] Re-enable FK constraints
  - [ ] Verify record counts match
  ```sql
  SELECT 'Users' AS TableName, COUNT(*) AS RecordCount FROM [dbo].[Users]
  UNION ALL
  SELECT 'Tuitions', COUNT(*) FROM [dbo].[Tuitions]
  -- ... etc for all tables
  ```

### Post-Migration Data Validation
- [ ] Verify all record counts match MongoDB
- [ ] Check for orphaned foreign keys
  ```sql
  -- Example: Check for AppliedTuitions without Tuition
  SELECT * FROM [dbo].[AppliedTuitions] apt
  LEFT JOIN [dbo].[Tuitions] t ON apt.TuitionId = t.TuitionId
  WHERE t.TuitionId IS NULL;
  ```
- [ ] Sample data integrity checks (random rows)
- [ ] Verify no duplicate records
- [ ] Test data relationships

### Migration Script Cleanup
- [ ] Delete export files after validation
- [ ] Backup migration scripts for rollback procedures
- [ ] Document any data transformations performed

---

## Phase 5: Testing (Week 4)

### Unit Testing
- [ ] Create test suite for models
  ```bash
  npm test -- models/
  ```
- [ ] Create test suite for controllers
  ```bash
  npm test -- controllers/
  ```
- [ ] Verify all unit tests pass

### Integration Testing
- [ ] Test complete user journey
  - [ ] User signup → Login → Browse services → Apply/Book
- [ ] Test all API endpoints
  - [ ] GET endpoints (list, detail)
  - [ ] POST endpoints (create)
  - [ ] PUT endpoints (update, if any)
  - [ ] DELETE endpoints
- [ ] Test error scenarios
  - [ ] Invalid inputs
  - [ ] Missing required fields
  - [ ] Authorization failures
  - [ ] Database errors

### Functional Test Checklist

#### Authentication
- [ ] Signup with valid data works
- [ ] Signup with duplicate email fails
- [ ] Signup validation catches weak passwords
- [ ] Login with correct credentials works
- [ ] Login with wrong password fails
- [ ] Admin authentication works

#### Tuitions
- [ ] List all tuitions (sorted by date)
- [ ] Create tuition with admin code
- [ ] Apply for tuition
- [ ] Get booked tuitions with relationships
- [ ] Cannot create tuition without admin code

#### Maids
- [ ] List all maids
- [ ] Create maid service
- [ ] Apply for maid service
- [ ] Book maid service

#### Roommates
- [ ] Create roommate listing
- [ ] Search roommate listings
- [ ] Apply to roommate listing
- [ ] Complex relationships work

#### House Rent
- [ ] List house rentals
- [ ] Create with images (normalized storage)
- [ ] Query houses with image relationships
- [ ] Verify image array works

#### Marketplace
- [ ] List marketplace items
- [ ] Create listing
- [ ] Update item status (available → sold)
- [ ] Query by status

#### General
- [ ] Announcements CRUD
- [ ] Subscription payments track correctly
- [ ] Activity/messaging works
- [ ] All timestamps are in UTC

### Performance Testing
- [ ] Query response time < 100ms (average)
- [ ] Complex queries with joins < 500ms
- [ ] Load test: 100 concurrent users
- [ ] Check database connection pool usage

### Stress Testing
- [ ] 1000+ concurrent requests
- [ ] Database response under load
- [ ] No memory leaks observed
- [ ] Proper error handling under stress

---

## Phase 6: Staging Deployment (Week 4-5)

### Staging Environment Setup
- [ ] Provision staging MSSQL database
- [ ] Deploy backend code to staging
- [ ] Configure environment variables
- [ ] Set up logging and monitoring
- [ ] Create staging deployment checklist

### Smoke Testing
- [ ] Health endpoint responds (GET /health)
- [ ] Can create user
- [ ] Can login
- [ ] Can access services
- [ ] All API endpoints reachable
- [ ] No uncaught exceptions in logs

### Staging Data
- [ ] Load test data (100+ records per table)
- [ ] Test with realistic data volumes
- [ ] Verify performance remains acceptable

### User Acceptance Testing (UAT)
- [ ] Stakeholder sign-off on staging environment
- [ ] Test all critical user workflows
- [ ] Document any issues found
- [ ] Get approval to proceed to production

---

## Phase 7: Production Deployment (Week 5)

### Pre-Deployment Checklist
- [ ] Final backup of MongoDB and MSSQL
- [ ] Deployment window scheduled (off-peak)
- [ ] Rollback procedure documented
- [ ] Team on standby
- [ ] Monitoring alerts configured
- [ ] Communication channel established (Slack/Teams)

### Deployment Steps
- [ ] Set maintenance mode (optional)
- [ ] Deploy backend code to production
- [ ] Update environment variables
  - [ ] DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
  - [ ] JWT_SECRET, ADMIN_CODE (if changed)
- [ ] Restart backend application
- [ ] Verify application starts successfully
- [ ] Run smoke tests
- [ ] Monitor error logs (first 1 hour)

### Post-Deployment Verification
- [ ] All API endpoints responding
- [ ] No 5xx errors in logs
- [ ] Database connections stable
- [ ] Response times acceptable
- [ ] User authentication working
- [ ] Sample transactions processing correctly

### Post-Deployment Monitoring (24-48 hours)
- [ ] Monitor error rates
- [ ] Monitor response times/latency
- [ ] Monitor database connection pool
- [ ] Monitor CPU/memory usage
- [ ] Monitor disk space
- [ ] Check user-reported issues
- [ ] Monitor log files for warnings

---

## Phase 8: Cleanup & Optimization (Post-Deployment)

### MongoDB Decommissioning
- [ ] Confirm all data migrated successfully
- [ ] Keep MongoDB backup for 30 days (insurance)
- [ ] Document MongoDB connection strings
- [ ] Archive MongoDB configuration
- [ ] Notify team of MongoDB deprecation
- [ ] Free up MongoDB infrastructure costs

### MSSQL Optimization
- [ ] Review query performance metrics
- [ ] Add missing indexes if needed
- [ ] Update statistics
- [ ] Archive/compress old data (optional)
- [ ] Set up automated backups
- [ ] Configure maintenance jobs

### Code Cleanup
- [ ] Remove MongoDB/Mongoose references
- [ ] Remove migration scripts from production
- [ ] Clean up old config files
- [ ] Update documentation
- [ ] Remove legacy code paths

### Documentation Updates
- [ ] Update system architecture documentation
- [ ] Update database schema documentation
- [ ] Update deployment procedures
- [ ] Create runbook for operations team
- [ ] Document any gotchas encountered

### Monitoring Setup
- [ ] Set up database monitoring alerts
- [ ] Configure query performance alerts
- [ ] Set up backup verification alerts
- [ ] Document all alerts
- [ ] Train operations team

---

## Rollback Procedures

### If Migration Fails During Testing
- [ ] Restore MSSQL from backup
- [ ] Fix identified issues
- [ ] Retry data migration
- [ ] Re-test before retry

### If Production Deployment Fails
1. **Immediate Actions**
   - [ ] Notify all stakeholders
   - [ ] Route traffic back to MongoDB/old backend
   - [ ] Establish war room channel

2. **Investigation**
   - [ ] Collect error logs from MSSQL backend
   - [ ] Analyze failure cause
   - [ ] Determine if data integrity affected

3. **Restoration**
   - [ ] Restore from backup if needed
   - [ ] Verify MongoDB consistency
   - [ ] Restart MongoDB backend

4. **Post-Incident**
   - [ ] Conduct root cause analysis
   - [ ] Document lessons learned
   - [ ] Fix identified issues
   - [ ] Schedule retry migration

---

## File Checklist

### Generated During Migration
- [ ] `backend/config/database.js` - Sequelize configuration
- [ ] `tests/` - Test suite files
- [ ] `scripts/` - Migration scripts (export, transform, import)
- [ ] `.env` - Updated with MSSQL credentials
- [ ] `migrations/` - (Optional: Sequelize migration files)

### Documentation Generated
- [ ] `MIGRATION_ANALYSIS_REPORT.md` ✓
- [ ] `SEQUELIZE_MIGRATION_GUIDE.md` ✓
- [ ] `IMPLEMENTATION_EXAMPLES.md` ✓
- [ ] `MSSQL_Migration_Checklist.md` (this file) ✓
- [ ] `ROLLBACK_PROCEDURES.md` (optional)
- [ ] `MONITORING_SETUP.md` (optional)

---

## Success Criteria

The migration is considered **SUCCESSFUL** when:

✅ **Data Integrity**
- [ ] All data migrated from MongoDB to MSSQL
- [ ] Record counts match (within tolerance)
- [ ] No orphaned foreign keys
- [ ] All relationships intact

✅ **Functionality**
- [ ] All API endpoints working
- [ ] Authentication/authorization working
- [ ] All CRUD operations functional
- [ ] Complex searches/filters work

✅ **Performance**
- [ ] Average query time < 100ms
- [ ] Complex joins < 500ms
- [ ] Response time degradation < 10% vs MongoDB
- [ ] No connection pool exhaustion

✅ **Stability**
- [ ] No unhandled exceptions
- [ ] Error rate < 0.1%
- [ ] 99.9% uptime in first 48 hours
- [ ] No user-reported critical issues

✅ **Operations**
- [ ] Automated backups working
- [ ] Monitoring alerts functioning
- [ ] Team trained on new system
- [ ] Documentation updated

---

## Sign-off

**Project Lead**: _____________________ Date: ______

**Database Admin**: _____________________ Date: ______

**Backend Lead**: _____________________ Date: ______

**QA Lead**: _____________________ Date: ______

---

## Notes & Issues Log

### Issue #1: [Date]
- **Description**: 
- **Status**: 
- **Resolution**: 

### Issue #2: [Date]
- **Description**: 
- **Status**: 
- **Resolution**: 

---

**For ongoing updates, keep this checklist in the project repository and reference it regularly throughout the migration process.**
