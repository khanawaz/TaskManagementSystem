const getMemberUserId = (member) => {
  if (!member?.user) {
    return null
  }

  if (typeof member.user === 'string') {
    return member.user
  }

  if (member.user._id) {
    return member.user._id.toString()
  }

  return member.user.toString()
}

const isProjectAdmin = (project, userId, globalRole) => {
  if (globalRole === 'admin') {
    return true
  }

  return project.members.some(
    (member) => getMemberUserId(member) === userId && member.role === 'admin',
  )
}

const canAccessProject = (project, userId, globalRole) => {
  if (globalRole === 'admin') {
    return true
  }

  return project.members.some((member) => getMemberUserId(member) === userId)
}

export { canAccessProject, getMemberUserId, isProjectAdmin }
