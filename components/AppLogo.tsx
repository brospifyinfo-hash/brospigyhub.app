/* eslint-disable @next/next/no-img-element */
import logoSrc from '@/assets/logo.png';

const FALLBACK_SRC = typeof logoSrc === 'string' ? logoSrc : (logoSrc as { src: string }).src;

type Props = {
  logoUrl?: string | null;
  className?: string;
  alt?: string;
};

export function AppLogo({
  logoUrl,
  className = 'h-14 w-auto object-contain sm:h-16',
  alt = 'Logo',
}: Props) {
  const src = (typeof logoUrl === 'string' && logoUrl.trim()) ? logoUrl.trim() : FALLBACK_SRC;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={180}
      height={64}
      loading="eager"
    />
  );
}
