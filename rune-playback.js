const runePanel = document.querySelector(".bt-equation");
const playback = runePanel?.querySelector(".bt-rune-playback");

if (playback && "IntersectionObserver" in window) {
  const runeMotion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  const choices = [...runePanel.querySelectorAll('input[name="bt-rune"]')];
  const display = runePanel.querySelector(".bt-equation-mark");
  let visible = false;
  let autoAllowed = runeMotion.matches;
  let requested = autoAllowed;
  let next = 0;
  let timer;

  function updatePlayback() {
    window.clearTimeout(timer);
    playback.hidden = !runeMotion.matches;
    playback.textContent = requested ? "자동 전환 일시정지" : next === choices.length ? "룬 다시 재생" : "룬 자동 재생";

    if (!requested || !runeMotion.matches || !visible || document.hidden) return;
    timer = window.setTimeout(() => {
      choices[next].checked = true;
      next += 1;
      if (next === choices.length) requested = false;
      updatePlayback();
    }, next === 0 ? 450 : 1450);
  }

  playback.addEventListener("click", () => {
    requested = !requested;
    autoAllowed = requested;
    if (requested && next === choices.length) next = 0;
    updatePlayback();
  });

  const stopForManualChoice = () => {
    autoAllowed = requested = false;
    next = 0;
    updatePlayback();
  };
  choices.forEach((choice) => choice.addEventListener("focus", stopForManualChoice));
  runePanel.addEventListener("change", stopForManualChoice);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= .5;
    updatePlayback();
  }, { threshold: .5 }).observe(display);

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting || !autoAllowed) return;
    visible = false;
    requested = true;
    next = 0;
    updatePlayback();
  }, { rootMargin: "72px 0px" }).observe(display);

  document.addEventListener("visibilitychange", updatePlayback);
  runeMotion.addEventListener("change", () => {
    if (!runeMotion.matches) {
      if (requested) choices.at(-1).checked = true;
      autoAllowed = requested = false;
      next = 0;
    }
    updatePlayback();
  });
  updatePlayback();
}
