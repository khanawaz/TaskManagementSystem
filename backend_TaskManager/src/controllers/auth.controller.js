import bcrypt from 'bcryptjs'
import { z } from 'zod'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'
import sendAuthResponse from '../utils/sendAuthResponse.js'

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.'),
})

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

const toSafeUser = (userDocument) => ({
  id: userDocument._id,
  name: userDocument.name,
  email: userDocument.email,
  role: userDocument.role,
  createdAt: userDocument.createdAt,
})

const signup = async (request, response, next) => {
  try {
    const validatedData = signupSchema.parse(request.body)
    const existingUser = await User.findOne({ email: validatedData.email })

    if (existingUser) {
      return response.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    const userCount = await User.countDocuments()
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const user = await User.create({
      ...validatedData,
      password: hashedPassword,
      role: userCount === 0 ? 'admin' : 'member',
    })

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    })

    sendAuthResponse({
      response,
      statusCode: 201,
      message: 'Account created successfully.',
      user: toSafeUser(user),
      token,
    })
  } catch (error) {
    next(error)
  }
}

const login = async (request, response, next) => {
  try {
    const validatedData = loginSchema.parse(request.body)

    const user = await User.findOne({ email: validatedData.email })

    if (!user) {
      return response.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password,
    )

    if (!isPasswordValid) {
      return response.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    })

    sendAuthResponse({
      response,
      statusCode: 200,
      message: 'Logged in successfully.',
      user: toSafeUser(user),
      token,
    })
  } catch (error) {
    next(error)
  }
}

const getCurrentUser = async (request, response) => {
  response.status(200).json({
    success: true,
    user: toSafeUser(request.user),
  })
}

const logout = async (_request, response) => {
  response.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  response.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  })
}

export { getCurrentUser, login, logout, signup }
