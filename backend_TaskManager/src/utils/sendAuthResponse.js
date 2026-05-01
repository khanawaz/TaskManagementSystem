const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000

const sendAuthResponse = ({ response, statusCode, message, user, token }) => {
  const isProduction = process.env.NODE_ENV === 'production'

  response.cookie('token', token, {
    httpOnly: true,
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: sevenDaysInMs,
  })

  response.status(statusCode).json({
    success: true,
    message,
    token,
    user,
  })
}

export default sendAuthResponse
