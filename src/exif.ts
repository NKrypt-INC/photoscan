import ExifReader from "exifreader";
import type { ExifResult, GpsPoint } from "./types";

type ReaderTags = Record<string, unknown>;

interface TagValue {
  description?: string | number;
  value?: unknown;
}

function pickString(tag: TagValue | undefined): string | null {
  if (!tag) return null;
  const d = tag.description;
  if (typeof d === "string" && d.length > 0) return d.trim();
  if (typeof d === "number" && Number.isFinite(d)) return String(d);
  const v = tag.value;
  if (typeof v === "string" && v.length > 0) return v.trim();
  return null;
}

function pickNumber(tag: TagValue | undefined): number | null {
  if (!tag) return null;
  const d = tag.description;
  if (typeof d === "number" && Number.isFinite(d)) return d;
  if (typeof d === "string") {
    const m = d.match(/-?\d+(\.\d+)?/);
    if (m) {
      const n = parseFloat(m[0]);
      if (Number.isFinite(n)) return n;
    }
  }
  const v = tag.value;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === "number") return v[0];
  return null;
}

function parseExifDate(s: string | null, subSec?: string | null, offset?: string | null): Date | null {
  if (!s) return null;
  // Common EXIF format: "YYYY:MM:DD HH:MM:SS"
  const m = s.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (!m) {
    const fallback = new Date(s);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${subSec ? "." + subSec.padEnd(3, "0").slice(0, 3) : ""}${offset ?? ""}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseTzOffsetMinutes(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!m) return null;
  return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

function pickGps(tags: ReaderTags): GpsPoint | null {
  const gps = (tags as unknown as { gps?: Record<string, TagValue> }).gps;
  if (!gps) return null;
  const lat = pickNumber(gps.Latitude);
  const lon = pickNumber(gps.Longitude);
  if (lat === null || lon === null) return null;
  if ((lat === 0 && lon === 0) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const altitude = pickNumber(gps.Altitude);
  return { lat, lon, altitude: altitude ?? undefined };
}

function detectOsHint(software: string | null, make: string | null): string | null {
  if (!software && !make) return null;
  const sw = (software ?? "").trim();
  const mk = (make ?? "").toLowerCase();
  // iPhones store iOS version in Software as e.g. "26.3.1" or "iOS 17.5.1"
  if (mk.includes("apple")) {
    const v = sw.match(/(\d{1,2}(?:\.\d{1,2}){1,2})/);
    return v ? `iOS ${v[1]}` : "iOS";
  }
  if (mk.includes("google") || mk.includes("samsung") || mk.includes("xiaomi") || mk.includes("oneplus")) {
    const v = sw.match(/android\s?(\d{1,2}(?:\.\d)?)/i);
    return v ? `Android ${v[1]}` : "Android";
  }
  return null;
}

function shutterFromExposure(tag: TagValue | undefined): string | null {
  if (!tag) return null;
  const d = tag.description;
  if (typeof d === "string" && d.includes("/")) return d.includes("s") ? d : `${d}s`;
  const n = pickNumber(tag);
  if (n === null || n <= 0) return null;
  if (n >= 1) return `${n.toFixed(1)}s`;
  return `1/${Math.round(1 / n)}s`;
}

export async function parseExif(file: File | Blob, filename: string, mimeType: string): Promise<ExifResult> {
  const buf = await file.arrayBuffer();
  let tags: ReaderTags | null = null;
  try {
    tags = ExifReader.load(buf, { expanded: true, includeUnknown: false }) as unknown as ReaderTags;
  } catch {
    tags = null;
  }

  const exif = (tags as unknown as { exif?: Record<string, TagValue> })?.exif ?? {};
  const file_ = (tags as unknown as { file?: Record<string, TagValue> })?.file ?? {};
  const iptc = (tags as unknown as { iptc?: Record<string, TagValue> })?.iptc ?? {};
  const xmp = (tags as unknown as { xmp?: Record<string, TagValue> })?.xmp ?? {};

  const cameraMake = pickString(exif.Make);
  const cameraModel = pickString(exif.Model);
  const lensModel = pickString(exif.LensModel) || pickString(exif.Lens) || pickString(exif.LensInfo);
  const software = pickString(exif.Software);

  const dateStr =
    pickString(exif.DateTimeOriginal) ??
    pickString(exif.CreateDate) ??
    pickString(exif.DateTime) ??
    pickString(exif.ModifyDate);
  const subSec =
    pickString(exif.SubSecTimeOriginal) ??
    pickString(exif.SubSecTime);
  const tzString =
    pickString(exif.OffsetTimeOriginal) ??
    pickString(exif.OffsetTime) ??
    pickString(exif.OffsetTimeDigitized);

  const takenAt = parseExifDate(dateStr, subSec ?? undefined, tzString ?? undefined);

  const hasAnyExif =
    Object.keys(exif).length > 0 ||
    Object.keys(iptc).length > 0 ||
    Object.keys(xmp).length > 0 ||
    pickGps(tags ?? ({} as ReaderTags)) !== null;

  const widthFromFile = pickNumber(file_["Image Width"]) ?? pickNumber(file_.ImageWidth);
  const heightFromFile = pickNumber(file_["Image Height"]) ?? pickNumber(file_.ImageHeight);

  const result: ExifResult = {
    filename,
    byteSize: (file as File).size ?? buf.byteLength,
    mimeType,
    hasAnyExif,

    gps: pickGps(tags ?? ({} as ReaderTags)),

    takenAt,
    timezoneOffsetMinutes: parseTzOffsetMinutes(tzString),

    cameraMake,
    cameraModel,
    lensModel,
    software,
    iosOrAndroidHint: detectOsHint(software, cameraMake),

    imageWidth: pickNumber(exif.PixelXDimension) ?? pickNumber(exif.ExifImageWidth) ?? widthFromFile,
    imageHeight: pickNumber(exif.PixelYDimension) ?? pickNumber(exif.ExifImageHeight) ?? heightFromFile,
    orientation: pickNumber(exif.Orientation),
    colorSpace: pickString(exif.ColorSpace),

    exposure: {
      aperture: pickNumber(exif.FNumber) ?? pickNumber(exif.ApertureValue),
      shutter: shutterFromExposure(exif.ExposureTime),
      iso: pickNumber(exif.ISOSpeedRatings) ?? pickNumber(exif.PhotographicSensitivity),
      focalLength: pickNumber(exif.FocalLength),
    },

    copyright: pickString(exif.Copyright),
    artist: pickString(exif.Artist) ?? pickString(exif.Creator),

    rawKeys: [
      ...Object.keys(exif),
      ...Object.keys(iptc).map((k) => `iptc:${k}`),
      ...Object.keys(xmp).map((k) => `xmp:${k}`),
    ],
  };

  return result;
}

const SENSITIVE_KEY_RE = /^(GPS|Make|Model|DateTimeOriginal|DateTime|CreateDate|Software|LensModel|Lens|Artist|Creator|Copyright|OffsetTime|SerialNumber|HostComputer|BodySerialNumber)/i;

export async function verifyZeroExif(blob: Blob): Promise<{ clean: boolean; keys: string[] }> {
  try {
    const buf = await blob.arrayBuffer();
    const tags = ExifReader.load(buf, { expanded: true, includeUnknown: false }) as unknown as ReaderTags;
    const ns = tags as Record<string, Record<string, unknown> | undefined>;
    const sections: Array<[string, Record<string, unknown> | undefined]> = [
      ["exif", ns.exif],
      ["gps", ns.gps],
      ["iptc", ns.iptc],
      ["xmp", ns.xmp],
    ];
    const offending: string[] = [];
    for (const [prefix, section] of sections) {
      if (!section) continue;
      for (const key of Object.keys(section)) {
        if (key === "_raw" || key === "about") continue;
        if (prefix === "gps" || SENSITIVE_KEY_RE.test(key)) {
          offending.push(`${prefix}:${key}`);
        }
      }
    }
    return { clean: offending.length === 0, keys: offending };
  } catch {
    return { clean: true, keys: [] };
  }
}
