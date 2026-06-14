type AvatarCircleProps = {
  avatar?: string;
  color: string;
  label: string;
  className?: string;
};

export function AvatarCircle({ avatar, color, label, className = "h-9 w-9 text-sm" }: AvatarCircleProps) {
  const initial = label.trim().slice(0, 1) || "?";

  if (avatar) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-[2.5px] border-cream/90 bg-cover bg-center bg-white shadow-sm ${className}`}
        style={{ backgroundImage: `url("${avatar}")` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-[2.5px] border-cream/90 font-semibold text-white shadow-sm ${className}`}
      style={{
        background: `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 60%, #3a3530))`
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
