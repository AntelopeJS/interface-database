import { isKindHolder } from "./kind";
import type { ValueProxy } from "./valueproxy";

export const VALUEPROXY_KIND = Symbol.for(
  "@antelopejs/interface-database/ValueProxy@1",
);

/**
 * Whether a value is a value proxy, built by any instance of this interface.
 *
 * Unlike `instanceof`, it also recognises objects built by the instance of
 * another provider binding.
 *
 * @param value Value to test
 * @returns True if the value is a value proxy
 */
export function IsValueProxy(value: unknown): value is ValueProxy<unknown> {
  return isKindHolder(value) && value[VALUEPROXY_KIND] === true;
}
