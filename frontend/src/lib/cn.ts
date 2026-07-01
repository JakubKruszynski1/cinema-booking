// Prosta łączarka klas CSS (bez zewnętrznych zależności).
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
