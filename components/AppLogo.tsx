/* eslint-disable @next/next/no-img-element */

type Props = {
  logoUrl: string | null;
  className?: string;
  alt?: string;
};

/** Logo sehr groß: h-28 bis h-32 */
export function AppLogo({
  logoUrl,
  className = 'h-28 w-auto object-contain sm:h-32',
  alt = 'Logo',
}: Props) {
  if (!logoUrl || !logoUrl.trim()) {
    return (
      <span className="text-lg font-semibold text-[var(--color-text)]">
        Brospify Hub
      </span>
    );
  }
  return (
    <img
      src={logoUrl.trim()}
      alt={alt}
      className={className}
      width={320}
      height={128}
      loading="eager"
    />
  );
}
