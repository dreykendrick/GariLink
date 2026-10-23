import {inspectIdentityEvidence, type EvidenceMime, type MalwareScanner} from './identity_evidence_processor.ts';

/** Internal service contracts only. Never construct these from an HTTP body. */
export interface ReservedEvidence {
  documentId: string;
  caseId: string;
  subjectId: string;
  objectPath: string;
  version: number;
  caseRevision: number;
  policyVersion: number;
  expiresAt: string;
  mimeType: EvidenceMime;
  sizeBytes: number;
  maxSizeBytes: number;
}
export interface StoredEvidence {
  bucket: string;
  objectPath: string;
  objectVersion: string;
  ownerId: string;
  bytes: Uint8Array;
}
export interface EvidenceObjectStore {
  /** Read an immutable object version; no client-chosen URLs. */
  read(reservation: Readonly<ReservedEvidence>, signal: AbortSignal): Promise<StoredEvidence>;
}
export interface EvidenceContentValidator {
  /** Full parser/content policy, not just magic-byte detection. Fail closed. */
  validate(bytes: Uint8Array, mime: EvidenceMime, signal: AbortSignal): Promise<boolean>;
}
type Inspection = Awaited<ReturnType<typeof inspectIdentityEvidence>>;
export interface EvidenceTransaction {
  /** Must lock case before document and derive the reservation from private SQL. */
  lockReservation(documentId: string, expectedRevision: number): Promise<ReservedEvidence>;
  /** Must recheck policy, reservation, object version, case revision and insert
   * inspection/finalization/audit in ONE transaction. No client/service-role RPC. */
  finalize(reservation: Readonly<ReservedEvidence>, objectVersion: string,
    inspection: Inspection, requestId: string): Promise<void>;
}
export interface EvidenceDatabase {
  /** Roll back on any callback error. Must not expose DB-owner credentials. */
  transaction<T>(operation: (tx: EvidenceTransaction) => Promise<T>): Promise<T>;
}

/** Private worker orchestration. No runnable production adapter is installed.
 * Real deployment requires immutable Storage versions and a qualified scanner.
 * This function never logs bytes, paths, scanner attestations or applicant IDs. */
export async function processReservedIdentityEvidence(
  input: {documentId: string; expectedRevision: number; requestId: string},
  dependencies: {database: EvidenceDatabase; objects: EvidenceObjectStore;
    scanner?: MalwareScanner; contentValidator?: EvidenceContentValidator},
  timeoutMs = 15000,
): Promise<{documentId: string; state: 'FINALIZED'}> {
  if (!dependencies.scanner) throw new Error('SCANNER_UNAVAILABLE');
  if (!dependencies.contentValidator) throw new Error('CONTENT_VALIDATOR_UNAVAILABLE');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30000)
    throw new Error('PROCESSING_TIMEOUT_INVALID');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('PROCESSING_TIMEOUT'));
    }, timeoutMs);
  });
  const guard = () => {
    if (controller.signal.aborted) throw new Error('PROCESSING_TIMEOUT');
  };
  try {
    const operation = dependencies.database.transaction(async tx => {
      const r = Object.freeze({...await tx.lockReservation(input.documentId, input.expectedRevision)});
      guard();
      if (r.documentId !== input.documentId || r.caseRevision !== input.expectedRevision ||
          !r.caseId || !r.subjectId || !r.objectPath || !Number.isInteger(r.version) || r.version < 1 ||
          !Number.isInteger(r.policyVersion) || r.policyVersion < 1 ||
          !Number.isFinite(Date.parse(r.expiresAt)) || Date.parse(r.expiresAt) <= Date.now())
        throw new Error('RESERVATION_INVALID');
      const object = await dependencies.objects.read(r, controller.signal);
      guard();
      if (object.bucket !== 'verification-private' || object.objectPath !== r.objectPath ||
          object.ownerId !== r.subjectId || !object.objectVersion)
        throw new Error('OBJECT_BINDING_MISMATCH');
      const bytes = object.bytes.slice();
      if (!Number.isSafeInteger(r.sizeBytes) || !Number.isSafeInteger(r.maxSizeBytes) ||
          r.maxSizeBytes < 1 || r.maxSizeBytes > 5242880 ||
          !bytes.length || bytes.length !== r.sizeBytes || bytes.length > r.maxSizeBytes)
        throw new Error('EVIDENCE_SIZE_MISMATCH');
      if (!await dependencies.contentValidator!.validate(bytes.slice(), r.mimeType, controller.signal))
        throw new Error('EVIDENCE_CONTENT_REJECTED');
      guard();
      const inspection = await inspectIdentityEvidence(bytes, r, dependencies.scanner, timeoutMs);
      guard();
      // A second read must use the same immutable version and identical bytes.
      const current = await dependencies.objects.read(r, controller.signal);
      guard();
      if (current.bucket !== object.bucket || current.objectPath !== object.objectPath ||
          current.ownerId !== object.ownerId || current.objectVersion !== object.objectVersion ||
          current.bytes.length !== bytes.length || current.bytes.some((v, i) => v !== bytes[i]))
        throw new Error('OBJECT_CHANGED');
      if (Date.parse(r.expiresAt) <= Date.now()) throw new Error('RESERVATION_EXPIRED');
      await tx.finalize(r, object.objectVersion, inspection, input.requestId);
      guard();
      return {documentId: r.documentId, state: 'FINALIZED' as const};
    });
    return await Promise.race([operation, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
