import { DataTypes } from 'sequelize';
import sequelize from './database.js';

const commonModelOptions = {
  freezeTableName: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
};

export const User = sequelize.define(
  'User',
  {
    user_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, field: 'user_id' },
    name: { type: DataTypes.STRING(150), allowNull: true, field: 'name' },
    email: { type: DataTypes.STRING(150), allowNull: false, field: 'email' },
    password_hash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
    role: { type: DataTypes.STRING(20), allowNull: false, field: 'role', defaultValue: 'student' },
    created_at: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
  },
  { tableName: 'Users', timestamps: false, indexes: [{ fields: ['email'] }, { fields: ['role'] }], sync: { alter: false } },
);

export const Announcement = sequelize.define(
  'Announcement',
  {
    AnnouncementId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Title: { type: DataTypes.STRING(200), allowNull: false },
    Message: { type: DataTypes.TEXT, allowNull: false },
    Author: { type: DataTypes.STRING(150), allowNull: true },
  },
  { ...commonModelOptions, tableName: 'Announcements' },
);

export const Tuition = sequelize.define(
  'Tuition',
  {
    TuitionId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Title: { type: DataTypes.STRING(180), allowNull: false },
    Subject: { type: DataTypes.STRING(120), allowNull: false },
    Days: { type: DataTypes.STRING(80), allowNull: false },
    Salary: { type: DataTypes.STRING(80), allowNull: false },
    Location: { type: DataTypes.STRING(180), allowNull: false },
    Description: { type: DataTypes.TEXT, allowNull: false },
    Contact: { type: DataTypes.STRING(150), allowNull: false },
    PostedBy: { type: DataTypes.STRING(150), allowNull: true },
  },
  {
    tableName: 'Tuitions',
    timestamps: false,
    indexes: [{ fields: ['Location'] }],
  },
);

export const AppliedTuition = sequelize.define(
  'AppliedTuition',
  {
    application_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, field: 'application_id' },
    tuition_id: { type: DataTypes.UUID, allowNull: false, field: 'tuition_id' },
    user_id: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    status: { type: DataTypes.STRING(50), allowNull: false, field: 'status' },
    applied_at: { type: DataTypes.DATE, allowNull: false, field: 'applied_at' },
  },
  { ...commonModelOptions, tableName: 'AppliedTuitions', indexes: [{ fields: ['status'] }] },
);

export const BookedTuition = sequelize.define(
  'BookedTuition',
  {
    booking_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, field: 'booking_id' },
    application_id: { type: DataTypes.UUID, allowNull: false, field: 'application_id' },
    confirmed_at: { type: DataTypes.DATE, allowNull: true, field: 'confirmed_at' },
  },
  { tableName: 'BookedTuitions', timestamps: false },
);


export const Maid = sequelize.define(
  'Maid',
  {
    MaidId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Name: { type: DataTypes.STRING(150), allowNull: false },
    HourlyRate: { type: DataTypes.STRING(80), allowNull: false },
    Location: { type: DataTypes.STRING(180), allowNull: true },
    Description: { type: DataTypes.TEXT, allowNull: true },
    Contact: { type: DataTypes.STRING(150), allowNull: true },
    CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { ...commonModelOptions, tableName: 'Maids', indexes: [{ fields: ['Location'] }] },
);

export const AppliedMaid = sequelize.define(
  'AppliedMaid',
  {
    AppliedMaidId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    MaidId: { type: DataTypes.UUID, allowNull: false },
    Name: { type: DataTypes.STRING(150), allowNull: false },
    Contact: { type: DataTypes.STRING(80), allowNull: false },
    Message: { type: DataTypes.TEXT, allowNull: true },
    Status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Booked'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { ...commonModelOptions, tableName: 'AppliedMaids', indexes: [{ fields: ['Status'] }] },
);

export const BookedMaid = sequelize.define(
  'BookedMaid',
  {
    BookedMaidId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Name: { type: DataTypes.STRING(150), allowNull: false },
    HourlyRate: { type: DataTypes.STRING(80), allowNull: false },
    Location: { type: DataTypes.STRING(180), allowNull: true },
    Contact: { type: DataTypes.STRING(150), allowNull: true },
    ApplicantName: { type: DataTypes.STRING(150), allowNull: false },
    ApplicantContact: { type: DataTypes.STRING(50), allowNull: false },
    Message: { type: DataTypes.TEXT, allowNull: true },
    BusyUntil: { type: DataTypes.DATE, allowNull: true },
    Status: { type: DataTypes.ENUM('Booked', 'Completed', 'Cancelled'), allowNull: false, defaultValue: 'Booked' },
  },
  { ...commonModelOptions, tableName: 'BookedMaids' },
);

export const RoommateListing = sequelize.define(
  'RoommateListing',
  {
    RoommateListingId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Name: { type: DataTypes.STRING(150), allowNull: false },
    Email: { type: DataTypes.STRING(150), allowNull: true },
    Contact: { type: DataTypes.STRING(80), allowNull: true },
    Location: { type: DataTypes.STRING(180), allowNull: true },
    RoomsAvailable: { type: DataTypes.STRING(50), allowNull: true },
    Details: { type: DataTypes.TEXT, allowNull: true },
  },
  { ...commonModelOptions, tableName: 'RoommateListings', indexes: [{ fields: ['Location'] }] },
);

export const AppliedRoommate = sequelize.define(
  'AppliedRoommate',
  {
    AppliedRoommateId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Name: { type: DataTypes.STRING(150), allowNull: true },
    Contact: { type: DataTypes.STRING(80), allowNull: true },
    Location: { type: DataTypes.STRING(180), allowNull: true },
    RoomsAvailable: { type: DataTypes.STRING(50), allowNull: true },
    Message: { type: DataTypes.TEXT, allowNull: true },
    Status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Booked'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  { ...commonModelOptions, tableName: 'AppliedRoommates', indexes: [{ fields: ['Status'] }] },
);


// Removed AppliedToHost model because no such table exists in the database.

export const BookedRoommate = sequelize.define(
  'BookedRoommate',
  {
    BookedRoommateId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    HostName: { type: DataTypes.STRING(150), allowNull: true },
    HostEmail: { type: DataTypes.STRING(150), allowNull: true },
    HostContact: { type: DataTypes.STRING(80), allowNull: true },
    Location: { type: DataTypes.STRING(180), allowNull: true },
    RoomsAvailable: { type: DataTypes.STRING(50), allowNull: true },
    Details: { type: DataTypes.TEXT, allowNull: true },
    ApplicantName: { type: DataTypes.STRING(150), allowNull: false },
    ApplicantContact: { type: DataTypes.STRING(80), allowNull: true },
    Message: { type: DataTypes.TEXT, allowNull: true },
    Status: { type: DataTypes.ENUM('Booked', 'Completed', 'Cancelled'), allowNull: false, defaultValue: 'Booked' },
  },
  { ...commonModelOptions, tableName: 'BookedRoommates' },
);

export const HouseRentListing = sequelize.define(
  'HouseRentListing',
  {
    HouseRentListingId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Title: { type: DataTypes.STRING(180), allowNull: false },
    Description: { type: DataTypes.TEXT, allowNull: true },
    Location: { type: DataTypes.STRING(180), allowNull: true },
    Rooms: { type: DataTypes.INTEGER, allowNull: true },
    Contact: { type: DataTypes.STRING(150), allowNull: true },
  },
  {
    ...commonModelOptions,
    tableName: 'HouseRentListings',
    indexes: [{ fields: ['Location'] }],
  },
);


// Removed HouseRentImage model because no such table exists in the database.


// Removed Contact model because no such table exists in the database.

export const MarketplaceListing = sequelize.define(
  'MarketplaceListing',
  {
    MarketplaceListingId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Title: { type: DataTypes.STRING(180), allowNull: false },
    Description: { type: DataTypes.TEXT, allowNull: false },
    Price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    Image: { type: DataTypes.STRING(512), allowNull: true },
    Contact: { type: DataTypes.STRING(150), allowNull: false },
    Status: { type: DataTypes.ENUM('available', 'sold'), allowNull: false, defaultValue: 'available' },
  },
  {
    ...commonModelOptions,
    tableName: 'MarketplaceListings',
    indexes: [{ fields: ['Status'] }],
  },
);

export const SubscriptionPayment = sequelize.define(
  'SubscriptionPayment',
  {
    payment_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, field: 'payment_id' },
    user_id: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'amount' },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending', field: 'status' },
    payment_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'payment_date' },
    payment_ref: { type: DataTypes.STRING(50), allowNull: true, field: 'payment_ref' },
  },
  { tableName: 'SUBSCRIPTIONPAYMENTS', timestamps: false, indexes: [{ fields: ['status'] }, { fields: ['user_id'] }], freezeTableName: true },
);

export const Notification = sequelize.define(
  'Notification',
  {
    NotificationId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    UserEmail: { type: DataTypes.STRING(150), allowNull: false },
    Title: { type: DataTypes.STRING(180), allowNull: false },
    Message: { type: DataTypes.TEXT, allowNull: false },
    Type: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'info' },
    IsRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { ...commonModelOptions, tableName: 'Notifications', indexes: [{ fields: ['UserEmail'] }, { fields: ['IsRead'] }] },
);

export function applyAssociations() {
  User.hasMany(RoommateListing, {
    foreignKey: { name: 'UserId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  RoommateListing.belongsTo(User, {
    foreignKey: { name: 'UserId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  User.hasMany(AppliedRoommate, {
    foreignKey: { name: 'UserId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  AppliedRoommate.belongsTo(User, {
    foreignKey: { name: 'UserId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  Tuition.hasMany(AppliedTuition, {
    foreignKey: { name: 'TuitionId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  AppliedTuition.belongsTo(Tuition, {
    foreignKey: { name: 'TuitionId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  AppliedTuition.hasOne(BookedTuition, {
    foreignKey: { name: 'AppliedTuitionId', allowNull: false, unique: true },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  BookedTuition.belongsTo(AppliedTuition, {
    foreignKey: { name: 'AppliedTuitionId', allowNull: false, unique: true },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Tuition.hasMany(BookedTuition, {
    foreignKey: { name: 'TuitionId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  BookedTuition.belongsTo(Tuition, {
    foreignKey: { name: 'TuitionId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  Maid.hasMany(AppliedMaid, {
    foreignKey: { name: 'MaidId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  AppliedMaid.belongsTo(Maid, {
    foreignKey: { name: 'MaidId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  AppliedMaid.hasOne(BookedMaid, {
    foreignKey: { name: 'AppliedMaidId', allowNull: false, unique: true },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  BookedMaid.belongsTo(AppliedMaid, {
    foreignKey: { name: 'AppliedMaidId', allowNull: false, unique: true },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Maid.hasMany(BookedMaid, {
    foreignKey: { name: 'MaidId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  BookedMaid.belongsTo(Maid, {
    foreignKey: { name: 'MaidId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });


  // Removed all associations to AppliedToHost since the table/model does not exist.

  AppliedRoommate.hasOne(BookedRoommate, {
    foreignKey: { name: 'AppliedRoommateId', allowNull: true, unique: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  BookedRoommate.belongsTo(AppliedRoommate, {
    foreignKey: { name: 'AppliedRoommateId', allowNull: true, unique: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  RoommateListing.hasMany(BookedRoommate, {
    foreignKey: { name: 'RoommateListingId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  BookedRoommate.belongsTo(RoommateListing, {
    foreignKey: { name: 'RoommateListingId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  User.hasMany(BookedRoommate, {
    foreignKey: { name: 'HostUserId', allowNull: true },
    as: 'HostedRoommateBookings',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  BookedRoommate.belongsTo(User, {
    foreignKey: { name: 'HostUserId', allowNull: true },
    as: 'Host',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  User.hasMany(BookedRoommate, {
    foreignKey: { name: 'ApplicantUserId', allowNull: true },
    as: 'AppliedRoommateBookings',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  BookedRoommate.belongsTo(User, {
    foreignKey: { name: 'ApplicantUserId', allowNull: true },
    as: 'Applicant',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  User.hasMany(HouseRentListing, {
    foreignKey: { name: 'OwnerUserId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  HouseRentListing.belongsTo(User, {
    foreignKey: { name: 'OwnerUserId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });


  // Removed all associations to HouseRentImage since the table/model does not exist.


  // Removed all associations to Contact since the table/model does not exist.

  User.hasMany(SubscriptionPayment, {
    foreignKey: { name: 'UserId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  SubscriptionPayment.belongsTo(User, {
    foreignKey: { name: 'UserId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
}

applyAssociations();

export const db = {
  sequelize,
  User,
  Announcement,
  Tuition,
  AppliedTuition,
  BookedTuition,
  Maid,
  AppliedMaid,
  BookedMaid,
  RoommateListing,
  AppliedRoommate,
  BookedRoommate,
  HouseRentListing,
  MarketplaceListing,
  SubscriptionPayment,
  Notification,
};

export default db;
