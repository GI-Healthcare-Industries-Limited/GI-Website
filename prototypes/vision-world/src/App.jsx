import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  categories,
  destinations,
  getDestination,
  inCategory,
} from "./destinations";
import { Icon } from "./Icons";
import { assetPath, liveSite, sitePath } from "./site-paths";
const World = lazy(() => import("./World"));
const SUPPORTERS = [
  ["uksa", "UK Space Agency"],
  ["innovate_uk", "Innovate UK"],
  ["nr", "The National Robotarium"],
  ["hwu", "Heriot-Watt University"],
  ["eagle_labs", "Barclays Eagle Labs"],
  ["uwe", "UWE Bristol"],
  ["uob", "University of Bristol"],
  ["santander", "Santander Universities"],
  ["mod", "Ministry of Defence"],
];
function initialView() {
  const [id, mode] = window.location.hash.slice(1).split("/");
  const item = getDestination(id);
  return {
    id: item?.id ?? null,
    inside: !!item?.featured && mode === "inside",
  };
}
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? (
      <div className="render-error">
        The 3D view couldn’t load. You can still explore every destination in
        list view.
      </div>
    ) : (
      this.props.children
    );
  }
}
function useMotionPreference() {
  const [reduce, setReduce] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(m.matches);
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  return reduce;
}
export function App() {
  const [view, setView] = useState(initialView);
  const selected = view.id,
    inside = view.inside;
  const [category, setCategory] = useState("all");
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [zoomAction, setZoomAction] = useState({ serial: 0, delta: 0 });
  const [ready, setReady] = useState(false);
  const [travelling, setTravelling] = useState(false);
  const [hover, setHover] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const sceneRef = useRef();
  const [sceneVisible, setSceneVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(!document.hidden);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setSceneVisible(entry.isIntersecting),
    );
    observer.observe(sceneRef.current);
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const reducedMotion = useMotionPreference();
  const detailHeading = useRef(),
    listRef = useRef(),
    listTrigger = useRef(),
    selectTrigger = useRef();
  const item = getDestination(selected);
  const onReady = useCallback(() => setReady(true), []);
  const onTravel = useCallback((v) => setTravelling(v), []);
  const onArrive = useCallback(() => setTravelling(false), []);
  const onFailure = useCallback(() => {
    setFailed(true);
    setReady(true);
    setListOpen(true);
  }, []);
  const onHover = useCallback((label) => setHover(label), []);
  const select = useCallback((id) => {
    if (!getDestination(id)) return;
    selectTrigger.current = document.activeElement;
    setView({ id, inside: false });
    setListOpen(false);
    setHover("");
    window.history.pushState({}, "", `#${id}`);
    document.body.style.cursor = "";
  }, []);
  const reset = useCallback(() => {
    setView({ id: null, inside: false });
    setCategory("all");
    setTravelling(false);
    setHover("");
    setResetKey((n) => n + 1);
    window.history.pushState({}, "", window.location.pathname);
    requestAnimationFrame(() => {
      window.scrollTo({top:0,behavior:'instant'});
      if (selectTrigger.current?.isConnected)
        selectTrigger.current.focus({ preventScroll: true });
      else listTrigger.current?.focus({ preventScroll: true });
    });
  }, []);
  const goInside = () => {
    setView({ id: selected, inside: !inside });
    window.history.pushState({}, "", `#${selected}${inside ? "" : "/inside"}`);
  };
  const changeCategory = (id) => {
    setCategory(id);
    setView({ id: null, inside: false });
    setTravelling(false);
    window.history.replaceState({}, "", window.location.pathname);
  };
  useEffect(() => {
    const sync = () => {
      setView(initialView());
      setTravelling(false);
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (!item) return;
    detailHeading.current?.focus({ preventScroll: true });
    detailHeading.current
      ?.closest("aside")
      ?.scrollTo({ top: 0, behavior: "instant" });
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [selected, inside]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") {
        if (listOpen) {
          setListOpen(false);
          listTrigger.current?.focus({ preventScroll: true });
        } else if (menuOpen) setMenuOpen(false);
        else if (selected) reset();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected, reset, listOpen, menuOpen]);
  useEffect(() => {
    if (!listOpen) return;
    const before = document.activeElement,
      node = listRef.current;
    node?.querySelector("button")?.focus({ preventScroll: true });
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const nodes = [...node.querySelectorAll("button,input,a[href]")].filter(
        (el) => !el.disabled,
      );
      const first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    node.addEventListener("keydown", trap);
    return () => {
      node.removeEventListener("keydown", trap);
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, [listOpen]);
  const visible = inCategory(category).filter((d) =>
    `${d.name} ${d.subtitle} ${d.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const motionPaused =
    paused || reducedMotion || !sceneVisible || !documentVisible || listOpen;
  return (
    <>
      <a className="skip-link" href="#explore-controls">
        Skip to destinations
      </a>
      <header className="site-header" inert={listOpen}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            reset();
          }}
          aria-label="GI Healthcare home"
        >
          <img
            src={assetPath("assets/logo.webp")}
            alt="GI Healthcare"
            width="180"
            height="52"
          />
        </a>
        <nav
          aria-label="Main navigation"
          className={menuOpen ? "nav open" : "nav"}
        >
          <a
            href="#"
            aria-current="page"
            onClick={(e) => {
              e.preventDefault();
              reset();
              setMenuOpen(false);
            }}
          >
            Home
          </a>
          <a href={sitePath("/?page=space")}>Space</a>
          <a href={sitePath("/?page=careers")}>Careers</a>
          <a href={sitePath("/contact")}>Contact us</a>
        </nav>
        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>
      </header>
      <main inert={listOpen}>
        <section
          ref={sceneRef}
          className={`experience ${item ? "is-selected" : ""} ${inside ? "is-inside" : ""} ${failed ? "has-failed" : ""}`}
          aria-label="Explore GI Healthcare’s vision"
          data-testid="experience"
          data-category={category}
        >
          <div
            className="scene-layer"
            aria-label="Interactive three-dimensional miniature world"
          >
            <SceneBoundary onFailure={onFailure}>
              <Suspense fallback={null}>
                <World
                  {...{
                    selected,
                    category,
                    inside,
                    resetKey,
                    zoomAction,
                    reducedMotion,
                    onTravel,
                    onArrive,
                    onReady,
                    onHover,
                    onFailure,
                  }}
                  paused={motionPaused}
                  onSelect={select}
                />
              </Suspense>
            </SceneBoundary>
          </div>
          {!ready && !failed && (
            <div className="loading-screen" role="status">
              <Icon name="cube" size={32} />
              <span>Bringing our world to life</span>
              <span className="loading-line" />
            </div>
          )}
          {failed && (
            <img
              className="static-world"
              src={assetPath("assets/vision-reference.png")}
              alt="An illustrated world of potential applications for autonomous cooking, from schools and ships to space."
            />
          )}
          <div
            className={`flight-veil ${travelling && !reducedMotion ? "active" : ""}`}
            aria-hidden="true"
          />
          {!item && (
            <div className="vision-intro">
              <p className="eyebrow">
                <span /> OUR WORLD OF POSSIBILITIES
              </p>
              <h1>
                Freshly cooked.
                <br />
                <em>Anywhere.</em>
              </h1>
              <p className="mission">
                Healthy meals, easily accessible to anyone,
                <br className="desktop-break" /> anytime, anywhere. Even beyond
                planet Earth.
              </p>
              <p className="explore-hint">
                <Icon name="compass" size={16} /> Choose a place. Discover the
                possibility.
              </p>
            </div>
          )}
          <div className="view-label">
            <span className="status-dot" />
            {inside
              ? "Inside the vision"
              : item
                ? "A closer look"
                : "21 possibilities. One mission."}
          </div>
          {item && (
            <button className="back-world glass" onClick={reset}>
              <Icon name="arrowLeft" size={17} /> Back to the world
            </button>
          )}
          <div className="view-tools glass" aria-label="World view controls">
            <button
              onClick={() =>
                setZoomAction((a) => ({ serial: a.serial + 1, delta: 5 }))
              }
              aria-label="Zoom in"
              disabled={failed}
            >
              <Icon name="plus" size={18} />
            </button>
            <button
              onClick={() =>
                setZoomAction((a) => ({ serial: a.serial + 1, delta: -5 }))
              }
              aria-label="Zoom out"
              disabled={failed}
            >
              <Icon name="minus" size={18} />
            </button>
            <span />
            <button onClick={reset} aria-label="Reset world view">
              <Icon name="reset" size={18} />
            </button>
            <button
              onClick={() => setPaused(!paused)}
              aria-label={
                reducedMotion
                  ? "Reduced motion enabled"
                  : paused
                    ? "Resume ambient motion"
                    : "Pause ambient motion"
              }
              aria-pressed={motionPaused}
              disabled={reducedMotion}
            >
              <Icon name={motionPaused ? "play" : "pause"} size={18} />
            </button>
          </div>
          {!item && (
            <div className="world-bottom">
              <div className="browse-bar glass" id="explore-controls">
                <div
                  className="category-tabs"
                  role="group"
                  aria-label="Filter destinations"
                >
                  {categories.map((c, i) => (
                    <button
                      key={c.id}
                      aria-label={c.label}
                      aria-pressed={category === c.id}
                      onClick={() => changeCategory(c.id)}
                    >
                      {i === 0 && <Icon name="globe" size={17} />}
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="list-toggle"
                  ref={listTrigger}
                  onClick={() => setListOpen(true)}
                  aria-label="Browse all 21 destinations"
                >
                  <Icon name="grid" size={18} />
                  <span>Explore all</span>
                </button>
              </div>
              <div className="world-footnote">
                <span>{hover || "Drag gently to look around"}</span>
                <span>Autonomous cooking. Extraordinary possibilities.</span>
              </div>
            </div>
          )}
          {item && (
            <aside
              className="destination-panel glass"
              aria-labelledby="destination-title"
              data-testid="destination-panel"
            >
              <div className="panel-top">
                <span className="category-label">
                  <Icon name={item.icon} size={18} />
                  {item.name}
                </span>
                <button
                  className="icon-button"
                  onClick={reset}
                  aria-label="Close destination"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
              <p className="panel-eyebrow">
                {inside ? "A CONCEPTUAL COOKING SPACE" : "EXPLORE THE VISION"}
              </p>
              <h2 id="destination-title" ref={detailHeading} tabIndex={-1}>
                {item.title.split("\n").map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </h2>
              <p className="panel-subtitle">{item.subtitle}</p>
              <p className="panel-description">
                {inside ? item.detail : item.description}
              </p>
              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {item.featured && (
                <button className="primary-action" onClick={goInside}>
                  <Icon name={inside ? "globe" : "cube"} size={20} />
                  {inside ? "See the setting" : "Step inside the kitchen"}
                  <Icon name="arrowRight" size={18} />
                </button>
              )}
              <a
                className="contact-action"
                href={sitePath("/contact")}
              >
                Let’s explore the possibilities{" "}
                <Icon name="arrowUpRight" size={16} />
              </a>
              <p className="vision-disclaimer">
                An illustration of our vision. Applications require
                environment-specific development and validation.
              </p>
              <div className="panel-pagination">
                <span>
                  {String(
                    destinations.findIndex((d) => d.id === selected) + 1,
                  ).padStart(2, "0")}{" "}
                  <span>/ 21 possibilities</span>
                </span>
                <button
                  onClick={() =>
                    select(
                      destinations[
                        (destinations.findIndex((d) => d.id === selected) + 1) %
                          destinations.length
                      ].id,
                    )
                  }
                  aria-label="Explore next destination"
                >
                  Next <Icon name="arrowRight" size={16} />
                </button>
              </div>
            </aside>
          )}
          <span className="sr-only" role="status" aria-live="polite">
            {travelling
              ? `Travelling to ${item?.name ?? "the world"}`
              : item
                ? `Exploring ${item.name}`
                : "World overview"}
          </span>
        </section>
        <section className="supporters" aria-labelledby="supporters-title">
          <p className="eyebrow" id="supporters-title">
            OUR SUPPORTERS
          </p>
          <div>
            {SUPPORTERS.map(([src, name]) => (
              <img
                key={src}
                src={assetPath(`assets/${src}.webp`)}
                alt={name}
                loading="lazy"
              />
            ))}
          </div>
        </section>
        <footer className="prototype-note">
          {liveSite ? <>
            <span>GI Healthcare · A world of possibilities</span>
            <a href="/privacy">Privacy notice & cookie choices</a>
          </> : <>
            <span>Local concept preview · Not the live website</span>
            <span>No visitor analytics or form submissions in this prototype.</span>
          </>}
          <a href={assetPath("asset-credits.html")} target="_blank" rel="noreferrer">Asset credits</a>
        </footer>
      </main>
      {listOpen && (
        <div
          className="drawer-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setListOpen(false);
              listTrigger.current?.focus({ preventScroll: true });
            }
          }}
        >
          <section
            className="destination-drawer glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="browse-title"
            ref={listRef}
          >
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">ONE MISSION. MANY POSSIBILITIES.</p>
                <h2 id="browse-title">Where shall we go?</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => {
                  setListOpen(false);
                  listTrigger.current?.focus({ preventScroll: true });
                }}
                aria-label="Close destination list"
              >
                <Icon name="close" />
              </button>
            </div>
            <label className="search">
              <Icon name="compass" />
              <input
                type="search"
                placeholder="Find a place or application"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search destinations"
              />
            </label>
            <div
              className="drawer-filters"
              aria-label="Filter destination list"
            >
              {categories.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={category === c.id}
                  onClick={() => changeCategory(c.id)}
                >
                  {c.id === "all" ? "All 21" : c.label}
                </button>
              ))}
            </div>
            <div className="destination-grid">
              {visible.map((d) => (
                <button key={d.id} onClick={() => select(d.id)}>
                  <span className="destination-icon">
                    <Icon name={d.icon} size={22} />
                  </span>
                  <span>
                    <strong>{d.name}</strong>
                    <small>
                      {categories.find((c) => c.id === d.category).label}
                    </small>
                  </span>
                  <Icon name="arrowUpRight" size={17} />
                </button>
              ))}
            </div>
            {visible.length === 0 && (
              <p className="empty-search">
                No places match that search. Try “school”, “sea” or “space”.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
