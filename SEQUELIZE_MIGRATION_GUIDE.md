# Sequelize vs Mongoose: Quick Migration Reference

## Query Operations Cheat Sheet

### Finding Records

```javascript
// ============ MONGOOSE ============
const user = await User.findById(id);
const users = await User.find({ email: 'user@test.com' });
const allUsers = await User.find();
const count = await User.countDocuments();

// ============ SEQUELIZE ============
const user = await User.findByPk(id);
const users = await User.findAll({ where: { Email: 'user@test.com' } });
const allUsers = await User.findAll();
const count = await User.count();
```

### Creating Records

```javascript
// ============ MONGOOSE ============
const user = new User({ fullName, email, password });
await user.save();

// Alternative
const user = await User.create({ fullName, email, password });

// ============ SEQUELIZE ============
const user = await User.create({ FullName: fullName, Email: email, Password: password });
```

### Updating Records

```javascript
// ============ MONGOOSE ============
user.email = 'newemail@test.com';
await user.save();

// Alternative
await User.findByIdAndUpdate(id, { email: 'new@test.com' });

// ============ SEQUELIZE ============
user.Email = 'newemail@test.com';
await user.save();

// Alternative
await User.update({ Email: 'new@test.com' }, { where: { UserId: id } });
```

### Deleting Records

```javascript
// ============ MONGOOSE ============
await User.findByIdAndDelete(id);

// ============ SEQUELIZE ============
await User.destroy({ where: { UserId: id } });
```

### Sorting & Pagination

```javascript
// ============ MONGOOSE ============
const tuitions = await Tuition.find()
  .sort({ createdAt: -1 })
  .limit(10)
  .skip(20);

// ============ SEQUELIZE ============
const tuitions = await Tuition.findAll({
  order: [['CreatedAt', 'DESC']],
  limit: 10,
  offset: 20
});
```

### Filtering with Multiple Conditions

```javascript
// ============ MONGOOSE ============
const listings = await HouseRentListing.find({
  price: { $gte: 5000, $lte: 20000 },
  verified: true
});

// ============ SEQUELIZE ============
const { Op } = require('sequelize');
const listings = await HouseRentListing.findAll({
  where: {
    Price: { [Op.gte]: 5000, [Op.lte]: 20000 },
    Verified: true
  }
});
```

### Working with Relationships

```javascript
// ============ MONGOOSE ============
const booking = await BookedTuition.findById(id).populate('tuitionRef');
const user = await User.findById(id).populate('roommateListings');

// ============ SEQUELIZE ============
const booking = await BookedTuition.findByPk(id, {
  include: [{ association: 'tuition' }]
});
const user = await User.findByPk(id, {
  include: [{ association: 'roommateListings' }]
});
```

### Transactions

```javascript
// ============ MONGOOSE ============
const session = await mongoose.startSession();
session.startTransaction();
try {
  await User.create({ ... }, { session });
  await Tuition.create({ ... }, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
}

// ============ SEQUELIZE ============
const transaction = await sequelize.transaction();
try {
  await User.create({ ... }, { transaction });
  await Tuition.create({ ... }, { transaction });
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
}
```

## Field Naming Convention Changes

| MongoDB | MSSQL | Notes |
|---------|-------|-------|
| `_id` | `UserId`, `TuitionId` | Use table-specific IDs |
| `fullName` | `FullName` | PascalCase for MSSQL |
| `email` | `Email` | PascalCase for MSSQL |
| `createdAt` | `CreatedAt` | Consistent capitalization |
| `tuitionRef` | `TuitionId` | FK column naming |

## Common Mongoose Methods → Sequelize Equivalents

| Mongoose | Sequelize | Notes |
|----------|-----------|-------|
| `.find()` | `.findAll()` | Returns array |
| `.findOne()` | `.findOne()` | Returns single or null |
| `.findById()` | `.findByPk()` | By primary key |
| `.create()` | `.create()` | Create new record |
| `.save()` | `.save()` (after update) | Save changes |
| `.updateOne()` | `.update()` | Update with WHERE clause |
| `.deleteOne()` | `.destroy()` | Delete with WHERE clause |
| `.countDocuments()` | `.count()` | Count matching records |
| `.distinct()` | `.findAll({ attributes: [...], raw: true })` | Distinct values |
| `.populate()` | `.include` (option) | Load related records |
| `.select()` | `.attributes` (option) | Select specific columns |
| `.sort()` | `.order` (option) | Sort results |
| `.limit()` | `.limit` (option) | Limit rows |
| `.skip()` | `.offset` (option) | Pagination offset |
| `.lean()` | `.raw: true` (option) | Plain JS objects |

## Error Handling Differences

```javascript
// ============ MONGOOSE ============
try {
  await user.save();
} catch (err) {
  if (err.code === 11000) {
    // Duplicate key error
  }
  if (err.name === 'ValidationError') {
    // Validation error
  }
}

// ============ SEQUELIZE ============
try {
  await User.create(data);
} catch (err) {
  if (err instanceof UniqueConstraintError) {
    // Duplicate key error
  }
  if (err instanceof ValidationError) {
    // Validation error
  }
}
```

## Connection Management

```javascript
// ============ MONGOOSE ============
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected'))
  .catch(err => console.log(err));

mongoose.disconnect();

// ============ SEQUELIZE ============
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'mssql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  pool: { max: 10, min: 2 }
});

await sequelize.authenticate();

await sequelize.close();
```

## Data Validation

```javascript
// ============ MONGOOSE ============
const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/
  },
  age: {
    type: Number,
    min: 18,
    max: 100
  }
});

// ============ SEQUELIZE ============
const User = sequelize.define('User', {
  Email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  Age: {
    type: DataTypes.INTEGER,
    validate: {
      min: 18,
      max: 100
    }
  }
});
```
