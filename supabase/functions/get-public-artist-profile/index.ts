import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

async function serviceJson<T>(url: string, init: RequestInit, serviceKey: string): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`supabase_${response.status}:${text.slice(0, 500)}`);
  return (text ? JSON.parse(text) : null) as T;
}

function storagePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function signArtistMedia(supabaseUrl: string, serviceKey: string, path: string | null) {
  if (!path) return null;
  try {
    const result = await serviceJson<{ signedURL?: string; signedUrl?: string }>(
      `${supabaseUrl}/storage/v1/object/sign/artist-media/${storagePath(path)}`,
      {
        method: "POST",
        body: JSON.stringify({ expiresIn: 3600 })
      },
      serviceKey
    );
    const signedPath = result.signedURL || result.signedUrl;
    if (!signedPath) return null;
    if (/^https?:\/\//.test(signedPath)) return signedPath;
    return `${supabaseUrl}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
  } catch (error) {
    console.warn("get-public-artist-profile media signing failed", path, error);
    return null;
  }
}


type PublicCueIdConfig = {
  schemaVersion: 1;
  family: "club_minimal";
  base: "masculine" | "feminine" | "neutral";
  build: "slim" | "regular" | "strong";
  outfit: "tank" | "tee" | "hoodie" | "bomber";
  accessory: "headphones" | "cap" | "glasses" | null;
  pose: "neutral" | "relaxed" | "focused" | "editorial";
  material: "matte" | "satin";
  accent: "lime" | "red" | null;
};

function sanitizeCueIdConfig(value: unknown): PublicCueIdConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const config = value as Record<string, unknown>;
  const bases = new Set(["masculine", "feminine", "neutral"]);
  const builds = new Set(["slim", "regular", "strong"]);
  const outfits = new Set(["tank", "tee", "hoodie", "bomber"]);
  const accessories = new Set(["headphones", "cap", "glasses"]);
  const poses = new Set(["neutral", "relaxed", "focused", "editorial"]);
  const materials = new Set(["matte", "satin"]);
  const accents = new Set(["lime", "red"]);

  if (config.schemaVersion !== 1 || config.family !== "club_minimal") return null;
  if (typeof config.base !== "string" || !bases.has(config.base)) return null;
  if (typeof config.build !== "string" || !builds.has(config.build)) return null;
  if (typeof config.outfit !== "string" || !outfits.has(config.outfit)) return null;
  if (config.accessory !== null && (typeof config.accessory !== "string" || !accessories.has(config.accessory))) return null;
  if (typeof config.pose !== "string" || !poses.has(config.pose)) return null;
  if (typeof config.material !== "string" || !materials.has(config.material)) return null;
  if (config.accent !== null && (typeof config.accent !== "string" || !accents.has(config.accent))) return null;

  return {
    schemaVersion: 1,
    family: "club_minimal",
    base: config.base as PublicCueIdConfig["base"],
    build: config.build as PublicCueIdConfig["build"],
    outfit: config.outfit as PublicCueIdConfig["outfit"],
    accessory: config.accessory as PublicCueIdConfig["accessory"],
    pose: config.pose as PublicCueIdConfig["pose"],
    material: config.material as PublicCueIdConfig["material"],
    accent: config.accent as PublicCueIdConfig["accent"]
  };
}


type PublicPassportMilestone = {
  id: string;
  title: string;
  subtitle: string;
};

type PublicPassportMedia = {
  id: string;
  bookingId: string;
  mediaType: "image" | "video" | "reel";
  permalink: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  capturedAt: string | null;
};

type BookingPassportRow = {
  id: string;
  city: string | null;
  country_code: string | null;
  venue_name: string | null;
  event_date: string | null;
};

function normalizeLabel(value: string | null | undefined) {
  return value?.trim() || "";
}

function safePublicUrl(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function uniqueLabels(values: Array<string | null | undefined>) {
  const seen = new Map<string, string>();
  for (const value of values) {
    const label = normalizeLabel(value);
    if (!label) continue;
    const key = label.toLocaleLowerCase();
    if (!seen.has(key)) seen.set(key, label);
  }
  return [...seen.values()];
}

function derivePublicPassport(
  bookings: BookingPassportRow[],
  selectedMilestoneIds: string[] | null,
  baseCountryCode: string | null
) {
  const cities = uniqueLabels(bookings.map((booking) => booking.city));
  const venues = uniqueLabels(bookings.map((booking) => booking.venue_name));
  const baseCountry = normalizeLabel(baseCountryCode).toUpperCase();
  const firstCity = bookings.find((booking) => normalizeLabel(booking.city));
  const firstVenue = bookings.find((booking) => normalizeLabel(booking.venue_name));
  const firstInternational = baseCountry
    ? bookings.find((booking) => {
        const country = normalizeLabel(booking.country_code).toUpperCase();
        return Boolean(country && country !== baseCountry);
      })
    : undefined;

  const milestones: PublicPassportMilestone[] = [];
  if (bookings.length) {
    milestones.push({
      id: "first-booking",
      title: "FIRST BOOKING",
      subtitle: "First confirmed date in Cuebooker"
    });
  }
  if (firstCity?.city) {
    milestones.push({
      id: "first-city",
      title: firstCity.city.toUpperCase(),
      subtitle: "First city added to the trajectory"
    });
  }
  if (firstVenue?.venue_name) {
    milestones.push({
      id: "first-venue",
      title: firstVenue.venue_name.toUpperCase(),
      subtitle: "First venue added to the Passport"
    });
  }
  if (bookings.length >= 10) {
    milestones.push({
      id: "bookings-10",
      title: "10 BOOKINGS",
      subtitle: "Confirm 10 dates"
    });
  }
  if (cities.length >= 5) {
    milestones.push({
      id: "cities-5",
      title: "5 CITIES",
      subtitle: "Play in 5 different cities"
    });
  }
  if (venues.length >= 10) {
    milestones.push({
      id: "venues-10",
      title: "10 VENUES",
      subtitle: "Add 10 different venues to your trajectory"
    });
  }
  if (firstInternational) {
    milestones.push({
      id: "first-international",
      title: "INTERNATIONAL",
      subtitle: "First confirmed date outside your base country"
    });
  }

  const visibleMilestones = selectedMilestoneIds === null
    ? milestones.slice(0, 3)
    : milestones.filter((milestone) => selectedMilestoneIds.includes(milestone.id)).slice(0, 3);

  return {
    confirmedBookings: bookings.length,
    cities,
    venues,
    milestones: visibleMilestones
  };
}

type ArtistRow = {
  id: string;
  stage_name: string;
  slug: string;
  bio: string | null;
  city: string | null;
  country_code: string | null;
  languages: string[];
  primary_genres: string[];
  secondary_genres: string[];
  performance_formats: string[];
  event_types: string[];
  years_active: number | null;
  website_url: string | null;
  instagram_url: string | null;
  soundcloud_url: string | null;
  mixcloud_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  cover_image_path: string | null;
  cover_position_y: number;
  artist_image_path: string | null;
  artist_cutout_path: string | null;
  artist_image_style: string;
  artist_image_position_x: number;
  artist_image_position_y: number;
  artist_image_scale: number;
  visual_source: 'portrait' | 'cue_id';
  cue_id_config: unknown;
  passport_public_enabled: boolean;
  passport_public_milestone_ids: string[] | null;
  passport_public_media_ids: string[];
};

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    return json({ error: "invalid_artist_slug" }, 400, { "Cache-Control": "no-store" });
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const artistSelect = [
      "id",
      "stage_name",
      "slug",
      "bio",
      "city",
      "country_code",
      "languages",
      "primary_genres",
      "secondary_genres",
      "performance_formats",
      "event_types",
      "years_active",
      "website_url",
      "instagram_url",
      "soundcloud_url",
      "mixcloud_url",
      "youtube_url",
      "spotify_url",
      "cover_image_path",
      "cover_position_y",
      "artist_image_path",
      "artist_cutout_path",
      "artist_image_style",
      "artist_image_position_x",
      "artist_image_position_y",
      "artist_image_scale",
      "visual_source",
      "cue_id_config",
      "passport_public_enabled",
      "passport_public_milestone_ids",
      "passport_public_media_ids"
    ].join(",");

    const artists = await serviceJson<ArtistRow[]>(
      `${supabaseUrl}/rest/v1/artists?slug=eq.${encodeURIComponent(slug)}&public_profile_enabled=eq.true&select=${encodeURIComponent(artistSelect)}&limit=1`,
      { method: "GET" },
      serviceKey
    );

    const artist = artists[0];
    if (!artist) return json({ error: "artist_not_found" }, 404, { "Cache-Control": "no-store" });

    const routes = await serviceJson<Array<{ accepting_requests: boolean }>>(
      `${supabaseUrl}/rest/v1/artist_booking_routes?artist_id=eq.${encodeURIComponent(artist.id)}&select=accepting_requests&limit=1`,
      { method: "GET" },
      serviceKey
    );

    const workspaceArtists = await serviceJson<Array<{ workspace_id: string }>>(
      `${supabaseUrl}/rest/v1/workspace_artists?artist_id=eq.${encodeURIComponent(artist.id)}&select=workspace_id`,
      { method: "GET" },
      serviceKey
    );

    const workspaceIds = workspaceArtists.map((item) => item.workspace_id).filter(Boolean);
    let passport = {
      confirmedBookings: 0,
      cities: [] as string[],
      venues: [] as string[],
      milestones: [] as PublicPassportMilestone[],
      media: [] as PublicPassportMedia[]
    };

    if (artist.passport_public_enabled && workspaceIds.length) {
      const workspaceFilter = workspaceIds.map((id) => `"${id}"`).join(",");
      const bookings = await serviceJson<BookingPassportRow[]>(
        `${supabaseUrl}/rest/v1/bookings?artist_id=eq.${encodeURIComponent(artist.id)}&workspace_id=in.(${encodeURIComponent(workspaceFilter)})&status=eq.confirmed&select=id,city,country_code,venue_name,event_date&order=event_date.asc.nullslast`,
        { method: "GET" },
        serviceKey
      );
      passport = {
        ...derivePublicPassport(bookings, artist.passport_public_milestone_ids, artist.country_code),
        media: []
      };

      const selectedMediaIds = (artist.passport_public_media_ids || []).filter(Boolean);
      const confirmedBookingIds = bookings.map((booking) => booking.id).filter(Boolean);
      if (selectedMediaIds.length && confirmedBookingIds.length) {
        const mediaFilter = selectedMediaIds.map((id) => `"${id}"`).join(",");
        const bookingFilter = confirmedBookingIds.map((id) => `"${id}"`).join(",");
        const mediaRows = await serviceJson<Array<{
          id: string;
          booking_id: string;
          media_type: "image" | "video" | "reel";
          permalink: string | null;
          media_url: string | null;
          thumbnail_url: string | null;
          caption: string | null;
          captured_at: string | null;
          status: string;
        }>>(
          `${supabaseUrl}/rest/v1/passport_media?id=in.(${encodeURIComponent(mediaFilter)})&booking_id=in.(${encodeURIComponent(bookingFilter)})&status=eq.linked&select=id,booking_id,media_type,permalink,media_url,thumbnail_url,caption,captured_at,status&order=captured_at.desc.nullslast,created_at.desc`,
          { method: "GET" },
          serviceKey
        );

        passport.media = mediaRows.slice(0, 6).map((item) => ({
          id: item.id,
          bookingId: item.booking_id,
          mediaType: item.media_type,
          permalink: safePublicUrl(item.permalink),
          mediaUrl: safePublicUrl(item.media_url),
          thumbnailUrl: safePublicUrl(item.thumbnail_url),
          caption: item.caption,
          capturedAt: item.captured_at
        }));
      }
    }

    const cueId = sanitizeCueIdConfig(artist.cue_id_config);
    const visualMode =
      artist.visual_source === "cue_id"
        ? (cueId ? "cue_id" : "photo")
        : artist.artist_image_style === "photo"
          ? "photo"
          : "artwork";

    const [coverUrl, artistImageUrl, artistCutoutUrl] = await Promise.all([
      signArtistMedia(supabaseUrl, serviceKey, artist.cover_image_path),
      signArtistMedia(supabaseUrl, serviceKey, artist.artist_image_path),
      signArtistMedia(supabaseUrl, serviceKey, artist.artist_cutout_path)
    ]);

    return json({
      artist: {
        stageName: artist.stage_name,
        slug: artist.slug,
        bio: artist.bio,
        city: artist.city,
        countryCode: artist.country_code,
        languages: artist.languages || [],
        primaryGenres: artist.primary_genres || [],
        secondaryGenres: artist.secondary_genres || [],
        performanceFormats: artist.performance_formats || [],
        eventTypes: artist.event_types || [],
        yearsActive: artist.years_active,
        websiteUrl: artist.website_url,
        instagramUrl: artist.instagram_url,
        soundcloudUrl: artist.soundcloud_url,
        mixcloudUrl: artist.mixcloud_url,
        youtubeUrl: artist.youtube_url,
        spotifyUrl: artist.spotify_url,
        coverUrl,
        coverPositionY: artist.cover_position_y,
        artistImageUrl,
        artistCutoutUrl,
        artistImageStyle: artist.artist_image_style,
        artistImagePositionX: artist.artist_image_position_x,
        artistImagePositionY: artist.artist_image_position_y,
        artistImageScale: artist.artist_image_scale,
        visualMode,
        cueId: visualMode === "cue_id" ? cueId : null,
        passport: artist.passport_public_enabled ? passport : null,
        acceptingRequests: Boolean(routes[0]?.accepting_requests)
      }
    }, 200, { "Cache-Control": "private, no-cache, max-age=0, must-revalidate" });
  } catch (error) {
    console.error("get-public-artist-profile", error);
    return json({ error: "public_profile_failed" }, 500, { "Cache-Control": "no-store" });
  }
});
