import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Minus,
  Plus,
  Settings2,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import {
  createSegmentToContextClient,
  type SegmentToContextClientOptions,
} from "@mrdamilola/segment-to-context-browser-sdk";

type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  category: string;
  badge: string;
  description: string;
  imageLabel: string;
  themeClass: string;
};

type RouteState =
  | { view: "home" }
  | { view: "product"; productId: string }
  | { view: "cart" };

type CartItem = {
  product: Product;
  quantity: number;
};

const API_KEY_STORAGE_KEY = "segment_to_context.demo_api_key";
const USER_ID_STORAGE_KEY = "segment_to_context.demo_user_id";

const products: Product[] = [
  {
    id: "p1",
    slug: "aurora-headphones",
    name: "Aurora Headphones",
    subtitle: "Spatial audio and adaptive quiet for long sessions",
    price: 249,
    category: "audio",
    badge: "Best seller",
    description:
      "Built for focused work, travel days, and late-night listening with warm detail and a light fit.",
    imageLabel: "AH",
    themeClass: "product-theme-audio",
  },
  {
    id: "p2",
    slug: "atlas-watch",
    name: "Atlas Watch",
    subtitle: "Wellness-first wearable with polished everyday design",
    price: 189,
    category: "wearables",
    badge: "New drop",
    description:
      "Sleep, recovery, steps, and training readiness in a watch you would still want to wear to dinner.",
    imageLabel: "AW",
    themeClass: "product-theme-watch",
  },
  {
    id: "p3",
    slug: "nova-camera",
    name: "Nova Camera",
    subtitle: "Pocket creator camera with stable cinematic motion",
    price: 329,
    category: "creator gear",
    badge: "Creator pick",
    description:
      "A compact content camera for vlogs, product reels, and quick capture without a full production setup.",
    imageLabel: "NC",
    themeClass: "product-theme-camera",
  },
  {
    id: "p4",
    slug: "drift-keyboard",
    name: "Drift Keyboard",
    subtitle: "Low-profile mechanical board for deep focus",
    price: 139,
    category: "workspace",
    badge: "Office favorite",
    description:
      "Quiet enough for shared rooms, tactile enough to still feel satisfying over long writing sessions.",
    imageLabel: "DK",
    themeClass: "product-theme-keyboard",
  },
];

const featuredProduct = products[0];

export default function App() {
  const clientRef =
    useRef<ReturnType<typeof createSegmentToContextClient> | null>(null);
  const [route, setRoute] = useState<RouteState>(() => getRouteFromLocation());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [userId, setUserId] = useState("shopper_042");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [isSetupPanelOpen, setIsSetupPanelOpen] = useState(false);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    [cart]
  );
  const selectedProduct =
    route.view === "product"
      ? products.find((product) => product.id === route.productId) ?? featuredProduct
      : featuredProduct;

  useEffect(() => {
    const savedApiKey = window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
    const savedUserId =
      window.localStorage.getItem(USER_ID_STORAGE_KEY) ?? "shopper_042";

    setApiKey(savedApiKey);
    setUserId(savedUserId);

    if (savedApiKey) {
      initializeClient(savedApiKey, savedUserId);
    }

    const handlePopState = () => {
      setRoute(getRouteFromLocation());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      clientRef.current?.destroy();
    };
  }, []);

  function initializeClient(nextApiKey: string, nextUserId: string) {
    clientRef.current?.destroy();

    const options: SegmentToContextClientOptions = {
      apiKey: nextApiKey,
      userId: nextUserId,
      debug: true,
      autoTrack: {
        pageViews: true,
        sessions: true,
        buttonClicks: true,
        linkClicks: true,
      },
    };

    clientRef.current = createSegmentToContextClient(options);
    setIsConnected(true);
    setSetupMessage("SDK connected. Use your main dashboard to observe live events.");
  }

  async function handleConnect() {
    if (!apiKey.trim()) {
      setSetupMessage("Add a tenant API key before enabling the demo tracking.");
      return;
    }

    try {
      setIsConnecting(true);
      window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      window.localStorage.setItem(USER_ID_STORAGE_KEY, userId.trim());
      initializeClient(apiKey.trim(), userId.trim());
    } finally {
      setIsConnecting(false);
    }
  }

  function navigateTo(nextRoute: RouteState) {
    const nextPath =
      nextRoute.view === "home"
        ? "/"
        : nextRoute.view === "cart"
        ? "/cart"
        : `/products/${
            products.find((product) => product.id === nextRoute.productId)?.slug ?? ""
          }`;

    window.history.pushState({}, "", nextPath);
    setRoute(nextRoute);
  }

  async function sendEvent(
    eventType: string,
    payload: Record<string, unknown>,
    fallbackMessage: string
  ) {
    if (!clientRef.current) {
      setSetupMessage(fallbackMessage);
      return;
    }

    try {
      await clientRef.current.track(eventType, payload);
    } catch (error) {
      setSetupMessage(
        error instanceof Error
          ? error.message
          : "The SDK could not send the event right now."
      );
    }
  }

  async function handleViewProduct(product: Product) {
    navigateTo({ view: "product", productId: product.id });

    await sendEvent(
      "product_view",
      {
        productId: product.id,
        product: product.name,
        category: product.category,
        price: product.price,
      },
      "Tracking is not active yet, so product views are not being sent."
    );
  }

  async function handleAddToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (!existing) {
        return [...current, { product, quantity: 1 }];
      }

      return current.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    });

    await sendEvent(
      "add_to_cart",
      {
        productId: product.id,
        product: product.name,
        category: product.category,
        price: product.price,
        quantity: 1,
      },
      "Tracking is not active yet, so cart events are not being sent."
    );
  }

  async function updateCartQuantity(productId: string, delta: number) {
    const item = cart.find((entry) => entry.product.id === productId);

    setCart((current) =>
      current
        .map((entry) =>
          entry.product.id === productId
            ? { ...entry, quantity: Math.max(0, entry.quantity + delta) }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );

    if (item && delta > 0) {
      await sendEvent(
        "add_to_cart",
        {
          productId: item.product.id,
          product: item.product.name,
          category: item.product.category,
          price: item.product.price,
          quantity: 1,
        },
        "Tracking is not active yet, so cart events are not being sent."
      );
    }
  }

  async function handleOpenCart() {
    navigateTo({ view: "cart" });

    await sendEvent(
      "checkout_started",
      {
        cartValue: Number(cartTotal.toFixed(2)),
        itemCount: cartCount,
      },
      "Tracking is not active yet, so checkout events are not being sent."
    );
  }

  async function handlePurchase() {
    if (cart.length === 0) {
      return;
    }

    await sendEvent(
      "purchase",
      {
        orderId: `ord_${Date.now()}`,
        total: Number(cartTotal.toFixed(2)),
        currency: "USD",
        items: cart.map((item) => ({
          productId: item.product.id,
          product: item.product.name,
          category: item.product.category,
          quantity: item.quantity,
          price: item.product.price,
        })),
      },
      "Tracking is not active yet, so purchase events are not being sent."
    );

    setCart([]);
    navigateTo({ view: "home" });
  }

  return (
    <main className="store-shell">
      <header className="store-header">
        <div className="brand-block">
          <div className="brand-mark">SC</div>
          <div>
            <p className="eyebrow">Studio Cart</p>
            <h1>Objects for focused living</h1>
          </div>
        </div>

        <nav className="store-nav" aria-label="Primary">
          <button onClick={() => navigateTo({ view: "home" })}>Shop</button>
          <button onClick={() => handleViewProduct(featuredProduct)}>Featured</button>
          <button onClick={() => navigateTo({ view: "cart" })}>Bag {cartCount}</button>
        </nav>

        <button
          className="cart-trigger"
          onClick={() => void handleOpenCart()}
          aria-label="Open shopping bag"
        >
          <ShoppingBag className="size-4" />
          <span>{cartCount}</span>
        </button>
      </header>

      <section className="hero-card">
        <div className="hero-copy">
          <p className="hero-label">Summer edit</p>
          <h2>Quiet, useful tech that feels at home on your desk and in your bag.</h2>
          <p>
            A tiny storefront demo built to feel like a real ecommerce experience.
            Browsing, product views, add-to-cart moments, and checkout all happen
            naturally while the SDK runs in the background.
          </p>
          <div className="hero-actions">
            <button onClick={() => handleViewProduct(featuredProduct)}>
              Shop the lead drop
            </button>
            <button className="secondary" onClick={() => navigateTo({ view: "home" })}>
              Explore collection
            </button>
          </div>
        </div>

        <div className={`hero-highlight ${featuredProduct.themeClass}`}>
          <div className="highlight-copy">
            <span className="feature-chip">{featuredProduct.badge}</span>
            <h3>{featuredProduct.name}</h3>
            <p>{featuredProduct.subtitle}</p>
            <strong>${featuredProduct.price}</strong>
          </div>
        </div>
      </section>

      {route.view === "product" ? (
        <ProductDetailView
          product={selectedProduct}
          relatedProducts={products.filter((item) => item.id !== selectedProduct.id).slice(0, 3)}
          onBack={() => navigateTo({ view: "home" })}
          onAddToCart={handleAddToCart}
          onViewProduct={handleViewProduct}
        />
      ) : route.view === "cart" ? (
        <CartView
          cart={cart}
          total={cartTotal}
          onBackToShop={() => navigateTo({ view: "home" })}
          onCheckout={handlePurchase}
          onUpdateQuantity={updateCartQuantity}
        />
      ) : (
        <>
          <section className="section-heading">
            <div>
              <p className="eyebrow">Featured catalog</p>
              <h2>Chosen for hybrid work, travel, and creator routines</h2>
            </div>
            <button className="inline-link" onClick={() => handleViewProduct(products[2])}>
              Browse creator gear
              <ChevronRight className="size-4" />
            </button>
          </section>

          <section className="product-grid">
            {products.map((product) => (
              <article key={product.id} className="product-card">
                <button
                  className={`product-visual ${product.themeClass}`}
                  onClick={() => handleViewProduct(product)}
                  aria-label={`View ${product.name}`}
                >
                  <span>{product.imageLabel}</span>
                </button>

                <div className="product-meta">
                  <div className="product-topline">
                    <span>{product.badge}</span>
                    <strong>${product.price}</strong>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.subtitle}</p>
                  <div className="rating-row">
                    <Star className="size-4" />
                    <span>4.8 rating</span>
                  </div>
                </div>

                <div className="product-actions">
                  <button onClick={() => handleViewProduct(product)}>View details</button>
                  <button className="secondary" onClick={() => handleAddToCart(product)}>
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      <button
        className="demo-panel-trigger"
        onClick={() => setIsSetupPanelOpen(true)}
        aria-label="Open demo controls"
      >
        <Settings2 className="size-4" />
        Demo controls
      </button>

      {isSetupPanelOpen ? (
        <div className="demo-overlay" role="dialog" aria-modal="true">
          <div className="demo-panel">
            <div className="demo-panel-header">
              <div>
                <p className="eyebrow">Developer setup</p>
                <h2>SDK connection</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setIsSetupPanelOpen(false)}
                aria-label="Close demo controls"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="demo-panel-copy">
              This panel is only here for demo setup. In a real storefront, customers
              would never see tracking controls or event output.
            </p>

            <div className="setup-grid">
              <label>
                Tenant API key
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="stc_xxx"
                />
              </label>

              <label>
                Shopper ID
                <input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="shopper_042"
                />
              </label>
            </div>

            <div className="demo-panel-footer">
              <button onClick={() => void handleConnect()} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Enable tracking"}
              </button>
              <span className={`connection-badge ${isConnected ? "active" : ""}`}>
                {isConnected ? "SDK connected" : "SDK idle"}
              </span>
            </div>

            {setupMessage ? <p className="setup-message">{setupMessage}</p> : null}

            <p className="setup-note">
              Verify the actual event flow in your main dashboard stream, not here.
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ProductDetailView({
  product,
  relatedProducts,
  onBack,
  onAddToCart,
  onViewProduct,
}: {
  product: Product;
  relatedProducts: Product[];
  onBack: () => void;
  onAddToCart: (product: Product) => Promise<void>;
  onViewProduct: (product: Product) => Promise<void>;
}) {
  return (
    <section className="detail-layout">
      <div className={`detail-visual ${product.themeClass}`}>
        <span>{product.imageLabel}</span>
      </div>

      <div className="detail-copy">
        <button className="inline-link back-link" onClick={onBack}>
          Back to catalog
        </button>
        <p className="eyebrow">{product.badge}</p>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <div className="detail-meta">
          <strong>${product.price}</strong>
          <span>{product.category}</span>
        </div>
        <div className="product-actions">
          <button onClick={() => void onAddToCart(product)}>Add to cart</button>
          <button
            className="secondary"
            onClick={() => void onViewProduct(relatedProducts[0])}
          >
            View related
          </button>
        </div>
      </div>

      <div className="related-panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">You may also like</p>
            <h3>Related picks</h3>
          </div>
        </div>
        <div className="related-grid">
          {relatedProducts.map((item) => (
            <button
              key={item.id}
              className="related-card"
              onClick={() => void onViewProduct(item)}
            >
              <span className={`related-thumb ${item.themeClass}`}>{item.imageLabel}</span>
              <strong>{item.name}</strong>
              <small>${item.price}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CartView({
  cart,
  total,
  onBackToShop,
  onCheckout,
  onUpdateQuantity,
}: {
  cart: CartItem[];
  total: number;
  onBackToShop: () => void;
  onCheckout: () => Promise<void>;
  onUpdateQuantity: (productId: string, delta: number) => Promise<void>;
}) {
  return (
    <section className="cart-layout">
      <div className="cart-panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Your bag</p>
            <h2>Checkout preview</h2>
          </div>
          <button className="inline-link" onClick={onBackToShop}>
            Continue shopping
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-state">
            <p>Your bag is still empty.</p>
            <button onClick={onBackToShop}>Browse products</button>
          </div>
        ) : (
          <div className="cart-list">
            {cart.map((item) => (
              <article key={item.product.id} className="cart-row">
                <div>
                  <strong>{item.product.name}</strong>
                  <p>{item.product.subtitle}</p>
                </div>
                <div className="cart-controls">
                  <button
                    className="icon-button"
                    onClick={() => void onUpdateQuantity(item.product.id, -1)}
                    aria-label={`Decrease ${item.product.name}`}
                  >
                    <Minus className="size-4" />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="icon-button"
                    onClick={() => void onUpdateQuantity(item.product.id, 1)}
                    aria-label={`Increase ${item.product.name}`}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <strong>${(item.quantity * item.product.price).toFixed(2)}</strong>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="summary-panel">
        <p className="eyebrow">Order summary</p>
        <h3>${total.toFixed(2)}</h3>
        <p>
          This runs a dummy purchase event so you can verify the full SDK flow
          through the backend and dashboard.
        </p>
        <button onClick={() => void onCheckout()} disabled={cart.length === 0}>
          Complete dummy purchase
        </button>
      </aside>
    </section>
  );
}

function getRouteFromLocation(): RouteState {
  if (typeof window === "undefined") {
    return { view: "home" };
  }

  const pathname = window.location.pathname;

  if (pathname === "/cart") {
    return { view: "cart" };
  }

  if (pathname.startsWith("/products/")) {
    const slug = pathname.replace("/products/", "");
    const product = products.find((item) => item.slug === slug);

    if (product) {
      return { view: "product", productId: product.id };
    }
  }

  return { view: "home" };
}
