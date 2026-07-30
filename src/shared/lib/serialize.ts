/**
 * Server Component → Client Component serialization.
 *
 * Replaces `JSON.parse(JSON.stringify(x))`, which was both untyped (the result
 * was `any`, so every downstream field lost checking) and lossy in a way the
 * types denied: `Date` silently became `string` while still being typed as
 * `Date`, and `Decimal`/`BigInt` would throw at runtime.
 *
 * This models the conversion in the type system, so a component receiving the
 * result knows dates arrive as ISO strings.
 */

export type Serialized<T> = T extends Date
  ? string
  : T extends bigint
    ? string
    : T extends (infer U)[]
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

export function serializeForClient<T>(value: T): Serialized<T> {
  return convert(value) as Serialized<T>;
}

function convert(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(convert);

  // Prisma's Decimal and any other object exposing toJSON knows best how to
  // represent itself; plain objects are walked field by field.
  if (typeof value === "object") {
    const maybeToJSON = (value as { toJSON?: () => unknown }).toJSON;
    if (typeof maybeToJSON === "function") return maybeToJSON.call(value);

    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = convert(nested);
    }
    return result;
  }

  return value;
}
