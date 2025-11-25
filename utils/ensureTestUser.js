import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@gmail.com',
    phone: '+1 555 123 9876',
    postcode: 'SW1A 1AA',
    referralCode: 'REF123',
    role: 'client',
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane_pro@example.com',
    phone: '+1 555 987 6543',
    postcode: 'EC1A 1BB',
    referralCode: 'PRO987',
    role: 'professional',
    tradingName: 'Smith Services Ltd',
    townCity: 'London',
    address: '123 High Street',
    travelDistance: '20miles',
  },
];

export async function ensureTestUser() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return;
  }

  console.info('No users found. Seeding sample accounts for testing...');

  const passwordHash = await bcrypt.hash('123456', 12);
  const createdUsers = await User.insertMany(
    sampleUsers.map((user, index) => ({
      ...user,
      passwordHash: index === 0 ? passwordHash : passwordHash,
    }))
  );

  console.info(
    `Seeded ${createdUsers.length} user(s). Login with ${createdUsers[0].email} / 123456`
  );
}




