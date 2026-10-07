export const REMINDER_BASE_URL = 'https://vermillion-starlight-09e40a.netlify.app/TETE/'
export const FREQUENCIES = ['once', 'daily', 'weekly', 'daily-10']
const TARGET_IDS = new Set(['normal-sinus-rhythm', 'sinus-bradycardia', 'sinus-tachycardia', 'rate', 'rhythm', 'axis', 'pWaves', 'pr', 'qrs', 'stt'])

const pad = (value) => String(value).padStart(2, '0')
const localStamp = (date) => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
const utcStamp = (date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
const escapeText = (value) => String(value).replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;')

export function foldLine(line) {
  const chunks = []; let chunk = ''; let bytes = 0
  for (const character of line) {
    const size = new TextEncoder().encode(character).length
    const limit = chunks.length ? 74 : 75
    if (bytes + size > limit) { chunks.push(chunk); chunk = character; bytes = size } else { chunk += character; bytes += size }
  }
  chunks.push(chunk)
  return chunks.join('\r\n ')
}

function parseLocal(dateValue, timeValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) return null
  const [year, month, day] = dateValue.split('-').map(Number); const [hour, minute] = timeValue.split(':').map(Number)
  const value = new Date(year, month - 1, day, hour, minute, 0, 0)
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day || value.getHours() !== hour || value.getMinutes() !== minute) return null
  return value
}

export function reminderLink({ topicId, caseId, skillId }) {
  if (caseId) return `${REMINDER_BASE_URL}#case/${encodeURIComponent(caseId)}/learning${skillId ? `/${encodeURIComponent(skillId)}` : ''}`
  return `${REMINDER_BASE_URL}#learning/topic/${encodeURIComponent(topicId)}`
}

export function createReminderIcs(input, options = {}) {
  const start = parseLocal(input.date, input.time)
  const now = options.now || new Date()
  if (!start) return { ok: false, code: 'invalidDateTime' }
  if (start <= now) return { ok: false, code: 'futureRequired' }
  if (!FREQUENCIES.includes(input.frequency)) return { ok: false, code: 'invalidFrequency' }
  if (!TARGET_IDS.has(input.stableId)) return { ok: false, code: 'invalidTarget' }
  let rule = ''
  if (input.frequency === 'daily' || input.frequency === 'weekly') {
    const end = parseLocal(input.endDate, input.time)
    if (!end || end < start) return { ok: false, code: 'invalidEndDate' }
    rule = `RRULE:FREQ=${input.frequency.toUpperCase()};UNTIL=${localStamp(end)}`
  } else if (input.frequency === 'daily-10') rule = 'RRULE:FREQ=DAILY;COUNT=10'
  const finish = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes() + 5)
  const timeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'
  const uid = options.uid || `${crypto.randomUUID()}@tete.local`
  const title = `Tete: ${input.title}`
  const description = `${input.invitation}\n${input.url}`
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tete//ECG Learning Coach//EN', 'CALSCALE:GREGORIAN', `X-WR-TIMEZONE:${escapeText(timeZone)}`, 'BEGIN:VEVENT', `UID:${escapeText(uid)}`, `DTSTAMP:${utcStamp(now)}`, `DTSTART:${localStamp(start)}`, `DTEND:${localStamp(finish)}`, `SUMMARY:${escapeText(title)}`, `DESCRIPTION:${escapeText(description)}`, `URL:${input.url}`, `X-TETE-TARGET-ID:${input.stableId}`]
  if (rule) lines.push(rule)
  lines.push('BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(title)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR')
  return { ok: true, ics: `${lines.map(foldLine).join('\r\n')}\r\n`, start, timeZone, uid }
}
