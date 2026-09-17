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
      "artist_image_scale"
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
        acceptingRequests: Boolean(routes[0]?.accepting_requests)
      }
    }, 200, { "Cache-Control": "public, max-age=60, s-maxage=300" });
  } catch (error) {
    console.error("get-public-artist-profile", error);
    return json({ error: "public_profile_failed" }, 500, { "Cache-Control": "no-store" });
  }
});
