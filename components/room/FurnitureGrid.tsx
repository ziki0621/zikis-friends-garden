import type { FurnitureItem } from "@/lib/db/types";

const emojiByType: Record<string, string> = {
  bed: "🛏",
  desk: "▣",
  plant: "✿",
  lamp: "◉",
  sofa: "▰",
  bookshelf: "▥"
};

const defaultFurniture: FurnitureItem[] = [
  { id: "default-bed", room_id: "demo", type: "bed", label: "软绵绵床", x: 0, y: 0, rotation: 0, metadata: {}, created_at: null },
  { id: "default-desk", room_id: "demo", type: "desk", label: "写字桌", x: 2, y: 1, rotation: 0, metadata: {}, created_at: null },
  { id: "default-plant", room_id: "demo", type: "plant", label: "绿植", x: 4, y: 0, rotation: 0, metadata: {}, created_at: null },
  { id: "default-lamp", room_id: "demo", type: "lamp", label: "小灯", x: 1, y: 3, rotation: 0, metadata: {}, created_at: null }
];

export function FurnitureGrid({ items }: { items: FurnitureItem[] }) {
  const visible = items.length > 0 ? items : defaultFurniture;

  return (
    <div className="grid grid-cols-5 gap-3 rounded-[22px] bg-cream p-4 manor-tile">
      {Array.from({ length: 20 }).map((_, index) => {
        const item = visible.find((furniture) => furniture.x + furniture.y * 5 === index);
        return (
          <div key={index} className="flex aspect-square items-center justify-center rounded-2xl border-2 border-white/70 bg-white/60 text-center text-2xl font-black">
            {item ? (
              <div>
                <div>{emojiByType[item.type] ?? "□"}</div>
                <div className="mt-1 text-[10px] text-ink/60">{item.label ?? item.type}</div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
