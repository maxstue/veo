import { cn } from "#/lib/utils";

type VeoLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

export function VeoLogo({ className, markClassName, showWordmark = true }: VeoLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg aria-hidden="true" className={cn("size-9 shrink-0", markClassName)} viewBox="0 0 64 64">
        <defs>
          <mask id="veo-logo-tiles">
            <rect width="64" height="64" fill="black" />
            <rect x="4" y="4" width="27" height="27" rx="7" fill="white" />
            <rect x="33" y="4" width="27" height="27" rx="7" fill="white" />
            <rect x="4" y="33" width="27" height="27" rx="7" fill="white" />
            <circle cx="32" cy="32" r="9" fill="black" />
          </mask>
        </defs>
        <rect
          className="fill-violet-700 dark:fill-violet-500"
          width="64"
          height="64"
          mask="url(#veo-logo-tiles)"
        />
        <circle className="fill-red-400 dark:fill-red-300" cx="47" cy="47" r="13" />
      </svg>
      {showWordmark ? (
        <span className="font-heading text-xl font-semibold tracking-tight">veo</span>
      ) : null}
    </span>
  );
}
