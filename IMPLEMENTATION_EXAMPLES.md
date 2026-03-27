# BacheLORE: Migration Implementation Examples

## Example 1: User Authentication (signup/login)

### BEFORE: Mongoose Implementation

**File**: `backend/controllers/signupController.js`

```javascript
import User from "../models/User.js";
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, university, year, semester, eduEmail, phone } = req.body;
    
    // Validation logic...
    if (!fullName || !email || !password || !university || !year || !semester || !eduEmail || !phone) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      password: hashed,
      university,
      year,
      semester,
      eduEmail,
      phone
    });
    const saved = await newUser.save();
    res.status(201).json({ msg: "User registered successfully", user: { id: saved._id, email: saved.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### AFTER: Sequelize Implementation

```javascript
import User from "../models/User.js";
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, university, year, semester, eduEmail, phone } = req.body;
    
    // Validation logic... (same)
    if (!fullName || !email || !password || !university || !year || !semester || !eduEmail || !phone) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    // Check existing user
    const existingUser = await User.findOne({ where: { Email: email } });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    // Hash password and create user
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

**Key Changes**:
- `await User.findOne({ email })` → `await User.findOne({ where: { Email: email } })`
- `new User({ ... });` + `.save()` → `.create({ ... })`
- Field names: `fullName` → `FullName`, `_id` → `UserId`

---

## Example 2: Tuition Management

### BEFORE: Mongoose - Get All Tuitions

```javascript
import Tuition from '../models/Tuition.js';

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
    // Admin check
    const authHeader = req.headers.authorization || '';
    let isAdmin = false;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload && payload.role === 'admin') isAdmin = true;
      } catch (err) { /* invalid token */ }
    }
    const adminCode = req.body.adminCode || req.query.adminCode;
    if (!isAdmin && adminCode !== ADMIN_CODE) {
      return res.status(403).json({ msg: 'Forbidden: Admins only' });
    }
    
    const { title, subject, days, salary, location, description, contact } = req.body;
    
    // Validation...
    if (!title || !subject || !days || !salary || !location || !description || !contact) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    
    const tuition = new Tuition({
      title,
      subject,
      days,
      salary,
      location,
      description,
      contact,
      postedBy: 'admin'
    });
    await tuition.save();
    res.status(201).json({ msg: 'Tuition posted', tuition });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### AFTER: Sequelize Implementation

```javascript
import Tuition from '../models/Tuition.js';
import jwt from 'jsonwebtoken';

const ADMIN_CODE = process.env.ADMIN_CODE || 'choton2025';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

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
    // Admin check (same logic)
    const authHeader = req.headers.authorization || '';
    let isAdmin = false;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload && payload.role === 'admin') isAdmin = true;
      } catch (err) { /* invalid token */ }
    }
    const adminCode = req.body.adminCode || req.query.adminCode;
    if (!isAdmin && adminCode !== ADMIN_CODE) {
      return res.status(403).json({ msg: 'Forbidden: Admins only' });
    }
    
    const { title, subject, days, salary, location, description, contact } = req.body;
    
    // Validation...
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

**Key Changes**:
- `.find().sort()` → `.findAll({ order: [...] })`
- `.new()` + `.save()` → `.create()`
- Field capitalization

---

## Example 3: Relationships - Booked Tuitions with References

### BEFORE: Mongoose with Populate

```javascript
import BookedTuition from '../models/BookedTuition.js';

export const getBookedTuitionDetails = async (req, res) => {
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
```

### AFTER: Sequelize with Include

```javascript
import BookedTuition from '../models/BookedTuition.js';
import Tuition from '../models/Tuition.js';

export const getBookedTuitionDetails = async (req, res) => {
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
```

**Model Association** (in Sequelize model definition):

```javascript
// models/BookedTuition.js
BookedTuition.belongsTo(Tuition, { 
  foreignKey: 'TuitionRef', 
  as: 'tuition' 
});

// models/Tuition.js
Tuition.hasMany(BookedTuition, { 
  foreignKey: 'TuitionRef' 
});
```

---

## Example 4: Complex Query - Filtering Listings

### BEFORE: Mongoose

```javascript
import RoommateListing from '../models/RoommateListing.js';

export const searchListings = async (req, res) => {
  try {
    const { location, minRooms, maxPrice } = req.query;
    
    const filter = {};
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minRooms) filter.roomsAvailable = { $gte: parseInt(minRooms) };
    if (maxPrice) filter.price = { $lte: parseInt(maxPrice) };
    
    const listings = await RoommateListing.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### AFTER: Sequelize with Operators

```javascript
import RoommateListing from '../models/RoommateListing.js';
import { Op } = 'sequelize';

export const searchListings = async (req, res) => {
  try {
    const { location, minRooms, maxPrice } = req.query;
    
    const where = {};
    if (location) {
      where.Location = { [Op.like]: `%${location}%` }; // LIKE for case-insensitive
    }
    if (minRooms) {
      where.RoomsAvailable = { [Op.gte]: parseInt(minRooms) };
    }
    if (maxPrice) {
      where.Price = { [Op.lte]: parseInt(maxPrice) };
    }
    
    const listings = await RoommateListing.findAll({
      where,
      order: [['CreatedAt', 'DESC']],
      limit: 20
    });
    
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

**Sequelize Operators**:
- `Op.eq` = (equals)
- `Op.ne` ≠ (not equals)
- `Op.like` ~ (string match)
- `Op.in` (in array)
- `Op.lte` ≤ (less than or equal)
- `Op.gte` ≥ (greater than or equal)

---

## Example 5: Creating Related Records

### BEFORE: Mongoose - Apply for Tuition

```javascript
import AppliedTuition from '../models/AppliedTuition.js';
import Tuition from '../models/Tuition.js';

export const applyTuition = async (req, res) => {
  try {
    const { tuitionId, name, email, contact, message } = req.body;
    
    // Verify tuition exists
    const tuition = await Tuition.findById(tuitionId);
    if (!tuition) {
      return res.status(404).json({ msg: 'Tuition not found' });
    }
    
    // Create application
    const application = new AppliedTuition({
      tuitionId,
      name,
      email,
      contact,
      message
    });
    await application.save();
    
    res.status(201).json({ 
      msg: 'Application submitted', 
      application 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### AFTER: Sequelize with Transaction

```javascript
import AppliedTuition from '../models/AppliedTuition.js';
import Tuition from '../models/Tuition.js';
import sequelize from '../config/database.js';

export const applyTuition = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { tuitionId, name, email, contact, message } = req.body;
    
    // Verify tuition exists (with transaction)
    const tuition = await Tuition.findByPk(tuitionId, { transaction });
    if (!tuition) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Tuition not found' });
    }
    
    // Create application (with transaction)
    const application = await AppliedTuition.create({
      TuitionId: tuitionId,
      Name: name,
      Email: email,
      Contact: contact,
      Message: message
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    res.status(201).json({ 
      msg: 'Application submitted', 
      application 
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};
```

---

## Example 6: Updating with Partial Data

### BEFORE: Mongoose

```javascript
import User from '../models/User.js';

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body; // Only passed fields to update
    
    // Find and update
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({ msg: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### AFTER: Sequelize

```javascript
import User from '../models/User.js';

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body; // Only passed fields to update
    
    // Convert field names from camelCase to PascalCase
    const mappedData = {
      FullName: updateData.fullName,
      Phone: updateData.phone,
      Year: updateData.year,
      Semester: updateData.semester,
      // Only include fields that were actually provided
    };
    
    // Remove undefined values
    Object.keys(mappedData).forEach(key => 
      mappedData[key] === undefined && delete mappedData[key]
    );
    
    // Update
    await User.update(mappedData, { where: { UserId: userId } });
    
    // Fetch updated record
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

---

## Example 7: Deleting with Cascade

### BEFORE: MongoDB/Mongoose (Implicit)

```javascript
import Tuition from '../models/Tuition.js';
import AppliedTuition from '../models/AppliedTuition.js';

export const deleteTuition = async (req, res) => {
  try {
    const { tuitionId } = req.params;
    
    // Manual cascade delete (MongoDB doesn't enforce FKs)
    await AppliedTuition.deleteMany({ tuitionId });
    await Tuition.findByIdAndDelete(tuitionId);
    
    res.json({ msg: 'Tuition deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### AFTER: Sequelize (Database Enforced)

```javascript
import Tuition from '../models/Tuition.js';

export const deleteTuition = async (req, res) => {
  try {
    const { tuitionId } = req.params;
    
    // Cascade delete is handled by database (ON DELETE CASCADE)
    await Tuition.destroy({ where: { TuitionId: tuitionId } });
    
    res.json({ msg: 'Tuition deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

## Migration Checklist by File

### Controllers to Update

**Priority 1 (CRUD Heavy)**
- [ ] `signupController.js`
- [ ] `loginController.js`
- [ ] `tuitionController.js`
- [ ] `maidController.js`

**Priority 2 (Moderate)**
- [ ] `roommateController.js`
- [ ] `houseRentController.js`
- [ ] `bookedTuitionController.js`
- [ ] `bookedMaidController.js`

**Priority 3 (Lower Priority)**
- [ ] `announcementController.js`
- [ ] `subscriptionController.js`
- [ ] `adminController.js`
- [ ] `marketplaceController.js`
- [ ] `activityController.js`

### Models to Create

**File Structure**:
```
backend/models/
├── User.js
├── Tuition.js
├── AppliedTuition.js
├── BookedTuition.js
├── Maid.js
├── AppliedMaid.js
├── BookedMaid.js
├── RoommateListing.js
├── AppliedRoommate.js
├── BookedRoommate.js
├── HouseRentListing.js
├── HouseRentImage.js          (NEW - normalized)
├── MarketplaceListing.js
├── Announcement.js
├── SubscriptionPayment.js
├── Contact.js
└── AppliedToHost.js
```

### Config Files to Create

- [ ] `backend/config/database.js` - Sequelize initialization
- [ ] `.env` - Update with MSSQL connection strings
- [ ] Scripts for data migration if needed

---

## Quick Testing Strategy

```javascript
// tests/controllers/tuition.test.js
import request from 'supertest';
import app from '../../index.js';

describe('Tuition Controller', () => {
  test('GET /api/tuitions should return array', async () => {
    const res = await request(app).get('/api/tuitions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/tuitions should create tuition', async () => {
    const res = await request(app)
      .post('/api/tuitions')
      .send({
        title: 'Math Tuition',
        subject: 'Calculus',
        adminCode: 'choton2025',
        // ... other fields
      });
    expect(res.status).toBe(201);
    expect(res.body.tuition.TuitionId).toBeDefined();
  });
});
```

---

**This guide provides concrete before/after examples for all major controller patterns used in BacheLORE. Use these as templates for migrating remaining controllers.**
