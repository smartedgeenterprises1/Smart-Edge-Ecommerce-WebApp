import readline from 'readline';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { createAdminUser } from '../modules/auth/auth.service.js';

function ask(question: string, silent = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (!silent) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
  // Basic silent-ish prompt for password (still echoes on some Windows terminals)
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const email = process.env.ADMIN_EMAIL || (await ask('Admin email: '));
  const fullName = process.env.ADMIN_NAME || (await ask('Admin full name: ')) || 'Store Admin';
  const password = process.env.ADMIN_PASSWORD || (await ask('Admin password (min 8 chars): ', true));
  if (!email || !password || password.length < 8) {
    throw new Error('Email and password (min 8) are required. Prefer env ADMIN_EMAIL / ADMIN_PASSWORD.');
  }
  await connectDatabase();
  const user = await createAdminUser(email, password, fullName);
  console.log(`Admin ready: ${user.email} (${user._id})`);
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
