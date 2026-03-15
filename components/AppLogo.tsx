/* eslint-disable @next/next/no-img-element */

type Props = {
  logoUrl: string | null;
  className?: string;
  alt?: string;
};

/** Logo klein: h-9 Standard */
export function AppLogo({
  logoUrl,
  className = 'h-9 w-auto object-contain',
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
      width={120}
      height={36}
      loading="eager"
    />
  );
}
