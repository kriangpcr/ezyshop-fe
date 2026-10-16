import { useEffect, useState, type FormEvent } from "react";
import { Layers, Plus, Settings } from "lucide-react";
import type { NewProductPayload, Product } from "../types";

export function Admin({
  products,
  onAdd,
  onRestock,
  adminTab,
  setAdminTab,
}: {
  products: Product[];
  onAdd: (data: NewProductPayload) => Promise<void>;
  onRestock: (id: string, items: string[]) => Promise<void>;
  adminTab: string;
  setAdminTab: (v: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Product["category"]>("GAME_CODE");
  const [image, setImage] = useState<File | null>(null);
  const [product, setProduct] = useState(products[0]?.id || "");
  const [itemCount, setItemCount] = useState(1);
  const [itemValues, setItemValues] = useState<string[]>(Array(1).fill(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!product && products.length) setProduct(products[0].id);
  }, [product, products]);
  const submitNew = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!image) {
      setError("กรุณาเลือกไฟล์รูปภาพสินค้า");
      return;
    }
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    try {
      await onAdd({
        title,
        description,
        price: Number(price),
        category,
        image,
      });
      setTitle("");
      setDescription("");
      setPrice("");
      setImage(null);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้างสินค้าไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  const submitRestock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) {
      setError("ไม่พบสินค้าที่จะเติมสต็อก");
      return;
    }
    const items = itemValues.map((item) => item.trim());
    if (items.length !== itemCount || items.some((item) => !item)) {
      setError(`กรุณากรอกข้อมูลให้ครบทั้ง ${itemCount} รายการ`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onRestock(product, items);
      setItemValues(Array(itemCount).fill(""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "เติมสต็อกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="container inner-page admin-page">
      <div className="page-heading">
        <div className="big-icon amber">
          <Settings size={24} />
        </div>
        <div>
          <div className="section-kicker">STORE MANAGEMENT</div>
          <h1>จัดการร้านค้า</h1>
          <p>เพิ่มสินค้าและจัดการสต็อกโค้ด</p>
        </div>
      </div>
      <div className="admin-tabs">
        <button
          className={adminTab === "new" ? "chosen" : ""}
          onClick={() => {
            setAdminTab("new");
            setError("");
          }}
        >
          <Plus size={15} /> เพิ่มสินค้า
        </button>
        <button
          className={adminTab === "stock" ? "chosen" : ""}
          onClick={() => {
            setAdminTab("stock");
            setError("");
          }}
        >
          <Layers size={15} /> เติมสต็อกสินค้า
        </button>
        <span>{products.length} สินค้าในหน้านี้</span>
      </div>
      <section className="panel admin-panel">
        {adminTab === "new" ? (
          <form onSubmit={submitNew}>
            <h2>สร้างรายการสินค้าใหม่</h2>
            <div className="admin-fields">
              <label>
                ชื่อสินค้า
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ชื่อสินค้า"
                />
              </label>
              <label>
                หมวดหมู่
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as Product["category"])
                  }
                >
                  <option value="GAME_CODE">โค้ดเกม</option>
                  <option value="GAME_ID">ไอดีเกม</option>
                </select>
              </label>
              <label>
                ราคาขาย (฿)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="350"
                />
              </label>
              <label>
                รูปภาพสินค้า
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="wide">
                รายละเอียด
                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียดสินค้า"
                />
              </label>
            </div>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? "กำลังบันทึก..." : "เพิ่มสินค้า"} <Plus size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={submitRestock}>
            <h2>เติมสต็อกสินค้า</h2>
            <div className="admin-fields">
              <label className="wide">
                เลือกสินค้า
                <select
                  required
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (คงเหลือ {p.stock})
                    </option>
                  ))}
                </select>
              </label>
              <label className="wide">
                จำนวนรายการที่เพิ่ม
                <input
                  required
                  type="number"
                  min="1"
                  value={itemCount}
                  onChange={(e) => {
                    const count = Math.max(1, Number(e.target.value) || 1);
                    setItemCount(count);
                    setItemValues((values) =>
                      Array.from(
                        { length: count },
                        (_, index) => values[index] ?? "",
                      ),
                    );
                  }}
                />
              </label>
              <div className="item-fields wide">
                {itemValues.map((value, index) => (
                  <label key={index}>
                    รายการที่ {index + 1}
                    <input
                      required
                      value={value}
                      onChange={(e) =>
                        setItemValues((values) =>
                          values.map((item, itemIndex) =>
                            itemIndex === index ? e.target.value : item,
                          ),
                        )
                      }
                      placeholder={`กรอกข้อมูลรายการที่ ${index + 1}`}
                    />
                  </label>
                ))}
              </div>
            </div>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="btn-primary"
              type="submit"
              disabled={busy || !products.length}
            >
              {busy ? "กำลังบันทึก..." : "เติมสต็อก"} <Plus size={16} />
            </button>
          </form>
        )}
      </section>
      <div className="admin-summary">
        <div className="panel">
          <small>สินค้าทั้งหมดในหน้านี้</small>
          <b>{products.length}</b>
        </div>
        <div className="panel">
          <small>รายการพร้อมขาย</small>
          <b>{products.filter((p) => p.stock > 0).length}</b>
        </div>
        <div className="panel">
          <small>สต็อกในหน้านี้</small>
          <b>{products.reduce((sum, p) => sum + p.stock, 0)}</b>
        </div>
      </div>
    </main>
  );
}
