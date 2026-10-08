/**
 * The language a page declares for itself, which relative times are said in
 * when no `locale` is given. iOS, Android and Windows have no page: the
 * engine's own language is used.
 */
export function usePageLanguage(): string | undefined {
  return undefined;
}
