export type AgencyCatalogArtist = { id: string; name: string; slug: string; city: string | null; genres: string[]; catalogVisible: boolean; eligible: boolean; acceptingRequests: boolean; imageUrl?: string | null; coverUrl?: string | null }
export type AgencyCatalog = { name: string; slug: string; published: boolean; tagline: string | null; bio: string | null; coverUrl: string | null; logoUrl: string | null; contactEmail: string | null; city: string | null; instagramUrl: string | null; websiteUrl: string | null; artists: AgencyCatalogArtist[] }
export function safeAgencyImage(value: string | null | undefined) {
 if (!value) return undefined
 try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined } catch { return undefined }
}
export function agencyCatalogPreview(catalog: AgencyCatalog, visibleIds: string[]) {
 return { ...catalog, artists: catalog.artists.filter(a => a.eligible && visibleIds.includes(a.id)) }
}
