/* eslint-disable @next/next/no-img-element */
import logoSrc from '@/assets/logo.png';

type Props = {
  className?: string;
  alt?: string;
};

export function AppLogo({
  className = 'h-14 w-auto object-contain sm:h-16',
  alt = 'Logo',
}: Props) {
  const src = typeof logoSrc === 'string' ? logoSrc : (logoSrc as { src: string }).src;
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
