// In-memory persistent fallback store when MongoDB is connecting or offline
// Ensures the student can use the application immediately with zero setup.

export const memUsers = new Map()
export const memTasks = new Map()

let userSeq = 1
let taskSeq = 1

export function createMemUser({ name, email, passwordHash }) {
  const id = `user_${Date.now()}_${userSeq++}`
  const user = {
    _id: id,
    id,
    name,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  memUsers.set(id, user)
  return user
}

export function findMemUserByEmail(email) {
  const normalized = email.toLowerCase()
  for (const user of memUsers.values()) {
    if (user.email === normalized) return user
  }
  return null
}

export function findMemUserById(id) {
  return memUsers.get(id) || null
}

export function createMemTask(taskData) {
  const id = `task_${Date.now()}_${taskSeq++}`
  const task = {
    _id: id,
    id,
    ...taskData,
    completed: taskData.status === 'Completed' || Boolean(taskData.completed),
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  memTasks.set(id, task)
  return task
}

export function getMemTasksByUser(userId) {
  const results = []
  for (const task of memTasks.values()) {
    if (String(task.userId) === String(userId)) {
      results.push(task)
    }
  }
  return results
}

export function updateMemTask(id, userId, updates) {
  const task = memTasks.get(id)
  if (!task || String(task.userId) !== String(userId)) return null

  Object.assign(task, updates, {
    updatedAt: new Date(),
    completed: updates.status === 'Completed' || Boolean(updates.completed),
  })
  memTasks.set(id, task)
  return task
}

export function deleteMemTask(id, userId) {
  const task = memTasks.get(id)
  if (!task || String(task.userId) !== String(userId)) return false
  return memTasks.delete(id)
}
