const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
const article = document.querySelector("main > article");

if (article && "IntersectionObserver" in window) {
  document.documentElement.classList.add("story-motion");

  const entryClasses = new Map();
  const resetObserver = new IntersectionObserver((entries) => {
    let reset = false;
    for (const entry of entries) {
      const className = entryClasses.get(entry.target);
      if (!entry.isIntersecting && entry.target.classList.contains(className)) {
        entry.target.classList.remove(className);
        reset = true;
      }
    }
    // Commit the reset before a fast reversal can restore the same CSS animation.
    if (reset && motion.matches) document.getAnimations();
  }, { rootMargin: "72px 0px" });

  const reveal = (elements, className, options) => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= options.threshold) {
          entry.target.classList.add(className);
        }
      }
    }, options);
    for (const element of elements) {
      entryClasses.set(element, className);
      resetObserver.observe(element);
      observer.observe(element);
    }
  };

  reveal(article.querySelectorAll("[data-photo-entry]"), "photo-entering", { threshold: .16 });
  reveal(article.querySelectorAll("mark"), "highlight-visible", {
    threshold: .25,
    rootMargin: "0px 0px -28px 0px",
  });
  reveal(article.querySelectorAll(":scope > header, section[aria-labelledby]"), "is-chapter-entering", {
    threshold: 0,
    rootMargin: "0px 0px -48px 0px",
  });
  reveal(article.querySelectorAll("section[aria-labelledby] h2"), "is-heading-entering", {
    threshold: .3,
    rootMargin: "0px 0px -30px 0px",
  });

  const stepper = document.createElement("nav");
  stepper.className = "story-steps";
  stepper.setAttribute("aria-label", "반 페이지 이동");
  stepper.innerHTML = '<button type="button" aria-label="반 페이지 위로" title="반 페이지 위로">↑</button>' +
    '<button type="button" aria-label="반 페이지 아래로" title="반 페이지 아래로">↓</button>';
  const [up, down] = stepper.querySelectorAll("button");
  let scrollLimit = 0;
  let previousY = 0;
  let previousTime = 0;
  let drift = 0;
  let velocity = 0;
  let frame = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const scrollPosition = () => clamp(window.scrollY, 0, scrollLimit);

  function updateSteps() {
    up.disabled = window.scrollY < 2;
    down.disabled = window.scrollY >= scrollLimit - 2;
  }

  function updateBounds() {
    scrollLimit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    previousY = scrollPosition();
    updateSteps();
  }

  function animateDrift(time) {
    frame = 0;
    const elapsed = previousTime ? time - previousTime : 1000 / 60;
    const tick = clamp(elapsed * .06, .25, 2);
    previousTime = time;
    velocity = (velocity - drift * .24 * tick) * Math.pow(.73, tick);
    drift = clamp(drift + velocity * tick, -8, 8);
    if (Math.abs(drift) < .07 && Math.abs(velocity) < .07) {
      drift = velocity = previousTime = 0;
    }
    article.style.setProperty("--scroll-drift", drift.toFixed(2) + "px");
    if (drift || velocity) frame = window.requestAnimationFrame(animateDrift);
  }

  function followScroll() {
    updateSteps();
    const y = scrollPosition();
    const delta = y - previousY;
    previousY = y;
    if (!motion.matches || !delta) return;

    // The spring moves decorative layers only. The browser owns the scroll position.
    velocity = clamp(velocity + clamp(delta, -24, 24) * .37, -9, 9);
    if (!frame) frame = window.requestAnimationFrame(animateDrift);
  }

  function step(direction) {
    window.scrollBy({
      top: direction * Math.round(window.innerHeight * .55),
      behavior: motion.matches ? "smooth" : "instant",
    });
  }

  up.addEventListener("click", () => step(-1));
  down.addEventListener("click", () => step(1));
  window.addEventListener("scroll", followScroll, { passive: true });
  window.addEventListener("resize", updateBounds);
  motion.addEventListener("change", () => {
    window.cancelAnimationFrame(frame);
    frame = drift = velocity = previousTime = 0;
    previousY = scrollPosition();
    article.style.removeProperty("--scroll-drift");
  });
  document.body.append(stepper);
  updateBounds();
  if ("ResizeObserver" in window) new ResizeObserver(updateBounds).observe(document.body);
}
