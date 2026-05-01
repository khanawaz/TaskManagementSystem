const notFoundHandler = (request, response) => {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  })
}

const errorHandler = (error, _request, response, _next) => {
  const statusCode = error.statusCode || 500

  response.status(statusCode).json({
    success: false,
    message: error.message || 'Something went wrong on the server.',
  })
}

export { errorHandler, notFoundHandler }
