import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as process from 'process';

dotenv.config();

export const hashPassword = async (password: string): Promise<string> => {
  const rounds = Number(process.env.SALT_ROUNDS) || 10;
  const salt = await bcrypt.genSalt(rounds);
  return await bcrypt.hash(password, salt);
};

export const checkPassword = (
  candidate: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(candidate, hash);
