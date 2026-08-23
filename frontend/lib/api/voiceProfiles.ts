'use client'

export interface VoiceProfile {
  id: string
  name: string
  role: string
  initials: string
  nfcToken: string
  fundamentalFreq: number // Average pitch in Hz (e.g., 120-255 Hz)
  spectralCentroid: number // Timbre / brightness indicator (Hz)
  avatarColor: string
  enrolledAt: string
  sampleDurationSec?: number
}

// Initial registered profiles for the team
export const DEFAULT_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'vp-kangna',
    name: 'Kangna',
    role: 'Frontend & UX Lead',
    initials: 'KA',
    nfcToken: 'NFC-TAG-7890-KA',
    fundamentalFreq: 215, // Typical female vocal range (180-250 Hz)
    spectralCentroid: 2400,
    avatarColor: 'bg-indigo-600 text-white border-indigo-400',
    enrolledAt: 'Registered',
  },
  {
    id: 'vp-rahul',
    name: 'Rahul',
    role: 'Architect & DB Lead',
    initials: 'RH',
    nfcToken: 'NFC-TAG-4412-RH',
    fundamentalFreq: 125, // Typical male vocal range (90-140 Hz)
    spectralCentroid: 1600,
    avatarColor: 'bg-blue-600 text-white border-blue-400',
    enrolledAt: 'Registered',
  },
  {
    id: 'vp-manit',
    name: 'Manit',
    role: 'AI & Backend Lead',
    initials: 'MA',
    nfcToken: 'NFC-TAG-9931-MA',
    fundamentalFreq: 145, // Baritone-Tenor range (130-165 Hz)
    spectralCentroid: 1850,
    avatarColor: 'bg-purple-600 text-white border-purple-400',
    enrolledAt: 'Registered',
  },
  {
    id: 'vp-priya',
    name: 'Priya',
    role: 'Security & Auth Lead',
    initials: 'PR',
    nfcToken: 'NFC-TAG-3321-PR',
    fundamentalFreq: 235, // Higher pitch female vocal range
    spectralCentroid: 2600,
    avatarColor: 'bg-emerald-600 text-white border-emerald-400',
    enrolledAt: 'Registered',
  },
]

const STORAGE_KEY = 'tandem_voice_profiles'
const ACTIVE_USER_KEY = 'tandem_active_user'

/**
 * Fetch all registered voice profiles
 */
export function getVoiceProfiles(): VoiceProfile[] {
  if (typeof window === 'undefined') return DEFAULT_VOICE_PROFILES
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn('[Tandem] Error reading voice profiles from storage:', e)
  }
  return DEFAULT_VOICE_PROFILES
}

/**
 * Save / Enroll a new voice profile
 */
export function saveVoiceProfile(profile: VoiceProfile): VoiceProfile[] {
  const current = getVoiceProfiles()
  const existsIndex = current.findIndex(p => p.id === profile.id || p.nfcToken === profile.nfcToken)
  let updated: VoiceProfile[]
  if (existsIndex >= 0) {
    updated = current.map((p, idx) => (idx === existsIndex ? profile : p))
  } else {
    updated = [profile, ...current]
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(profile))
    } catch (e) {
      console.warn('[Tandem] Error persisting voice profile:', e)
    }
  }
  return updated
}

/**
 * Get current active logged-in user profile
 */
export function getActiveUser(): VoiceProfile {
  if (typeof window === 'undefined') return DEFAULT_VOICE_PROFILES[0]
  try {
    const stored = localStorage.getItem(ACTIVE_USER_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) {
    console.warn('[Tandem] Error reading active user:', e)
  }
  return DEFAULT_VOICE_PROFILES[0]
}

/**
 * Set active logged-in user
 */
export function setActiveUser(profile: VoiceProfile): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(profile))
    } catch (e) {
      console.warn('[Tandem] Error setting active user:', e)
    }
  }
}

/**
 * High-Precision Acoustic Pitch Analyzer:
 * Extracts fundamental vocal frequency (F0) in the 80Hz - 450Hz human voice range
 * using parabolic peak interpolation and spectral energy centroid calculation.
 */
export function analyzeAudioFrequencies(
  frequencyData: Uint8Array,
  sampleRate: number = 44100
): { fundamentalFreq: number; spectralCentroid: number; energy: number } {
  const bufferLength = frequencyData.length
  if (bufferLength === 0) {
    return { fundamentalFreq: 150, spectralCentroid: 1800, energy: 0 }
  }

  let totalEnergy = 0
  let weightedSum = 0
  let maxVal = 0
  let peakIndex = 0

  const minBin = Math.max(1, Math.floor((80 * bufferLength) / (sampleRate / 2)))
  const maxBin = Math.min(bufferLength - 1, Math.floor((450 * bufferLength) / (sampleRate / 2)))

  for (let i = 0; i < bufferLength; i++) {
    const val = frequencyData[i]
    totalEnergy += val
    const freq = (i * (sampleRate / 2)) / bufferLength
    weightedSum += freq * val

    if (i >= minBin && i <= maxBin && val > maxVal) {
      maxVal = val
      peakIndex = i
    }
  }

  // Parabolic interpolation for sub-bin pitch resolution
  let refinedPeak = peakIndex
  if (peakIndex > minBin && peakIndex < maxBin) {
    const alpha = frequencyData[peakIndex - 1]
    const beta = frequencyData[peakIndex]
    const gamma = frequencyData[peakIndex + 1]
    const denom = alpha - 2 * beta + gamma
    if (denom !== 0) {
      refinedPeak = peakIndex + (0.5 * (alpha - gamma)) / denom
    }
  }

  const spectralCentroid = totalEnergy > 0 ? weightedSum / totalEnergy : 1800
  const fundamentalFreq = (refinedPeak * (sampleRate / 2)) / bufferLength
  const averageEnergy = totalEnergy / bufferLength

  return {
    fundamentalFreq: Math.round(fundamentalFreq) || 150,
    spectralCentroid: Math.round(spectralCentroid) || 1800,
    energy: averageEnergy,
  }
}

/**
 * Match a detected frequency and spectral profile against all registered Voice Profiles.
 * Returns the closest enrolled team member.
 */
export function matchSpeakerByVoiceprint(
  liveFreq: number,
  spectralCentroid: number,
  profiles: VoiceProfile[] = getVoiceProfiles()
): { matchedProfile: VoiceProfile; confidence: number } {
  if (!profiles || profiles.length === 0) {
    return { matchedProfile: DEFAULT_VOICE_PROFILES[0], confidence: 0.85 }
  }

  let bestMatch = profiles[0]
  let smallestDistance = Infinity

  for (const profile of profiles) {
    // Pitch difference weighted 75%, timbre spectral centroid weighted 25%
    const targetF0 = profile.fundamentalFreq || 150
    const targetCentroid = profile.spectralCentroid || 1900
    const freqDiff = Math.abs(liveFreq - targetF0) / targetF0
    const centroidDiff = Math.abs(spectralCentroid - targetCentroid) / targetCentroid
    const distance = freqDiff * 0.75 + centroidDiff * 0.25

    if (distance < smallestDistance) {
      smallestDistance = distance
      bestMatch = profile
    }
  }

  const confidence = Math.max(0.60, Math.min(0.99, 1 - smallestDistance * 0.5))

  return {
    matchedProfile: bestMatch,
    confidence: Number(confidence.toFixed(2)),
  }
}

/**
 * Detects if spoken text explicitly begins with a speaker prefix or name
 * (e.g. "Manit: ...", "Ayyush:", "Kangna: ...", "This is Rahul, ...")
 */
export function parseSpeakerPrefix(
  text: string,
  profiles: VoiceProfile[] = getVoiceProfiles()
): { speakerName: string | null; cleanText: string } {
  const trimmed = text.trim()

  for (const p of profiles) {
    const namePattern = new RegExp(`^(?:this\\s+is\\s+)?${p.name}\\s*[:,-]\\s*`, 'i')
    if (namePattern.test(trimmed)) {
      return {
        speakerName: p.name,
        cleanText: trimmed.replace(namePattern, '').trim(),
      }
    }
  }

  return { speakerName: null, cleanText: trimmed }
}
