const CACHE_NAME = "managekar-static-v2"
const REMINDER_CACHE = "managekar-reminders-v1"
const REMINDER_SNAPSHOT_PATH = "/__managekar/reminders.json"
const STATIC_ASSETS = [
  "/icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/manifest.json",
]
const NETWORK_FIRST_PATHS = ["/"]
const KEEP_CACHES = [CACHE_NAME, REMINDER_CACHE]
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !KEEP_CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") {
    return
  }
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (NETWORK_FIRST_PATHS.includes(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || Response.error())),
    )
    return
  }

  if (!STATIC_ASSETS.includes(url.pathname)) {
    return
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "managekar-reminders") {
    event.waitUntil(checkReminders())
  }
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "check-reminders") {
    event.waitUntil(checkReminders())
  }
})

function localDateKey(now) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function weekdayName(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number)
  return WEEKDAYS[new Date(year, month - 1, day).getDay()]
}

function localTimeReached(now, reminderTime) {
  const match = String(reminderTime || "00:00")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/)
  if (!match) {
    return true
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    return true
  }
  return now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes
}

function habitScheduled(habit, isoDate, weekStartsOn) {
  if (habit.frequency === "daily") {
    return true
  }
  if (habit.customDays && habit.customDays.length > 0) {
    return habit.customDays.includes(weekdayName(isoDate))
  }
  if (habit.frequency === "weekly") {
    const fallback = weekStartsOn === "sunday" ? "Sunday" : "Monday"
    return weekdayName(isoDate) === fallback
  }
  return false
}

function reminderKey(kind, id, date) {
  return `${kind}:${id}:${date}`
}

async function checkReminders() {
  const cache = await caches.open(REMINDER_CACHE)
  const response = await cache.match(REMINDER_SNAPSHOT_PATH)
  if (!response) {
    return
  }

  let snapshot
  try {
    snapshot = await response.json()
  } catch {
    return
  }

  const settings = snapshot.settings || {}
  const notifications = settings.notifications || {}
  if (!notifications.enabled) {
    return
  }

  const now = new Date()
  const today = localDateKey(now)
  const weekStartsOn = settings.general && settings.general.weekStartsOn === "sunday" ? "sunday" : "monday"
  const fired = new Set(snapshot.firedReminderKeys || [])
  const due = []

  if (notifications.taskReminders) {
    for (const task of snapshot.tasks || []) {
      const dueDate = typeof task.dueDate === "string" ? task.dueDate : ""
      if (task.reminders && !task.completed && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && dueDate <= today) {
        const key = reminderKey("task", task.id, today)
        if (!fired.has(key)) {
          due.push({ kind: "task", title: task.title, key })
        }
      }
    }
  }

  if (notifications.habitReminders) {
    for (const habit of snapshot.habits || []) {
      if (
        habit.reminders &&
        !habit.completedToday &&
        habitScheduled(habit, today, weekStartsOn) &&
        localTimeReached(now, habit.reminderTime || "00:00")
      ) {
        const key = reminderKey("habit", habit.id, today)
        if (!fired.has(key)) {
          due.push({ kind: "habit", title: habit.name, key })
        }
      }
    }
  }

  if (due.length === 0 || typeof self.registration.showNotification !== "function") {
    return
  }

  for (const item of due) {
    await self.registration.showNotification(item.kind === "task" ? "Task due" : "Habit reminder", {
      body: item.title,
      tag: item.key,
    })
    fired.add(item.key)
  }

  snapshot.firedReminderKeys = [...fired]
  await cache.put(
    REMINDER_SNAPSHOT_PATH,
    new Response(JSON.stringify(snapshot), { headers: { "content-type": "application/json" } }),
  )
}
