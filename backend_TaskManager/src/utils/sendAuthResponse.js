const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000

const sendAuthResponse = ({ response, statusCode, message, user, token }) => {
  response.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
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
