const getHealthStatus = (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'Team Task Manager API is running.',
    timestamp: new Date().toISOString(),
  })
}

export { getHealthStatus }
