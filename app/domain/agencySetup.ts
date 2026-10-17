export type AgencySetupInput = {
  agency: { name: string; bio: string | null; contactEmail: string | null }
  artist: { id: string; name: string; bio: string | null; city: string | null; genres: string[] } | null
  receivingReady: boolean
  hasBooking: boolean
}

export function agencySetupProgress(input: AgencySetupInput) {
  const agencyReady = Boolean(input.agency.name.trim() && input.agency.bio?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.agency.contactEmail?.trim() || ''))
  const artistReady = Boolean(input.artist?.name.trim() && input.artist.bio?.trim() && input.artist.city?.trim() && input.artist.genres.length)
  const receivingReady = input.receivingReady
  return {
    show: !input.hasBooking,
    agencyReady,
    artistReady,
    receivingReady,
    completed: Number(agencyReady) + Number(artistReady) + Number(receivingReady),
    artistId: input.artist?.id || '',
    canCapture: Boolean(input.artist)
  }
}
