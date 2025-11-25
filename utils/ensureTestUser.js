import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';

const firstNames = ['Liam', 'Emma', 'Noah', 'Olivia', 'Mason', 'Ava', 'Ethan', 'Mia'];
const lastNames = ['Walker', 'Gray', 'Reed', 'Parker', 'Bailey', 'Cooper', 'Brooks', 'Hayes'];
const towns = ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Bristol', 'Leeds'];
const streets = ['High Street', 'Station Road', 'Church Lane', 'Victoria Road', 'Oak Avenue'];

const randomFrom = (array) => array[Math.floor(Math.random() * array.length)];
const randomHouseNumber = () => Math.floor(Math.random() * 200) + 1;
const randomPhoneNumber = () => `+44 7${Math.floor(100000000 + Math.random() * 900000000)}`;
const randomReferralCode = () => `REF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

export async function ensureTestUser() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return;
  }

  console.info('No users found. Seeding default account for testing...');

  const passwordHash = await bcrypt.hash('123456', 12);

  const createdUser = await User.create({
    firstName: randomFrom(firstNames),
    lastName: randomFrom(lastNames),
    email: 'lakee@gmail.com',
    passwordHash,
    role: 'client',
    phone: randomPhoneNumber(),
    postcode: 'SW1A 1AA',
    referralCode: randomReferralCode(),
    townCity: randomFrom(towns),
    address: `${randomHouseNumber()} ${randomFrom(streets)}`,
    travelDistance: '15miles',
    avatar: null,
  });

  console.info(`Seeded default user (${createdUser.email} / 123456)`);
}