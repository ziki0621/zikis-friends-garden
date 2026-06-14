export type AvatarConfig = {
  skinColor: string;
  hairStyle: "short" | "bob" | "curly" | "long";
  hairColor: string;
  outfit: "hoodie" | "shirt" | "dress" | "jacket";
  accessory?: "glasses" | "hat" | "none";
  expression: "smile" | "calm" | "excited" | "sleepy";
  avatarSeed?: string;
};

export type Profile = {
  id: string;
  nickname: string;
  bio: string | null;
  avatar_config: AvatarConfig;
  personality_tag: string | null;
  favorite_color: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Room = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  theme: string;
  layout: Record<string, unknown>;
  is_public: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type FurnitureItem = {
  id: string;
  room_id: string;
  type: string;
  label: string | null;
  x: number;
  y: number;
  rotation: number;
  metadata: Record<string, unknown>;
  created_at: string | null;
};

export type ManorMessage = {
  id: string;
  room_id: string | null;
  author_id: string | null;
  author_name: string | null;
  content: string;
  is_public: boolean;
  created_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "nickname">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      rooms: {
        Row: Room;
        Insert: Partial<Room> & Pick<Room, "owner_id">;
        Update: Partial<Room>;
        Relationships: [];
      };
      furniture_items: {
        Row: FurnitureItem;
        Insert: Partial<FurnitureItem> & Pick<FurnitureItem, "room_id" | "type">;
        Update: Partial<FurnitureItem>;
        Relationships: [];
      };
      messages: {
        Row: ManorMessage;
        Insert: Partial<ManorMessage> & Pick<ManorMessage, "content">;
        Update: Partial<ManorMessage>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const defaultAvatarConfig: AvatarConfig = {
  skinColor: "#F2C9A5",
  hairStyle: "short",
  hairColor: "#3A2A1F",
  outfit: "hoodie",
  accessory: "none",
  expression: "smile",
  avatarSeed: "ziki-friend"
};
