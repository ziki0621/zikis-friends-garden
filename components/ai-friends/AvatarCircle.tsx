type AvatarCircleProps = {
  avatar?: string;
  emoji?: string;
  color: string;
  label: string;
  className?: string;
};

export function AvatarCircle({ avatar, emoji, color, label, className = "h-9 w-9 text-sm" }: AvatarCircleProps) {
  if (avatar) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-[2.5px] border-cream/90 bg-cover bg-center bg-white shadow-sm ${className}`}
        style={{ backgroundImage: `url("${avatar}")` }}
        aria-hidden="true"
      />
    );
  }

  const emojiChar = emoji || "🧩";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-[2.5px] border-white/90 shadow-sm ${className}`}
      style={{ background: `linear-gradient(145deg, ${color}22, ${color}14)` }}
      aria-hidden="true"
    >
      <span className="leading-none select-none" style={{ fontSize: "calc(60% + 1px)" }}>
        {emojiChar}
      </span>
    </span>
  );
}
