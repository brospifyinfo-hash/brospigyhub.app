/**
 * Logo – Datei muss in public/logo.png liegen.
 * Pfad: /logo.png (Next.js liefert public/ unter / aus)
 */
const LOGO_SRC = '/logo.png';

type Props = {
  className?: string;
  alt?: string;
};

export function AppLogo({ className = 'h-9 w-auto rounded-md object-contain', alt = 'Logo' }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={alt}
      className={className}
      width={120}
      height={36}
      loading="eager"
      decoding="async"
    />
  );
}
