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
    UserId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    FullName: { type: DataTypes.STRING(150), allowNull: true },
    Email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    Password: { type: DataTypes.STRING(255), allowNull: false },
    Phone: { type: DataTypes.STRING(30), allowNull: false },
    University: { type: DataTypes.STRING(150), allowNull: false },
    Year: { type: DataTypes.STRING(50), allowNull: false },
    Semester: { type: DataTypes.STRING(50), allowNull: false },
    EduEmail: { type: DataTypes.STRING(150), allowNull: false },
    RoommateCategory: {
      type: DataTypes.ENUM('HostRoommate', 'SeekerRoommate'),
      allowNull: false,
      defaultValue: 'SeekerRoommate',
    },
    IsAvailableAsHost: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    Role: { type: DataTypes.ENUM('Admin', 'User'), allowNull: false, defaultValue: 'User' },
    IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { ...commonModelOptions, tableName: 'Users', indexes: [{ fields: ['Email'] }, { fields: ['Role'] }] },
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
    IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    ...commonModelOptions,
    tableName: 'Tuitions',
    indexes: [{ fields: ['CreatedAt'] }, { fields: ['Location'] }, { fields: ['IsActive'] }],
  },
);

export const AppliedTuition = sequelize.define(
  'AppliedTuition',
  {
    AppliedTuitionId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Name: { type: DataTypes.STRING(150), allowNull: false },
    Email: { type: DataTypes.STRING(150), allowNull: false },
    Contact: { type: DataTypes.STRING(50), allowNull: false },
    Message: { type: DataTypes.TEXT, allowNull: true },
    Status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Booked'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  { ...commonModelOptions, tableName: 'AppliedTuitions', indexes: [{ fields: ['Email'] }, { fields: ['Status'] }] },
);

export const BookedTuition = sequelize.define(
  'BookedTuition',
  {
    BookedTuitionId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Title: { type: DataTypes.STRING(180), allowNull: false },
    Subject: { type: DataTypes.STRING(120), allowNull: false },
    Days: { type: DataTypes.STRING(80), allowNull: false },
    Salary: { type: DataTypes.STRING(80), allowNull: false },
    Location: { type: DataTypes.STRING(180), allowNull: false },
    Description: { type: DataTypes.TEXT, allowNull: false },
    Contact: { type: DataTypes.STRING(150), allowNull: false },
    ApplicantName: { type: DataTypes.STRING(150), allowNull: false },
    ApplicantEmail: { type: DataTypes.STRING(150), allowNull: false },
    ApplicantContact: { type: DataTypes.STRING(50), allowNull: false },
    Message: { type: DataTypes.TEXT, allowNull: true },
    BookedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    Status: { type: DataTypes.ENUM('Booked', 'Completed', 'Cancelled'), allowNull: false, defaultValue: 'Booked' },
  },
  { ...commonModelOptions, tableName: 'BookedTuitions', indexes: [{ fields: ['ApplicantEmail'] }, { fields: ['BookedAt'] }] },
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
    IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { ...commonModelOptions, tableName: 'Maids', indexes: [{ fields: ['IsActive'] }, { fields: ['Location'] }] },
);

export const AppliedMaid = sequelize.define(
  'AppliedMaid',
  {
    AppliedMaidId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Name: { type: DataTypes.STRING(150), allowNull: false },
    Email: { type: DataTypes.STRING(150), allowNull: false },
    Contact: { type: DataTypes.STRING(50), allowNull: false },
    Message: { type: DataTypes.TEXT, allowNull: true },
    Status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Booked'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  { ...commonModelOptions, tableName: 'AppliedMaids', indexes: [{ fields: ['Email'] }, { fields: ['Status'] }] },
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
    ApplicantEmail: { type: DataTypes.STRING(150), allowNull: false },
    ApplicantContact: { type: DataTypes.STRING(50), allowNull: false },
    Message: { type: DataTypes.TEXT, allowNull: true },
    BusyUntil: { type: DataTypes.DATE, allowNull: true },
    BookedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    Status: { type: DataTypes.ENUM('Booked', 'Completed', 'Cancelled'), allowNull: false, defaultValue: 'Booked' },
  },
  { ...commonModelOptions, tableName: 'BookedMaids', indexes: [{ fields: ['ApplicantEmail'] }, { fields: ['BookedAt'] }] },
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
    IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { ...commonModelOptions, tableName: 'RoommateListings', indexes: [{ fields: ['Location'] }, { fields: ['IsActive'] }] },
);

export const AppliedRoommate = sequelize.define(
  'AppliedRoommate',
  {
    AppliedRoommateId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Name: { type: DataTypes.STRING(150), allowNull: true },
    Email: { type: DataTypes.STRING(150), allowNull: true },
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
  { ...commonModelOptions, tableName: 'AppliedRoommates', indexes: [{ fields: ['Email'] }, { fields: ['Status'] }] },
);

export const AppliedToHost = sequelize.define(
  'AppliedToHost',
  {
    AppliedToHostId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Name: { type: DataTypes.STRING(150), allowNull: true },
    Email: { type: DataTypes.STRING(150), allowNull: true },
    Message: { type: DataTypes.TEXT, allowNull: true },
    Status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Booked'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  { ...commonModelOptions, tableName: 'AppliedToHosts', indexes: [{ fields: ['Email'] }, { fields: ['Status'] }] },
);

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
    ApplicantEmail: { type: DataTypes.STRING(150), allowNull: false },
    ApplicantContact: { type: DataTypes.STRING(80), allowNull: true },
    Message: { type: DataTypes.TEXT, allowNull: true },
    BookedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    Status: { type: DataTypes.ENUM('Booked', 'Completed', 'Cancelled'), allowNull: false, defaultValue: 'Booked' },
  },
  { ...commonModelOptions, tableName: 'BookedRoommates', indexes: [{ fields: ['ApplicantEmail'] }, { fields: ['BookedAt'] }] },
);

export const HouseRentListing = sequelize.define(
  'HouseRentListing',
  {
    HouseRentListingId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Title: { type: DataTypes.STRING(180), allowNull: false },
    Description: { type: DataTypes.TEXT, allowNull: true },
    Location: { type: DataTypes.STRING(180), allowNull: true },
    Price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    Rooms: { type: DataTypes.INTEGER, allowNull: true },
    Contact: { type: DataTypes.STRING(150), allowNull: true },
    Verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    ...commonModelOptions,
    tableName: 'HouseRentListings',
    indexes: [{ fields: ['Verified'] }, { fields: ['Location'] }, { fields: ['Price'] }],
  },
);

export const HouseRentImage = sequelize.define(
  'HouseRentImage',
  {
    HouseRentImageId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ImageUrl: { type: DataTypes.STRING(512), allowNull: false },
    SortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { ...commonModelOptions, tableName: 'HouseRentImages' },
);

export const Contact = sequelize.define(
  'Contact',
  {
    ContactId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Message: { type: DataTypes.TEXT, allowNull: false },
    Status: { type: DataTypes.ENUM('Unread', 'Read', 'Archived'), allowNull: false, defaultValue: 'Unread' },
  },
  { ...commonModelOptions, tableName: 'Contacts', indexes: [{ fields: ['Status'] }] },
);

export const MarketplaceListing = sequelize.define(
  'MarketplaceListing',
  {
    MarketplaceListingId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    Title: { type: DataTypes.STRING(180), allowNull: false },
    Description: { type: DataTypes.TEXT, allowNull: false },
    Price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    Image: { type: DataTypes.STRING(512), allowNull: true },
    Contact: { type: DataTypes.STRING(150), allowNull: false },
    SellerEmail: { type: DataTypes.STRING(150), allowNull: false },
    BuyerEmail: { type: DataTypes.STRING(150), allowNull: true },
    Status: { type: DataTypes.ENUM('available', 'sold'), allowNull: false, defaultValue: 'available' },
  },
  {
    ...commonModelOptions,
    tableName: 'MarketplaceListings',
    indexes: [{ fields: ['Status'] }, { fields: ['SellerEmail'] }, { fields: ['BuyerEmail'] }],
  },
);

export const SubscriptionPayment = sequelize.define(
  'SubscriptionPayment',
  {
    SubscriptionPaymentId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    UserEmail: { type: DataTypes.STRING(150), allowNull: false },
    Amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    PaymentMethod: { type: DataTypes.STRING(80), allowNull: false },
    TransactionId: { type: DataTypes.STRING(150), allowNull: true },
    Status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    PaidAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    Details: { type: DataTypes.JSON, allowNull: true },
  },
  { ...commonModelOptions, tableName: 'SubscriptionPayments', indexes: [{ fields: ['UserEmail'] }, { fields: ['Status'] }] },
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

  RoommateListing.hasMany(AppliedToHost, {
    foreignKey: { name: 'RoommateListingId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  AppliedToHost.belongsTo(RoommateListing, {
    foreignKey: { name: 'RoommateListingId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  User.hasMany(AppliedToHost, {
    foreignKey: { name: 'ApplicantUserId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  AppliedToHost.belongsTo(User, {
    foreignKey: { name: 'ApplicantUserId', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

  AppliedToHost.hasOne(BookedRoommate, {
    foreignKey: { name: 'AppliedToHostId', allowNull: true, unique: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  BookedRoommate.belongsTo(AppliedToHost, {
    foreignKey: { name: 'AppliedToHostId', allowNull: true, unique: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

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

  HouseRentListing.hasMany(HouseRentImage, {
    foreignKey: { name: 'HouseRentListingId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  HouseRentImage.belongsTo(HouseRentListing, {
    foreignKey: { name: 'HouseRentListingId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  User.hasMany(Contact, {
    foreignKey: { name: 'SenderUserId', allowNull: false },
    as: 'SentContacts',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Contact.belongsTo(User, {
    foreignKey: { name: 'SenderUserId', allowNull: false },
    as: 'Sender',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  User.hasMany(Contact, {
    foreignKey: { name: 'ReceiverUserId', allowNull: false },
    as: 'ReceivedContacts',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Contact.belongsTo(User, {
    foreignKey: { name: 'ReceiverUserId', allowNull: false },
    as: 'Receiver',
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
  AppliedToHost,
  BookedRoommate,
  HouseRentListing,
  HouseRentImage,
  Contact,
  MarketplaceListing,
  SubscriptionPayment,
  Notification,
};

export default db;
