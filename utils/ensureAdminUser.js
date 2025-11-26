import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function ensureAdminUser() {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount > 0) {
    return;
  }

  console.info('No admin users found. Seeding default admin account...');

  const passwordHash = await bcrypt.hash('123456', 12);

  const createdAdmin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@gmail.com',
    passwordHash,
    role: 'admin',
    phone: '+44 7000 000000',
    postcode: 'SW1A 1AA',
    referralCode: 'ADMIN-REF',
    townCity: 'London',
    address: '1 Admin Street',
    travelDistance: '0miles',
    avatar: null,
  });

  console.info(`Seeded default admin user (${createdAdmin.email} / 123456)`);
}

