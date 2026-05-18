export interface GpsPoint {
  lat: number;
  lon: number;
  altitude?: number;
  accuracyMeters?: number;
}

export interface ExifResult {
  filename: string;
  byteSize: number;
  mimeType: string;
  hasAnyExif: boolean;

  gps: GpsPoint | null;

  takenAt: Date | null;
  timezoneOffsetMinutes: number | null;

  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  software: string | null;
  iosOrAndroidHint: string | null;

  imageWidth: number | null;
  imageHeight: number | null;
  orientation: number | null;
  colorSpace: string | null;

  exposure: {
    aperture: number | null;
    shutter: string | null;
    iso: number | null;
    focalLength: number | null;
  };

  copyright: string | null;
  artist: string | null;

  rawKeys: string[];
}

export interface InferenceLine {
  severity: "high" | "medium" | "low" | "ok";
  text: string;
}

export interface InferenceResult {
  headline: string;
  lines: InferenceLine[];
  narrative: string;
}

export interface CleaningResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  originalByteSize: number;
  cleanedByteSize: number;
}
