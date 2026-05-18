import type { ExifResult, InferenceLine, InferenceResult } from "./types";

function dayOfWeekName(d: Date): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
}

function timeOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "very early morning";
  if (h < 11) return "morning";
  if (h < 14) return "midday";
  if (h < 18) return "afternoon";
  if (h < 21) return "evening";
  return "late at night";
}

function formatLocalTime(d: Date, tzMinutes: number | null): string {
  if (tzMinutes === null) {
    return d.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const shifted = new Date(d.getTime() + tzMinutes * 60_000);
  const sign = tzMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(tzMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  const local = shifted.toISOString().replace("T", " ").slice(0, 16);
  return `${local} (UTC${sign}${hh}:${mm})`;
}

export function generateInference(exif: ExifResult): InferenceResult {
  const lines: InferenceLine[] = [];

  if (exif.gps) {
    lines.push({
      severity: "high",
      text: `GPS coordinates are embedded in this photo. If you posted this to Reddit, a dating app, or Discord, anyone could pin your location in 30 seconds.`,
    });
  } else {
    lines.push({
      severity: "ok",
      text: "No GPS coordinates found in this file. Most platforms strip GPS on upload, but the original on your phone may still carry it.",
    });
  }

  if (exif.takenAt) {
    const local = formatLocalTime(exif.takenAt, exif.timezoneOffsetMinutes);
    const day = dayOfWeekName(exif.takenAt);
    const tod = timeOfDay(exif.takenAt);
    lines.push({
      severity: "medium",
      text: `Captured on a ${day}, ${tod}, local time. The timestamp is precise to the second: ${local}.`,
    });
  }

  if (exif.cameraMake || exif.cameraModel || exif.iosOrAndroidHint) {
    const pieces = [exif.cameraMake, exif.cameraModel].filter(Boolean).join(" ");
    const os = exif.iosOrAndroidHint ? `, running ${exif.iosOrAndroidHint}` : "";
    const lens = exif.lensModel ? `. Lens: ${exif.lensModel}` : "";
    lines.push({
      severity: "medium",
      text: `Device identified as ${pieces || "an unrecognized camera"}${os}${lens}.`,
    });
  }

  if (exif.software && !exif.iosOrAndroidHint) {
    lines.push({
      severity: "low",
      text: `Edited or processed with ${exif.software}.`,
    });
  }

  if (!exif.gps && exif.cameraModel && exif.takenAt) {
    lines.push({
      severity: "medium",
      text: "Even without GPS, the phone model plus the exact capture timestamp narrows you down inside a breach corpus or device fleet.",
    });
  }

  if (exif.gps && exif.cameraModel) {
    lines.push({
      severity: "high",
      text: "GPS and a unique device fingerprint together connect this photo to every other photo your phone has taken, anywhere you have posted them.",
    });
  }

  if (exif.copyright || exif.artist) {
    lines.push({
      severity: "low",
      text: `Author or copyright field is filled in (${[exif.artist, exif.copyright].filter(Boolean).join(", ")}). Many people put their real name here without realizing.`,
    });
  }

  if (!exif.hasAnyExif) {
    lines.push({
      severity: "ok",
      text: "No EXIF metadata at all in this file. Either it was already cleaned, or the platform that produced it stripped everything.",
    });
  }

  const headline = exif.gps
    ? "This photo gives away where, when, and what took it."
    : exif.takenAt || exif.cameraModel
      ? "This photo does not have GPS, but it still reveals when and what took it."
      : "This file looks clean. Verify with the download check below if you plan to publish it.";

  const narrative = exif.gps
    ? "Anyone who downloads this image gets a precise pin on a map. That alone has been enough for stalkers, doxxers, and the John McAfee Vice photo that ended his Guatemala hideout in 2012."
    : "Photos without GPS still carry capture time, device model, lens, and editing trail. For someone trying to correlate accounts or build a profile, that is often plenty.";

  return { headline, lines, narrative };
}
