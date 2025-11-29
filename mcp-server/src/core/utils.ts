/**
 * UUID を環境に応じて生成するユーティリティ
 *
 * - GAS 環境: Utilities.getUuid()
 * - Node 環境: crypto.randomUUID()
 */
export function generateUuid(): string {
  if (typeof Utilities !== 'undefined') {
    return Utilities.getUuid();
  }

  const hasCrypto =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';

  if (hasCrypto) {
    return crypto.randomUUID();
  }

  throw new Error('UUID generation not available in this environment');
}
