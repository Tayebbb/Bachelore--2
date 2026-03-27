import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exportRoot = process.env.MONGO_EXPORT_DIR || path.resolve(__dirname, '../data/mongo-export');

function toId(value) {
  return value ? String(value) : null;
}

function toEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function readJsonCollection(baseDir, names) {
  for (const name of names) {
    const fullPath = path.join(baseDir, `${name}.json`);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // try next candidate
    }
  }
  return [];
}

async function main() {
  const transaction = await db.sequelize.transaction();
  const idMap = {
    users: new Map(),
    tuitions: new Map(),
    maids: new Map(),
    roommateListings: new Map(),
    appliedTuitions: new Map(),
    appliedMaids: new Map(),
    appliedRoommates: new Map(),
    appliedToHosts: new Map(),
  };

  try {
    await db.sequelize.authenticate();

    if (process.env.RESET_DATA === 'true') {
      await db.sequelize.sync({ force: true, transaction });
    } else {
      await db.sequelize.sync({ alter: true, transaction });
    }

    const [
      users,
      announcements,
      tuitions,
      maids,
      roommateListings,
      houseRentListings,
      marketplaceListings,
      subscriptionPayments,
      appliedTuitions,
      bookedTuitions,
      appliedMaids,
      bookedMaids,
      appliedRoommates,
      appliedToHosts,
      bookedRoommates,
      contacts,
    ] = await Promise.all([
      readJsonCollection(exportRoot, ['users']),
      readJsonCollection(exportRoot, ['announcements']),
      readJsonCollection(exportRoot, ['tuitions']),
      readJsonCollection(exportRoot, ['maids']),
      readJsonCollection(exportRoot, ['roommatelistings', 'roommateListings']),
      readJsonCollection(exportRoot, ['houserentlistings', 'houseRentListings']),
      readJsonCollection(exportRoot, ['marketplacelistings', 'marketplaceListings']),
      readJsonCollection(exportRoot, ['subscriptionpayments', 'subscriptionPayments']),
      readJsonCollection(exportRoot, ['appliedtuitions', 'appliedTuitions']),
      readJsonCollection(exportRoot, ['bookedtuitions', 'bookedTuitions']),
      readJsonCollection(exportRoot, ['appliedmaids', 'appliedMaids']),
      readJsonCollection(exportRoot, ['bookedmaids', 'bookedMaids']),
      readJsonCollection(exportRoot, ['appliedroommates', 'appliedRoommates']),
      readJsonCollection(exportRoot, ['appliedtohosts', 'appliedToHosts']),
      readJsonCollection(exportRoot, ['bookedroommates', 'bookedRoommates']),
      readJsonCollection(exportRoot, ['contacts']),
    ]);

    const userRows = users.map((row) => {
      const userId = uuidv4();
      idMap.users.set(toId(row._id), userId);
      return {
        UserId: userId,
        FullName: row.fullName || row.FullName || '',
        Email: toEmail(row.email || row.Email),
        Password: row.password || row.Password || 'migrated_password',
        Phone: row.phone || row.Phone || '',
        University: row.university || row.University || 'Unknown',
        Year: row.year || row.Year || 'Unknown',
        Semester: row.semester || row.Semester || 'Unknown',
        EduEmail: row.eduEmail || row.EduEmail || row.email || row.Email || '',
        RoommateCategory: row.roommateCategory || row.RoommateCategory || 'SeekerRoommate',
        IsAvailableAsHost: Boolean(row.isAvailableAsHost ?? row.IsAvailableAsHost),
        Role: row.role === 'Admin' || row.Role === 'Admin' ? 'Admin' : 'User',
      };
    });

    if (userRows.length) await db.User.bulkCreate(userRows, { transaction });

    if (announcements.length) {
      await db.Announcement.bulkCreate(
        announcements.map((row) => ({
          AnnouncementId: uuidv4(),
          Title: row.title || row.Title || 'Announcement',
          Message: row.message || row.Message || '',
          Author: row.author || row.Author || 'system',
        })),
        { transaction },
      );
    }

    const tuitionRows = tuitions.map((row) => {
      const tuitionId = uuidv4();
      idMap.tuitions.set(toId(row._id), tuitionId);
      return {
        TuitionId: tuitionId,
        Title: row.title || row.Title || 'Tuition',
        Subject: row.subject || row.Subject || 'General',
        Days: row.days || row.Days || 'N/A',
        Salary: row.salary || row.Salary || 'Negotiable',
        Location: row.location || row.Location || 'N/A',
        Description: row.description || row.Description || '',
        Contact: row.contact || row.Contact || '',
        PostedBy: row.postedBy || row.PostedBy || null,
        IsActive: true,
      };
    });
    if (tuitionRows.length) await db.Tuition.bulkCreate(tuitionRows, { transaction });

    const maidRows = maids.map((row) => {
      const maidId = uuidv4();
      idMap.maids.set(toId(row._id), maidId);
      return {
        MaidId: maidId,
        Name: row.name || row.Name || 'Maid',
        HourlyRate: row.hourlyRate || row.HourlyRate || 'Negotiable',
        Location: row.location || row.Location || '',
        Description: row.description || row.Description || '',
        Contact: row.contact || row.Contact || '',
        IsActive: true,
      };
    });
    if (maidRows.length) await db.Maid.bulkCreate(maidRows, { transaction });

    const roommateRows = roommateListings.map((row) => {
      const listingId = uuidv4();
      idMap.roommateListings.set(toId(row._id), listingId);
      return {
        RoommateListingId: listingId,
        UserId: idMap.users.get(toId(row.userRef || row.UserId)) || null,
        Name: row.name || row.Name || 'Host',
        Email: toEmail(row.email || row.Email),
        Contact: row.contact || row.Contact || '',
        Location: row.location || row.Location || '',
        RoomsAvailable: row.roomsAvailable || row.RoomsAvailable || '',
        Details: row.details || row.Details || '',
        IsActive: true,
      };
    });
    if (roommateRows.length) await db.RoommateListing.bulkCreate(roommateRows, { transaction });

    if (houseRentListings.length) {
      const listings = [];
      const images = [];
      for (const row of houseRentListings) {
        const listingId = uuidv4();
        listings.push({
          HouseRentListingId: listingId,
          OwnerUserId: idMap.users.get(toId(row.ownerRef || row.OwnerUserId)) || null,
          Title: row.title || row.Title || 'House Listing',
          Description: row.description || row.Description || '',
          Location: row.location || row.Location || '',
          Price: row.price || row.Price || null,
          Rooms: row.rooms || row.Rooms || null,
          Contact: row.contact || row.Contact || '',
          Verified: Boolean(row.verified ?? row.Verified),
        });

        if (Array.isArray(row.images || row.Images)) {
          let idx = 0;
          for (const imageUrl of row.images || row.Images) {
            if (!imageUrl) continue;
            images.push({
              HouseRentImageId: uuidv4(),
              HouseRentListingId: listingId,
              ImageUrl: imageUrl,
              SortOrder: idx,
            });
            idx += 1;
          }
        }
      }
      if (listings.length) await db.HouseRentListing.bulkCreate(listings, { transaction });
      if (images.length) await db.HouseRentImage.bulkCreate(images, { transaction });
    }

    if (marketplaceListings.length) {
      await db.MarketplaceListing.bulkCreate(
        marketplaceListings.map((row) => ({
          MarketplaceListingId: uuidv4(),
          Title: row.title || row.Title || 'Item',
          Description: row.description || row.Description || '',
          Price: row.price || row.Price || 0,
          Image: row.image || row.Image || null,
          Contact: row.contact || row.Contact || '',
          SellerEmail: toEmail(row.sellerEmail || row.SellerEmail),
          BuyerEmail: toEmail(row.buyerEmail || row.BuyerEmail) || null,
          Status: row.status || row.Status || 'available',
        })),
        { transaction },
      );
    }

    if (subscriptionPayments.length) {
      await db.SubscriptionPayment.bulkCreate(
        subscriptionPayments.map((row) => ({
          SubscriptionPaymentId: uuidv4(),
          UserEmail: toEmail(row.userEmail || row.UserEmail),
          Amount: row.amount || row.Amount || 0,
          PaymentMethod: row.paymentMethod || row.PaymentMethod || 'manual',
          TransactionId: row.transactionId || row.TransactionId || null,
          Status: row.status || row.Status || 'pending',
          PaidAt: row.paidAt || row.PaidAt || new Date(),
          Details: row.details || row.Details || null,
        })),
        { transaction },
      );
    }

    if (appliedTuitions.length) {
      const rows = appliedTuitions
        .map((row) => {
        const appliedId = uuidv4();
        const tuitionId = idMap.tuitions.get(toId(row.tuitionId || row.TuitionId));
        if (!tuitionId) return null;
        idMap.appliedTuitions.set(toId(row._id), appliedId);
        return {
          AppliedTuitionId: appliedId,
          TuitionId: tuitionId,
          Name: row.name || row.Name || '',
          Email: toEmail(row.email || row.Email),
          Contact: row.contact || row.Contact || '',
          Message: row.message || row.Message || '',
          Status: row.status || row.Status || 'Pending',
        };
      })
        .filter(Boolean);
      await db.AppliedTuition.bulkCreate(rows, { transaction });
    }

    if (bookedTuitions.length) {
      await db.BookedTuition.bulkCreate(
        bookedTuitions.map((row) => ({
          BookedTuitionId: uuidv4(),
          AppliedTuitionId:
            idMap.appliedTuitions.get(toId(row.appliedTuitionId || row.AppliedTuitionId || row.appliedTuitionRef)) || null,
          TuitionId: idMap.tuitions.get(toId(row.tuitionId || row.TuitionId)) || null,
          Title: row.title || row.Title || 'Tuition',
          Subject: row.subject || row.Subject || 'General',
          Days: row.days || row.Days || 'N/A',
          Salary: row.salary || row.Salary || 'Negotiable',
          Location: row.location || row.Location || 'N/A',
          Description: row.description || row.Description || '',
          Contact: row.contact || row.Contact || '',
          ApplicantName: row.applicantName || row.ApplicantName || row.name || '',
          ApplicantEmail: toEmail(row.applicantEmail || row.ApplicantEmail || row.email),
          ApplicantContact: row.applicantContact || row.ApplicantContact || row.contact || '',
          Message: row.message || row.Message || '',
          Status: row.status || row.Status || 'Booked',
          BookedAt: row.bookedAt || row.BookedAt || new Date(),
        })),
        { transaction },
      );
    }

    if (appliedMaids.length) {
      const rows = appliedMaids
        .map((row) => {
        const appliedId = uuidv4();
        const maidId = idMap.maids.get(toId(row.maidId || row.MaidId));
        if (!maidId) return null;
        idMap.appliedMaids.set(toId(row._id), appliedId);
        return {
          AppliedMaidId: appliedId,
          MaidId: maidId,
          Name: row.name || row.Name || '',
          Email: toEmail(row.email || row.Email),
          Contact: row.contact || row.Contact || '',
          Message: row.message || row.Message || '',
          Status: row.status || row.Status || 'Pending',
        };
      })
        .filter(Boolean);
      await db.AppliedMaid.bulkCreate(rows, { transaction });
    }

    if (bookedMaids.length) {
      await db.BookedMaid.bulkCreate(
        bookedMaids.map((row) => ({
          BookedMaidId: uuidv4(),
          AppliedMaidId:
            idMap.appliedMaids.get(toId(row.appliedMaidId || row.AppliedMaidId || row.appliedMaidRef)) || null,
          MaidId: idMap.maids.get(toId(row.maidId || row.MaidId)) || null,
          Name: row.name || row.Name || 'Maid',
          HourlyRate: row.hourlyRate || row.HourlyRate || 'Negotiable',
          Location: row.location || row.Location || '',
          Contact: row.contact || row.Contact || '',
          ApplicantName: row.applicantName || row.ApplicantName || row.name || '',
          ApplicantEmail: toEmail(row.applicantEmail || row.ApplicantEmail || row.email),
          ApplicantContact: row.applicantContact || row.ApplicantContact || row.contact || '',
          Message: row.message || row.Message || '',
          Status: row.status || row.Status || 'Booked',
          BookedAt: row.bookedAt || row.BookedAt || new Date(),
        })),
        { transaction },
      );
    }

    if (appliedRoommates.length) {
      const rows = appliedRoommates.map((row) => {
        const appliedId = uuidv4();
        idMap.appliedRoommates.set(toId(row._id), appliedId);
        return {
          AppliedRoommateId: appliedId,
          UserId: idMap.users.get(toId(row.userRef || row.UserId)) || null,
          Name: row.name || row.Name || '',
          Email: toEmail(row.email || row.Email),
          Contact: row.contact || row.Contact || '',
          Location: row.location || row.Location || '',
          RoomsAvailable: row.roomsAvailable || row.RoomsAvailable || '',
          Message: row.message || row.Message || '',
          Status: row.status || row.Status || 'Pending',
        };
      });
      await db.AppliedRoommate.bulkCreate(rows, { transaction });
    }

    if (appliedToHosts.length) {
      const rows = appliedToHosts
        .map((row) => {
        const appliedId = uuidv4();
        const roommateListingId = idMap.roommateListings.get(toId(row.roommateListingId || row.RoommateListingId));
        if (!roommateListingId) return null;
        idMap.appliedToHosts.set(toId(row._id), appliedId);
        return {
          AppliedToHostId: appliedId,
          RoommateListingId: roommateListingId,
          ApplicantUserId: idMap.users.get(toId(row.applicantUserId || row.ApplicantUserId || row.userRef)) || null,
          Name: row.name || row.Name || '',
          Email: toEmail(row.email || row.Email),
          Message: row.message || row.Message || '',
          Status: row.status || row.Status || 'Pending',
        };
      })
        .filter(Boolean);
      await db.AppliedToHost.bulkCreate(rows, { transaction });
    }

    if (bookedRoommates.length) {
      await db.BookedRoommate.bulkCreate(
        bookedRoommates
          .map((row) => {
          const roommateListingId = idMap.roommateListings.get(toId(row.roommateListingId || row.RoommateListingId));
          if (!roommateListingId) return null;
          return {
          BookedRoommateId: uuidv4(),
          AppliedToHostId: idMap.appliedToHosts.get(toId(row.appliedToHostId || row.AppliedToHostId)) || null,
          AppliedRoommateId: idMap.appliedRoommates.get(toId(row.appliedRoommateId || row.AppliedRoommateId)) || null,
          RoommateListingId: roommateListingId,
          HostUserId: idMap.users.get(toId(row.hostUserId || row.HostUserId)) || null,
          ApplicantUserId: idMap.users.get(toId(row.applicantUserId || row.ApplicantUserId)) || null,
          HostName: row.hostName || row.HostName || '',
          HostEmail: toEmail(row.hostEmail || row.HostEmail),
          HostContact: row.hostContact || row.HostContact || '',
          Location: row.location || row.Location || '',
          RoomsAvailable: row.roomsAvailable || row.RoomsAvailable || '',
          Details: row.details || row.Details || '',
          ApplicantName: row.applicantName || row.ApplicantName || '',
          ApplicantEmail: toEmail(row.applicantEmail || row.ApplicantEmail),
          ApplicantContact: row.applicantContact || row.ApplicantContact || '',
          Message: row.message || row.Message || '',
          Status: row.status || row.Status || 'Booked',
          BookedAt: row.bookedAt || row.BookedAt || new Date(),
          };
        })
          .filter(Boolean),
        { transaction },
      );
    }

    if (contacts.length) {
      await db.Contact.bulkCreate(
        contacts
          .map((row) => {
          const senderUserId = idMap.users.get(toId(row.senderUserId || row.SenderUserId || row.senderRef));
          const receiverUserId = idMap.users.get(toId(row.receiverUserId || row.ReceiverUserId || row.receiverRef));
          if (!senderUserId || !receiverUserId) return null;
          return {
            ContactId: uuidv4(),
            SenderUserId: senderUserId,
            ReceiverUserId: receiverUserId,
            Message: row.message || row.Message || '',
            Status: row.status || row.Status || 'Unread',
          };
        })
          .filter(Boolean),
        { transaction },
      );
    }

    await transaction.commit();
    console.log('Migration completed from JSON export to MSSQL.');
    console.log(`Loaded collections from ${exportRoot}`);
    console.log(`users=${users.length}, tuitions=${tuitions.length}, maids=${maids.length}, roommates=${roommateListings.length}`);
    console.log(`appliedTuitions=${appliedTuitions.length}, bookedTuitions=${bookedTuitions.length}, appliedMaids=${appliedMaids.length}`);
    console.log(`bookedMaids=${bookedMaids.length}, appliedRoommates=${appliedRoommates.length}, appliedToHosts=${appliedToHosts.length}`);
    console.log(`bookedRoommates=${bookedRoommates.length}, contacts=${contacts.length}`);
  } catch (error) {
    await transaction.rollback();
    console.error('Data migration failed:', error.message);
    process.exit(1);
  }
}

main();
