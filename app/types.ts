export type Product = {
  id: string;
  title: string;
  category: "GAME_ID" | "GAME_CODE";
  categoryLabel: string;
  price: number;
  originalPrice: number;
  image: string;
  stock: number;
  sold: number;
  tags: string[];
  description: string;
};

export type ProductApiItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "GAME_ID" | "GAME_CODE";
  imgUrl: string;
  sold: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductPage = {
  content: ProductApiItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type Order = {
  category: Product["category"];
  items: { data: string }[];
  orderId: string;
  quantity: number;
  status: string;
  title: string;
};

export type UserInfo = {
  balance: number;
  createdAt: string;
  email: string | null;
  id: string;
  role: "USER" | "ADMIN";
  username: string;
};

export type NewProductPayload = {
  title: string;
  description: string;
  price: number;
  category: Product["category"];
  image: File;
};

export const toProduct = (item: ProductApiItem): Product => ({
  id: item.id,
  title: item.title,
  category: item.category,
  categoryLabel: item.category === "GAME_ID" ? "ไอดีเกม" : "โค้ดเกม",
  price: item.price,
  originalPrice: item.price,
  image: item.imgUrl,
  stock: item.stock,
  sold: item.sold,
  tags: [],
  description: item.description,
});

export const money = (amount: number) => `฿${amount.toLocaleString("th-TH")}`;
