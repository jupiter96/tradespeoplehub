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
    name: 'Admin User',
    email: 'admin@gmail.com',
    passwordHash,
    role: 'admin',
  });

  console.info(`Seeded default admin user (${createdAdmin.email} / 123456)`);
}

