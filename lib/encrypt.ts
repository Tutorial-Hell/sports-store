import { compareSync } from 'bcrypt-ts-edge'

export async function compare(password: string, hash: string) {
  return compareSync(password, hash)
}
