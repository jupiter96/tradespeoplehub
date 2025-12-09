import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';

export async function ensureAdminUser() {
  const adminCount = await Admin.countDocuments({ role: 'admin' });
  if (adminCount > 0) {
    return;
  }

  console.info('No admin users found. Seeding default admin account...');

  const passwordHash = await bcrypt.hash('123456', 12);

  const createdAdmin = await Admin.create({
    fullname: 'Admin',
    email: 'admin@gmail.com',
    passwordHash,
    role: 'admin',
    permissions: [], // Super admin has empty permissions array
    avatar: null,
  });

  console.info(`Seeded default admin user (${createdAdmin.email} / 123456)`);
}

