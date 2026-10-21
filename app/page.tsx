"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Admin } from "./components/Admin";
import { API_BASE_URL, getApiError } from "./lib/api";
import { login, logout as logoutRequest, register } from "./lib/api/auth";
import { createOrder, getOrders } from "./lib/api/orders";
import {
  createProduct as createProductRequest,
  getProducts,
  restockProduct as restockProductRequest,
} from "./lib/api/products";
import { depositWithAngpao } from "./lib/api/payments";
import { getCurrentUser } from "./lib/api/users";
import {
  money,
  toProduct,
  type NewProductPayload,
  type Order,
  type Product,
  type ProductPage,
  type UserInfo,
} from "./types";
import {
  Gamepad2,
  ShoppingBag,
  Wallet,
  KeyRound,
  Settings,
  Search,
  Zap,
  Sparkles,
  ShieldCheck,
  Star,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  CreditCard,
  Layers,
  Menu,
  UserRound,
  LockKeyhole,
  LoaderCircle,
  QrCode,
  LogOut,
} from "lucide-react";

export default function Home() {
  const [tab, setTab] = useState("store");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(0);
  const [productRefresh, setProductRefresh] = useState(0);
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersRefresh, setOrdersRefresh] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qrcode" | "angpao">(
    "angpao",
  );
  const [angpaoUrl, setAngpaoUrl] = useState("");
  const [angpaoBusy, setAngpaoBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [revealed, setRevealed] = useState<string[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [adminTab, setAdminTab] = useState("new");
  const [authOpen, setAuthOpen] = useState(false);
  const authBackdropPressed = useRef(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [authenticatedUserLabel, setAuthenticatedUserLabel] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [userRole, setUserRole] = useState<UserInfo["role"] | null>(null);
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then(async (response) => {
        if (!response.ok) throw new Error("Not authenticated");
        return (await response.json()) as UserInfo;
      })
      .then((profile) => {
        if (!cancelled) {
          setAuthenticatedUserLabel(profile.email || profile.username);
          setUserRole(profile.role);
          setBalance(profile.balance);
        }
      })
      .catch(() => {
        /* A missing session simply leaves the visitor signed out. */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    getProducts(productPage)
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`โหลดสินค้าไม่สำเร็จ (${response.status})`);
        return (await response.json()) as ProductPage;
      })
      .then((page) => {
        if (!cancelled) {
          setProducts(page.content.map(toProduct));
          setProductTotalPages(page.totalPages);
          setProductsError("");
        }
      })
      .catch((error) => {
        if (!cancelled)
          setProductsError(
            error instanceof Error
              ? error.message
              : "เชื่อมต่อระบบสินค้าไม่สำเร็จ",
          );
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productPage, productRefresh]);
  useEffect(() => {
    if (tab !== "orders" || !authenticatedUserLabel) return;
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError("");
    getOrders()
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            await getApiError(
              response,
              `โหลดประวัติออเดอร์ไม่สำเร็จ (${response.status})`,
            ),
          );
        return (await response.json()) as Order[];
      })
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((error) => {
        if (!cancelled)
          setOrdersError(
            error instanceof Error
              ? error.message
              : "เชื่อมต่อประวัติออเดอร์ไม่สำเร็จ",
          );
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, ordersRefresh, authenticatedUserLabel]);
  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          (filter === "all" || p.category === filter) &&
          `${p.title} ${p.categoryLabel}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, filter, query],
  );
  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3200);
  };
  const openTopup = () => {
    if (!authenticatedUserLabel) {
      setAuthMode("login");
      setAuthError("");
      setAuthOpen(true);
      return;
    }
    setTab("topup");
  };
  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const response =
        authMode === "login"
          ? await login(username, password)
          : await register(username, password);
      if (!response.ok) {
        let message =
          authMode === "login"
            ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
            : "สมัครสมาชิกไม่สำเร็จ";
        try {
          const result = await response.json();
          if (typeof result.message === "string") message = result.message;
          else if (typeof result.error === "string") message = result.error;
        } catch {
          /* The API may return an empty or non-JSON error response. */
        }
        throw new Error(message);
      }
      if (authMode === "register") {
        setAuthMode("login");
        setPassword("");
        notify("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
      } else {
        const profileResponse = await getCurrentUser();
        if (!profileResponse.ok)
          throw new Error(
            "เข้าสู่ระบบสำเร็จ แต่โหลดข้อมูลผู้ใช้ไม่สำเร็จ กรุณาลองอีกครั้ง",
          );
        const profile = (await profileResponse.json()) as UserInfo;
        const userLabel = profile.email || profile.username;
        setAuthenticatedUserLabel(userLabel);
        setUserRole(profile.role);
        setBalance(profile.balance);
        setOrders([]);
        setOrdersError("");
        setOrdersRefresh((value) => value + 1);
        notify(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${userLabel}`);
        setAuthOpen(false);
        setPassword("");
      }
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
    } finally {
      setAuthBusy(false);
    }
  };
  const logout = async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      const response = await logoutRequest();
      if (!response.ok && response.status !== 401)
        throw new Error(
          await getApiError(response, "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง"),
        );
      setAuthenticatedUserLabel("");
      setUserRole(null);
      setBalance(0);
      setOrders([]);
      setOrdersError("");
      setOrdersLoading(false);
      setRevealed([]);
      setSelected(null);
      setOrderError("");
      setOrdersRefresh((value) => value + 1);
      setTab("store");
      notify("ออกจากระบบเรียบร้อยแล้ว");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
    } finally {
      setLogoutBusy(false);
    }
  };
  const buy = async () => {
    if (!selected) return;
    const total = selected.price * purchaseQuantity;
    if (purchaseQuantity < 1 || purchaseQuantity > selected.stock) {
      setOrderError("จำนวนสินค้าต้องไม่เกินสต็อกที่มี");
      return;
    }
    if (balance < total) {
      setSelected(null);
      openTopup();
      notify("ยอดเงินไม่เพียงพอ กรุณาเติมเงินก่อน");
      return;
    }
    setOrderBusy(true);
    setOrderError("");
    try {
      const response = await createOrder(selected.id, purchaseQuantity);
      if (!response.ok)
        throw new Error(
          await getApiError(response, "สั่งซื้อไม่สำเร็จ กรุณาลองอีกครั้ง"),
        );
      setBalance((value) => value - total);
      setProductRefresh((value) => value + 1);
      setSelected(null);
      setTab("orders");
      notify("สั่งซื้อสำเร็จ! กำลังโหลดรายละเอียดคำสั่งซื้อ");
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : "เชื่อมต่อระบบสั่งซื้อไม่สำเร็จ",
      );
    } finally {
      setOrderBusy(false);
    }
  };
  const createProduct = async (data: NewProductPayload) => {
    const response = await createProductRequest(data);
    if (!response.ok)
      throw new Error(await getApiError(response, "สร้างสินค้าไม่สำเร็จ"));
    setProductPage(0);
    setProductRefresh((value) => value + 1);
    notify("เพิ่มสินค้าเรียบร้อยแล้ว");
  };
  const restockProduct = async (productId: string, items: string[]) => {
    const response = await restockProductRequest(productId, items);
    if (!response.ok)
      throw new Error(await getApiError(response, "เติมสต็อกไม่สำเร็จ"));
    setProductRefresh((value) => value + 1);
    notify(`เติมโค้ด ${items.length} รายการเรียบร้อยแล้ว`);
  };
  const submitAngpao = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let voucherCode = "";
    try {
      const url = new URL(angpaoUrl);
      if (
        url.hostname !== "gift.truemoney.com" ||
        !url.pathname.startsWith("/campaign/")
      )
        throw new Error("กรุณากรอก URL ซอง TrueMoney Angpao ที่ถูกต้อง");
      voucherCode = url.searchParams.get("v") ?? "";
      if (!voucherCode) throw new Error("ไม่พบรหัสซอง (v) ใน URL ที่กรอก");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "กรุณากรอก URL ซอง TrueMoney Angpao ที่ถูกต้อง",
      );
      return;
    }
    setAngpaoBusy(true);
    try {
      const response = await depositWithAngpao(voucherCode);
      if (!response.ok)
        throw new Error(
          await getApiError(
            response,
            "เติมเงินไม่สำเร็จ กรุณาตรวจสอบซองแล้วลองอีกครั้ง",
          ),
        );
      setAngpaoUrl("");
      try {
        const profileResponse = await getCurrentUser();
        if (profileResponse.ok) {
          const profile = (await profileResponse.json()) as UserInfo;
          setAuthenticatedUserLabel(profile.email || profile.username);
          setUserRole(profile.role);
          setBalance(profile.balance);
        }
      } catch {
        /* The deposit succeeded; keep the displayed balance if refresh is temporarily unavailable. */
      }
      notify("เติมเงินผ่าน TrueMoney Angpao สำเร็จ");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "เชื่อมต่อระบบเติมเงินไม่สำเร็จ",
      );
    } finally {
      setAngpaoBusy(false);
    }
  };
  const nav = [
    { id: "store", label: "ร้านค้า", Icon: ShoppingBag },
    ...(authenticatedUserLabel
      ? [{ id: "topup", label: "เติมเงิน", Icon: Wallet }]
      : []),
    ...(authenticatedUserLabel
      ? [{ id: "orders", label: "คลัง", Icon: KeyRound }]
      : []),
    ...(userRole === "ADMIN"
      ? [{ id: "admin", label: "แอดมิน", Icon: Settings }]
      : []),
  ];
  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="nav-wrap">
          <button className="brand" onClick={() => setTab("store")}>
            <span className="brand-mark">
              <Gamepad2 size={25} />
            </span>
            <span>
              <b>EzyShop</b>
              <small>GAMING STORE & CODES</small>
            </span>
          </button>
          <label className="search">
            <Search size={17} />
            <input
              placeholder="ค้นหาเกม โค้ด หรือไอดี..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setTab("store");
              }}
            />
            <kbd>⌘ K</kbd>
          </label>
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu />
          </button>
          <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
            {nav.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`nav-item ${tab === id ? "active" : ""}`}
                onClick={() => {
                  setTab(id);
                  setMobileMenu(false);
                }}
              >
                <Icon size={17} />
                <span>{label}</span>
                {id === "orders" && (
                  <i className="nav-count">{orders.length}</i>
                )}
              </button>
            ))}
            <div className="nav-divider" />
            {authenticatedUserLabel ? (
              <div className="account">
                <span className="avatar">
                  {authenticatedUserLabel.slice(0, 2).toUpperCase()}
                </span>
                <span className="account-meta">
                  <b>
                    {authenticatedUserLabel}
                    {userRole === "ADMIN" && <i>ADMIN</i>}
                  </b>
                  <small>
                    กระเป๋าเงิน <strong>{money(balance)}</strong>
                  </small>
                </span>
                <button
                  className="logout-button"
                  onClick={logout}
                  disabled={logoutBusy}
                  aria-label="ออกจากระบบ"
                  title="ออกจากระบบ"
                >
                  <LogOut size={15} />
                  <span>{logoutBusy ? "กำลังออก..." : "ออกจากระบบ"}</span>
                </button>
              </div>
            ) : (
              <button
                className="login-trigger"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                  setAuthOpen(true);
                }}
              >
                <UserRound size={15} /> เข้าสู่ระบบ
              </button>
            )}
          </nav>
        </div>
      </header>

      {tab === "store" && (
        <main className="container store-page">
          <section className="hero">
            <div className="hero-glow one" />
            <div className="hero-glow two" />
            <div className="hero-copy">
              <div className="eyebrow">
                <Sparkles size={14} /> เกมโปรดของคุณ พร้อมส่งตลอด 24 ชั่วโมง
              </div>
              <h1>
                เติมความสนุก
                <br />
                <span>ให้ทุกเกม</span>ในราคาที่ใช่
              </h1>
              <p>
                โค้ดเกม ไอดี และบัตรเติมเงินแท้ ส่งมอบอัตโนมัติ
                <br className="desktop-break" />
                ปลอดภัย รวดเร็ว พร้อมให้คุณกลับไปเล่นได้ทันที
              </p>
              <div className="hero-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setFilter("GAME_CODE");
                    document
                      .getElementById("catalog")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  เลือกซื้อโค้ด <ChevronRight size={17} />
                </button>
                <button className="btn-ghost" onClick={openTopup}>
                  <Wallet size={16} /> เติมเงินเข้าวอลเล็ต
                </button>
              </div>
              <div className="hero-proof">
                <span>
                  <ShieldCheck size={15} /> ปลอดภัย 100%
                </span>
                <span>
                  <Zap size={15} /> ส่งโค้ดทันที
                </span>
                <span>
                  <Star size={15} fill="currentColor" /> รีวิว 4.9/5
                </span>
              </div>
            </div>
            <div className="hero-art">
              <div className="art-orbit orbit-a" />
              <div className="art-orbit orbit-b" />
              <div className="art-disc">
                <Gamepad2 size={115} strokeWidth={1.05} />
                <span className="art-spark spark-a">✦</span>
                <span className="art-spark spark-b">✧</span>
              </div>
              <div className="floating-card">
                <span className="mini-icon">
                  <KeyRound size={16} />
                </span>
                <span>
                  <b>โค้ดพร้อมส่ง</b>
                  <small>จัดส่งใน 10 วินาที</small>
                </span>
                <span className="ready">●</span>
              </div>
              <div className="art-stat">
                <span>★</span>
                <b>4.9</b>
                <small>Trusted store</small>
              </div>
            </div>
            <div className="hero-index">
              01 <i /> 03
            </div>
          </section>
          <div className="trust-strip">
            <div>
              <span className="trust-icon cyan">
                <Zap size={19} />
              </span>
              <span>
                <b>ส่งมอบอัตโนมัติ</b>
                <small>รับโค้ดได้ทันที 24 ชม.</small>
              </span>
            </div>
            <div>
              <span className="trust-icon purple">
                <ShieldCheck size={19} />
              </span>
              <span>
                <b>จ่ายเงินปลอดภัย</b>
                <small>PromptPay & Wallet</small>
              </span>
            </div>
            <div>
              <span className="trust-icon pink">
                <CheckCircle2 size={19} />
              </span>
              <span>
                <b>รับประกันทุกคำสั่งซื้อ</b>
                <small>ทีมงานพร้อมช่วยเหลือ</small>
              </span>
            </div>
            <div>
              <span className="trust-icon green">
                <Wallet size={19} />
              </span>
              <span>
                <b>ราคาเป็นมิตร</b>
                <small>คุ้มค่าทุกการเติม</small>
              </span>
            </div>
          </div>
          <section id="catalog" className="catalog">
            <div className="section-heading">
              <div>
                <div className="section-kicker">DISCOVER YOUR NEXT GAME</div>
                <h2>
                  เลือกไอเทมที่ใช่ <span>.</span>
                </h2>
              </div>
              <span className="result-count">
                พบ <b>{visible.length}</b> รายการ
              </span>
            </div>
            <div className="catalog-tools">
              <div className="filters">
                {[
                  { id: "all", label: "ทั้งหมด", Icon: Layers },
                  { id: "GAME_CODE", label: "โค้ดเกม", Icon: KeyRound },
                  { id: "GAME_ID", label: "ไอดีเกม", Icon: Gamepad2 },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    className={`filter ${filter === id ? "selected" : ""}`}
                    onClick={() => setFilter(id)}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="sort"
                onClick={() => setProducts([...products].reverse())}
              >
                ✳ <span>สินค้าแนะนำ</span>⌄
              </button>
            </div>
            {productsLoading ? (
              <div className="empty-state">กำลังโหลดสินค้า...</div>
            ) : productsError ? (
              <div className="empty-state">{productsError}</div>
            ) : visible.length ? (
              <div className="product-grid">
                {visible.map((p) => (
                  <article className="product-card" key={p.id}>
                    <div
                      className="product-image"
                      style={{
                        backgroundImage: `linear-gradient(180deg,rgba(6,9,19,.06),rgba(6,9,19,.6)),url("${p.image}")`,
                      }}
                    >
                      <div className="product-labels">
                        <span className="category-tag">{p.categoryLabel}</span>
                        {p.tags.slice(0, 1).map((tag) => (
                          <span className="hot-tag" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      {authenticatedUserLabel && (
                        <span className={`stock ${p.stock ? "" : "soldout"}`}>
                          <i />{" "}
                          {p.stock ? `พร้อมส่ง ${p.stock} ชิ้น` : "สินค้าหมด"}
                        </span>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="product-title">
                        <h3>{p.title}</h3>
                      </div>
                      <p>{p.description}</p>
                      <div className="product-meta">
                        <span>
                          <ShieldCheck size={14} /> ขายแล้ว {p.sold}
                        </span>
                        <span>ส่งทันที</span>
                      </div>
                      <div className="product-buy">
                        <div>
                          <b>{money(p.price)}</b>
                          {p.originalPrice > p.price && (
                            <del>{money(p.originalPrice)}</del>
                          )}
                        </div>
                        <button
                          disabled={!p.stock}
                          onClick={() => {
                            setSelected(p);
                            setPurchaseQuantity(1);
                            setOrderError("");
                          }}
                        >
                          <ShoppingBag size={15} /> เลือกซื้อ
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                ไม่พบสินค้าที่ค้นหา ลองเปลี่ยนคำค้นหาหรือหมวดหมู่
              </div>
            )}
            {!productsLoading && !productsError && productTotalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={productPage === 0}
                  onClick={() => setProductPage((page) => page - 1)}
                >
                  ก่อนหน้า
                </button>
                <span>
                  หน้า {productPage + 1} / {productTotalPages}
                </span>
                <button
                  disabled={productPage + 1 >= productTotalPages}
                  onClick={() => setProductPage((page) => page + 1)}
                >
                  ถัดไป
                </button>
              </div>
            )}
          </section>
          <section className="bottom-banner">
            <div>
              <div className="section-kicker">READY WHEN YOU ARE</div>
              <h2>พร้อมกลับเข้าสู่เกมแล้วหรือยัง?</h2>
              <p>เติมวอลเล็ต แล้วรับโค้ดที่คุณต้องการได้เลย</p>
            </div>
            <button className="btn-primary" onClick={openTopup}>
              เติมเงินเลย <ChevronRight size={17} />
            </button>
          </section>
        </main>
      )}

      {tab === "topup" && authenticatedUserLabel && (
        <main className="container inner-page">
          <div className="page-heading">
            <div className="big-icon green">
              <Wallet size={24} />
            </div>
            <div>
              <div className="section-kicker">WALLET TOP UP</div>
              <h1>เติมเงินเข้าวอลเล็ต</h1>
              <p>เลือกช่องทางเติมเงินที่ต้องการ</p>
            </div>
          </div>
          <div className="topup-layout">
            <section className="panel topup-form">
              <h2>ช่องทางชำระเงิน</h2>
              <p>เลือกวิธีเติมเงินเข้าบัญชีของคุณ</p>
              <button
                type="button"
                className={`payment-option unavailable ${paymentMethod === "qrcode" ? "chosen" : ""}`}
                onClick={() => setPaymentMethod("qrcode")}
                disabled
              >
                <span className="prompt-icon">
                  <QrCode size={17} />
                </span>
                <span>
                  <b>QR Code</b>
                  <small>ยังไม่พร้อมให้บริการ</small>
                </span>
                <span className="unavailable-pill">ไม่พร้อมใช้งาน</span>
              </button>
              <button
                type="button"
                className={`payment-option ${paymentMethod === "angpao" ? "chosen" : ""}`}
                onClick={() => setPaymentMethod("angpao")}
              >
                <span className="angpao-icon">฿</span>
                <span>
                  <b>TrueMoney Angpao</b>
                  <small>เติมเงินผ่านลิงก์ซองของขวัญ</small>
                </span>
                <span className="radio-on" />
              </button>
              <p className="secure-note">
                <ShieldCheck size={14} /> ตรวจสอบ URL ก่อนกดเติมเงิน
              </p>
            </section>
            <section className="panel topup-form angpao-panel">
              {paymentMethod === "angpao" ? (
                <form onSubmit={submitAngpao}>
                  <h2>เติมเงินด้วย TrueMoney Angpao</h2>
                  <p>วาง URL ซองของขวัญ TrueMoney เพื่อเติมเงินเข้าวอลเล็ต</p>
                  <label className="field-label" htmlFor="angpao-url">
                    URL ซอง Angpao
                  </label>
                  <div className="amount-input">
                    <input
                      id="angpao-url"
                      type="url"
                      required
                      value={angpaoUrl}
                      onChange={(e) => setAngpaoUrl(e.target.value)}
                      placeholder="https://gift.truemoney.com/campaign/?v=..."
                    />
                  </div>
                  <button
                    className="btn-primary full angpao-submit"
                    type="submit"
                    disabled={angpaoBusy}
                  >
                    {angpaoBusy ? "กำลังตรวจสอบซอง..." : "เติมเงิน"}{" "}
                    {!angpaoBusy && <ChevronRight size={17} />}
                  </button>
                </form>
              ) : (
                <div className="qr-disabled">
                  <QrCode size={28} />
                  <b>QR Code ยังไม่พร้อมให้บริการ</b>
                  <span>กรุณาเลือก TrueMoney Angpao</span>
                </div>
              )}
              <div className="balance-row">
                <span>ยอดเงินปัจจุบัน</span>
                <b>{money(balance)}</b>
              </div>
            </section>
          </div>
        </main>
      )}

      {tab === "orders" && authenticatedUserLabel && (
        <main className="container inner-page">
          <div className="page-heading">
            <div className="big-icon purple">
              <KeyRound size={24} />
            </div>
            <div>
              <div className="section-kicker">YOUR GAME INVENTORY</div>
              <h1>ประวัติการสั่งซื้อ</h1>
              <p>โค้ดและไอดีเกมทั้งหมดที่คุณสั่งซื้อ</p>
            </div>
            <span className="order-total">{orders.length} รายการ</span>
          </div>
          <div className="order-list">
            {ordersLoading ? (
              <div className="panel empty-state">
                กำลังโหลดประวัติออเดอร์...
              </div>
            ) : ordersError ? (
              <div className="panel empty-state">{ordersError}</div>
            ) : orders.length === 0 ? (
              <div className="panel empty-state">
                ยังไม่มีประวัติการสั่งซื้อ
              </div>
            ) : (
              orders.map((order) => (
                <article className="panel order-card" key={order.orderId}>
                  <div className="order-head">
                    <span className="order-id">{order.orderId}</span>
                    <span>
                      {order.category === "GAME_ID" ? "ไอดีเกม" : "โค้ดเกม"} ·{" "}
                      {order.quantity} รายการ
                    </span>
                    <b>
                      <CheckCircle2 size={14} />{" "}
                      {order.status === "SUCCESS" ? "สำเร็จ" : order.status}
                    </b>
                  </div>
                  <div className="order-body">
                    <div>
                      <h3>{order.title}</h3>
                      <small>
                        รายการที่ได้รับ {order.items.length} / {order.quantity}
                      </small>
                    </div>
                    <div className="order-items">
                      {order.items.map((item, index) => {
                        const itemKey = `${order.orderId}-${index}`;
                        const isRevealed = revealed.includes(itemKey);
                        return (
                          <div className="code-box" key={itemKey}>
                            <code>
                              {isRevealed ? item.data : "••••••••••••••••••••"}
                            </code>
                            <button
                              aria-label="แสดงหรือซ่อนข้อมูล"
                              onClick={() =>
                                setRevealed((values) =>
                                  isRevealed
                                    ? values.filter((id) => id !== itemKey)
                                    : [...values, itemKey],
                                )
                              }
                            >
                              {isRevealed ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                            <button
                              className="copy"
                              onClick={() => {
                                navigator.clipboard?.writeText(item.data);
                                notify("คัดลอกข้อมูลเรียบร้อยแล้ว");
                              }}
                            >
                              <Copy size={14} /> คัดลอก
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
      )}

      {tab === "admin" && userRole === "ADMIN" && (
        <Admin
          products={products}
          onAdd={createProduct}
          onRestock={restockProduct}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
        />
      )}
      <footer>
        <div className="footer-brand">
          <span className="brand-mark">
            <Gamepad2 size={21} />
          </span>
          <span>
            <b>EzyShop</b>
            <small>GAMING STORE & CODES</small>
          </span>
        </div>
        <span>© 2026 EzyShop. เติมเกมให้สุด แล้วไปให้สุด</span>
        <span>
          <ShieldCheck size={14} /> Secure checkout
        </span>
      </footer>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {authOpen && (
        <div
          className="modal-backdrop"
          onPointerDown={(event) => {
            authBackdropPressed.current = event.target === event.currentTarget;
          }}
          onClick={(event) => {
            const clickedBackdrop =
              authBackdropPressed.current && event.target === event.currentTarget;
            authBackdropPressed.current = false;
            if (clickedBackdrop && !authBusy) setAuthOpen(false);
          }}
        >
          <section className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              aria-label="ปิด"
              disabled={authBusy}
              onClick={() => setAuthOpen(false)}
            >
              <X size={19} />
            </button>
            <div className="auth-brand">
              <span className="brand-mark">
                <Gamepad2 size={23} />
              </span>
              <span>
                <b>EzyShop</b>
                <small>GAMING STORE & CODES</small>
              </span>
            </div>
            <div className="section-kicker">
              {authMode === "login" ? "WELCOME BACK" : "JOIN THE COMMUNITY"}
            </div>
            <h2>{authMode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}</h2>
            <p className="auth-description">
              {authMode === "login"
                ? "เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อและวอลเล็ต"
                : "สมัครสมาชิกเพื่อเริ่มต้นใช้งาน EzyShop"}
            </p>
            {authMode === "login" && (
              <button
                className="google-login"
                type="button"
                onClick={() =>
                  window.location.assign(`${API_BASE_URL}/auth/login/google`)
                }
              >
                <svg
                  className="google-mark"
                  aria-hidden="true"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.9c-.58 2.96-2.26 5.48-4.77 7.18l7.73 6C44.37 37.93 46.98 31.84 46.98 24.55Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                  />
                </svg>
                เข้าสู่ระบบด้วย Google
              </button>
            )}
            <form onSubmit={submitAuth} className="auth-form">
              <label>
                ชื่อผู้ใช้
                <div className="auth-input">
                  <UserRound size={16} />
                  <input
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="กรอกชื่อผู้ใช้"
                  />
                </div>
              </label>
              <label>
                รหัสผ่าน
                <div className="auth-input">
                  <LockKeyhole size={16} />
                  <input
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                  />
                </div>
              </label>
              {authError && (
                <div className="auth-error" role="alert">
                  {authError}
                </div>
              )}
              <button
                className="btn-primary full auth-submit"
                type="submit"
                disabled={authBusy}
              >
                {authBusy ? (
                  <>
                    <LoaderCircle className="spinning" size={16} />{" "}
                    กำลังดำเนินการ...
                  </>
                ) : authMode === "login" ? (
                  "เข้าสู่ระบบ"
                ) : (
                  "สมัครสมาชิก"
                )}{" "}
                {!authBusy && <ChevronRight size={17} />}
              </button>
            </form>
            <div className="auth-switch">
              {authMode === "login" ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"}{" "}
              <button
                disabled={authBusy}
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError("");
                }}
              >
                {authMode === "login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
              </button>
            </div>
          </section>
        </div>
      )}
      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => !orderBusy && setSelected(null)}
        >
          <section
            className="purchase-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              disabled={orderBusy}
              onClick={() => setSelected(null)}
            >
              <X size={19} />
            </button>
            <div
              className="modal-image"
              style={{
                backgroundImage: `linear-gradient(180deg,transparent,#080c17),url("${selected.image}")`,
              }}
            />
            <span className="section-kicker">ยืนยันคำสั่งซื้อ</span>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            <label className="quantity-control">
              <span>
                จำนวน{" "}
                {authenticatedUserLabel && (
                  <small>(มี {selected.stock} ชิ้น)</small>
                )}
              </span>
              <input
                aria-label="จำนวนสินค้า"
                type="number"
                min={1}
                max={selected.stock}
                step={1}
                value={purchaseQuantity}
                disabled={orderBusy}
                onChange={(event) => {
                  setPurchaseQuantity(
                    Math.min(
                      selected.stock,
                      Math.max(1, Number(event.target.value) || 1),
                    ),
                  );
                  setOrderError("");
                }}
              />
            </label>
            <div className="modal-row">
              <span>ยอดชำระ</span>
              <b>{money(selected.price * purchaseQuantity)}</b>
            </div>
            <div className="modal-row">
              <span>ยอดเงินในวอลเล็ต</span>
              <b>{money(balance)}</b>
            </div>
            {balance < selected.price * purchaseQuantity && (
              <div className="insufficient">
                ยอดเงินไม่เพียงพอ · ขาดอีก{" "}
                {money(selected.price * purchaseQuantity - balance)}
              </div>
            )}
            {orderError && (
              <div className="insufficient" role="alert">
                {orderError}
              </div>
            )}
            <button
              className="btn-primary full"
              disabled={orderBusy}
              onClick={buy}
            >
              {orderBusy
                ? "กำลังสั่งซื้อ..."
                : balance >= selected.price * purchaseQuantity
                  ? "ยืนยันและชำระเงิน"
                  : "เติมเงินเพื่อซื้อ"}{" "}
              {!orderBusy && <ChevronRight size={17} />}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
