/* eslint-disable @next/next/no-img-element */
/** Logo aus public/logo.png – Next.js serviert es unter /logo.png */
const LOGO_SRC = '/logo.png';

type Props = {
  className?: string;
  alt?: string;
};

export function AppLogo({
  className = 'h-14 w-auto object-contain sm:h-16',
  alt = 'Logo',
}: Props) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={className}
      width={180}
      height={64}
      loading="eager"
    />
  );
}
