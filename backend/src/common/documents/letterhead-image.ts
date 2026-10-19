import { Logger } from '@nestjs/common';

// Descarga la imagen de membrete guardada en BD (URL http/https o data URI en
// base64) para incrustarla en un PDF. Solo PNG y JPEG, que son los formatos que
// soporta pdfkit. Ante cualquier problema devuelve null y el documento se
// genera con el membrete de texto.

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 5000;
const DATA_URI_PATTERN = /^data:image\/(png|jpe?g);base64,([a-z0-9+/=\s]+)$/i;

const logger = new Logger('LetterheadImage');

function isPngOrJpeg(buffer: Buffer) {
  const isPng =
    buffer.length > 8 &&
    buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const isJpeg =
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  return isPng || isJpeg;
}

function validated(buffer: Buffer, source: string) {
  if (buffer.length > MAX_IMAGE_BYTES) {
    logger.warn(
      `Letterhead image too large (${buffer.length} bytes): ${source}`,
    );
    return null;
  }

  if (!isPngOrJpeg(buffer)) {
    logger.warn(`Letterhead image is not PNG/JPEG: ${source}`);
    return null;
  }

  return buffer;
}

export async function loadLetterheadImage(
  url: string | null,
): Promise<Buffer | null> {
  if (!url) {
    return null;
  }

  const dataUri = DATA_URI_PATTERN.exec(url);
  if (dataUri) {
    return validated(Buffer.from(dataUri[2], 'base64'), 'data URI');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    logger.warn(`Invalid letterhead image URL: ${url}`);
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    logger.warn(`Unsupported letterhead image protocol: ${url}`);
    return null;
  }

  try {
    const response = await fetch(parsed, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      logger.warn(
        `Letterhead image request failed (${response.status}): ${url}`,
      );
      return null;
    }

    const declaredLength = Number(response.headers.get('content-length'));
    if (declaredLength > MAX_IMAGE_BYTES) {
      logger.warn(
        `Letterhead image too large (${declaredLength} bytes): ${url}`,
      );
      return null;
    }

    return validated(Buffer.from(await response.arrayBuffer()), url);
  } catch (error) {
    logger.warn(
      `Could not download letterhead image ${url}: ${(error as Error).message}`,
    );
    return null;
  }
}
