import exifr from "exifr";
import type { ExifResult, GpsPoint } from "./types";

// exifr's typings are strict about per-segment shape; pass `true` to enable everything.
// We use `unknown` and let exifr accept the runtime object.
const FULL_OPTIONS: unknown = {
  tiff: true,
  exif: true,
  gps: true,
  interop: false,
  xmp: true,
  icc: true,
  iptc: true,
  jfif: true,
  ihdr: true,
  mergeOutput: true,
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
  sanitize: true,
};

function softwareLooksLikeIos(software: string | null, make: string | null): string | null {
  if (!software && !make) return null;
  const sw = (software ?? "").toLowerCase();
  const mk = (make ?? "").toLowerCase();
  if (mk.includes("apple") || sw.match(/\bios\s?\d/) || sw.includes("iphone")) {
    const v = sw.match(/(\d{1,2}\.\d(?:\.\d)?)/);
    return v ? `iOS ${v[1]}` : "iOS";
  }
  if (mk.includes("google") || mk.includes("samsung") || mk.includes("xiaomi") || mk.includes("oneplus")) {
    const v = sw.match(/android\s?(\d{1,2}(?:\.\d)?)/i);
    return v ? `Android ${v[1]}` : "Android";
  }
  return null;
}

function pickGps(raw: Record<string, unknown>): GpsPoint | null {
  const lat = (raw.latitude as number | undefined) ?? (raw.GPSLatitude as number | undefined);
  const lon = (raw.longitude as number | undefined) ?? (raw.GPSLongitude as number | undefined);
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat === 0 && lon === 0) return null;
  const altitude = (raw.GPSAltitude as number | undefined) ?? (raw.altitude as number | undefined);
  const dop = raw.GPSDOP as number | undefined;
  const accuracyMeters = typeof dop === "number" ? Math.round(dop * 5) : undefined;
  return { lat, lon, altitude, accuracyMeters };
}

function parseTimezoneOffset(raw: Record<string, unknown>): number | null {
  const offset = raw.OffsetTimeOriginal ?? raw.OffsetTime ?? raw.OffsetTimeDigitized;
  if (typeof offset !== "string") return null;
  const m = offset.match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

function pickDate(raw: Record<string, unknown>): Date | null {
  const candidates = [
    raw.DateTimeOriginal,
    raw.CreateDate,
    raw.DateTime,
    raw.ModifyDate,
  ];
  for (const c of candidates) {
    if (c instanceof Date && !Number.isNaN(c.getTime())) return c;
    if (typeof c === "string") {
      const d = new Date(c);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
}

export async function parseExif(file: File | Blob, filename: string, mimeType: string): Promise<ExifResult> {
  let raw: Record<string, unknown> = {};
  try {
    const parsed = (await exifr.parse(file as Blob, FULL_OPTIONS as Parameters<typeof exifr.parse>[1])) as Record<string, unknown> | undefined;
    if (parsed) raw = parsed;
  } catch {
    raw = {};
  }

  const cameraMake = (raw.Make as string | undefined) ?? null;
  const cameraModel = (raw.Model as string | undefined) ?? null;
  const lensModel = ((raw.LensModel ?? raw.Lens ?? raw.LensInfo) as string | undefined) ?? null;
  const software = (raw.Software as string | undefined) ?? null;

  const result: ExifResult = {
    filename,
    byteSize: (file as File).size ?? 0,
    mimeType,
    hasAnyExif: Object.keys(raw).length > 0,

    gps: pickGps(raw),

    takenAt: pickDate(raw),
    timezoneOffsetMinutes: parseTimezoneOffset(raw),

    cameraMake: cameraMake?.toString().trim() || null,
    cameraModel: cameraModel?.toString().trim() || null,
    lensModel: lensModel?.toString().trim() || null,
    software: software?.toString().trim() || null,
    iosOrAndroidHint: softwareLooksLikeIos(software ?? null, cameraMake ?? null),

    imageWidth: (raw.ExifImageWidth as number | undefined) ?? (raw.ImageWidth as number | undefined) ?? null,
    imageHeight: (raw.ExifImageHeight as number | undefined) ?? (raw.ImageHeight as number | undefined) ?? null,
    orientation: (raw.Orientation as number | undefined) ?? null,
    colorSpace: (raw.ColorSpace as string | undefined)?.toString() ?? null,

    exposure: {
      aperture: (raw.FNumber as number | undefined) ?? (raw.ApertureValue as number | undefined) ?? null,
      shutter: (raw.ExposureTime as number | undefined) !== undefined
        ? formatShutter(raw.ExposureTime as number)
        : null,
      iso: (raw.ISO as number | undefined) ?? null,
      focalLength: (raw.FocalLength as number | undefined) ?? null,
    },

    copyright: (raw.Copyright as string | undefined) ?? null,
    artist: ((raw.Artist ?? raw.Creator) as string | undefined) ?? null,

    rawKeys: Object.keys(raw),
  };

  return result;
}

function formatShutter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  if (seconds >= 1) return `${seconds.toFixed(1)}s`;
  const denom = Math.round(1 / seconds);
  return `1/${denom}s`;
}

export async function verifyZeroExif(blob: Blob): Promise<{ clean: boolean; keys: string[] }> {
  try {
    const parsed = (await exifr.parse(blob, FULL_OPTIONS as Parameters<typeof exifr.parse>[1])) as Record<string, unknown> | undefined;
    if (!parsed) return { clean: true, keys: [] };
    const keys = Object.keys(parsed).filter((k) => {
      const v = parsed[k];
      return v !== undefined && v !== null && !(typeof v === "string" && v.length === 0);
    });
    const sensitiveLeak = keys.some((k) =>
      /^(GPS|Make|Model|DateTimeOriginal|DateTime|CreateDate|Software|LensModel|Lens|Artist|Copyright|OffsetTime|SerialNumber|HostComputer|BodySerialNumber)/i.test(k),
    );
    return { clean: !sensitiveLeak, keys };
  } catch {
    return { clean: true, keys: [] };
  }
}
