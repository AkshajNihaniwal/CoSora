interface CoSoraLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'login' | 'sidebar' | 'compact';
}

const LOGO_WIDTH = {
  login: 260,
  sidebar: 200,
  compact: 140,
} as const;

export function CoSoraWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`cosora-wordmark ${className}`}>
      <span className="text-[#FF6F00]">C</span>
      <span className="text-cosora-light">o</span>
      <span className="text-[#FF6F00]">S</span>
      <span className="text-cosora-light">ora</span>
    </span>
  );
}

export function CoSoraLogo({
  className = '',
  showText = true,
  variant = 'sidebar',
}: CoSoraLogoProps) {
  const width = LOGO_WIDTH[variant];
  const textSize =
    variant === 'login' ? 'text-3xl' : variant === 'sidebar' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`flex flex-col items-start gap-3 ${className}`}>
      <img
        src="/cosora-logo.png?v=2"
        alt="CoSora"
        width={width}
        className="block object-contain bg-transparent"
        style={{ width, height: 'auto', background: 'transparent' }}
        draggable={false}
      />
      {showText && <CoSoraWordmark className={textSize} />}
    </div>
  );
}
