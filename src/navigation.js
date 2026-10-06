export function parseRoute(hash, caseIds = []) {
  if (hash === '#practice') return { view: 'modes' }
  if (hash === '#learning') return { view: 'learning' }
  if (hash === '#assessment') return { view: 'assessment' }
  if (hash === '#progress') return { view: 'progress' }

  const match = hash?.match(/^#case\/([^/]+)\/(learning|assessment)(?:\/([^/]+))?$/)
  if (match) {
    const caseId = decodeURIComponent(match[1])
    if (caseIds.includes(caseId)) return { view: 'case', caseId, mode: match[2], focusSkill: match[3] ? decodeURIComponent(match[3]) : null }
  }

  return { view: 'home' }
}
