import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT);
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_JWT_EXPIRES_IN = process.env.ACCESS_JWT_EXPIRES_IN;
const REFRESH_JWT_EXPIRES_IN = process.env.REFRESH_JWT_EXPIRES_IN;

export async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePasswords(password, hash) {
  return await bcrypt.compare(password, hash);
}

export async function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {expiresIn: ACCESS_JWT_EXPIRES_IN});
}

export async function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {expiresIn: REFRESH_JWT_EXPIRES_IN});
}

export async function verifyToken(token) {
  if(!token?.startsWith('Bearer ')){
    return null;
  }
  token = token.split(' ')[1];
  try{
    return jwt.verify(token, JWT_SECRET);
  }
  catch(err){
    console.log(err); // TODO: Remove this line
    return null;
  }
}




