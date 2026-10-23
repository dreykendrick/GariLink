export type EvidenceMime = "image/jpeg" | "image/png" | "application/pdf";
export type ScanResult = "CLEAN" | "UNSAFE" | "ERROR" | "UNKNOWN";

export interface MalwareScanner {
  scan(bytes: Uint8Array, signal: AbortSignal): Promise<{
    result: ScanResult;
    provider: string;
    attestation: string;
    scannedAt: string;
    expiresAt: string;
  }>;
}

export interface EvidenceExpectation {
  mimeType: EvidenceMime;
  sizeBytes: number;
  maxSizeBytes: number;
}

const signatureMime = (bytes: Uint8Array): EvidenceMime | null => {
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)) return "image/png";
  if (bytes.length >= 3 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return "image/jpeg";
  if (bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0,5))==="%PDF-") return "application/pdf";
  return null;
};

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,"0")).join("");

/** Trusted processor primitive. It logs nothing and fails closed on every scan failure. */
export async function inspectIdentityEvidence(
  bytes: Uint8Array,
  expected: EvidenceExpectation,
  scanner: MalwareScanner | undefined,
  timeoutMs = 8000,
) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30000)
    throw new Error("SCANNER_TIMEOUT_INVALID");
  // Bind validation and hashing to a private snapshot, not a caller-owned buffer.
  bytes = bytes.slice();
  if (!bytes.length || bytes.length !== expected.sizeBytes || bytes.length > expected.maxSizeBytes)
    throw new Error("EVIDENCE_SIZE_MISMATCH");
  const actualMime = signatureMime(bytes);
  if (!actualMime || actualMime !== expected.mimeType) throw new Error("EVIDENCE_SIGNATURE_MISMATCH");
  if (!scanner) throw new Error("SCANNER_UNAVAILABLE");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("SCANNER_TIMEOUT"));
    }, timeoutMs);
  });
  let scan;
  try {
    // A provider must not be able to mutate the bytes whose digest we attest.
    scan = await Promise.race([scanner.scan(bytes.slice(),controller.signal), deadline]);
  }
  catch {
    throw new Error(controller.signal.aborted ? "SCANNER_TIMEOUT" : "SCANNER_ERROR");
  }
  finally { clearTimeout(timer); }
  if (scan.result !== "CLEAN" || !scan.provider || scan.attestation.length < 16)
    throw new Error(scan.result === "UNSAFE" ? "EVIDENCE_UNSAFE" : "SCANNER_NOT_CLEAN");
  const scannedAt = Date.parse(scan.scannedAt), expiresAt = Date.parse(scan.expiresAt);
  if (!Number.isFinite(scannedAt) || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || scannedAt > Date.now())
    throw new Error("SCANNER_ATTESTATION_STALE");
  return {
    actualMimeType: actualMime,
    actualSizeBytes: bytes.length,
    actualSha256: hex(await crypto.subtle.digest("SHA-256",bytes)),
    scannerProvider: scan.provider,
    scannerAttestation: scan.attestation,
    scanResult: scan.result,
    scannedAt: scan.scannedAt,
    expiresAt: scan.expiresAt,
  } as const;
}
