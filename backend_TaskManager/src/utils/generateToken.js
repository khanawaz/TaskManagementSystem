import jwt from 'jsonwebtoken'

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is missing from environment variables.')
  }

  return jwt.sign(payload, secret, {
    expiresIn: '7d',
  })
}

export default generateToken
