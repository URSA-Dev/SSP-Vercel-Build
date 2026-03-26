/**
 * Result pattern — forces callers to handle both success and failure.
 * Use instead of try/catch for expected business logic failures.
 *
 * @example
 * const result = await findCase(id);
 * if (!result.ok) {
 *   return res.status(404).json(result.error);
 * }
 * return res.json(result.value);
 */

/**
 * @template T
 * @param {T} value
 * @returns {{ ok: true, value: T }}
 */
export function ok(value) {
  return { ok: true, value };
}

/**
 * @template E
 * @param {E} error
 * @returns {{ ok: false, error: E }}
 */
export function err(error) {
  return { ok: false, error };
}

/**
 * @template T, E
 * @param {{ ok: boolean, value?: T, error?: E }} result
 * @returns {T}
 * @throws {E}
 */
export function unwrap(result) {
  if (result.ok) return result.value;
  throw result.error;
}
