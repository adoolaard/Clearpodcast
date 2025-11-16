const timelineEl = document.querySelector('#timeline');
const chipRow = document.querySelector('#chipRow');
const searchInput = document.querySelector('#searchInput');
const audio = document.querySelector('#audio');
const nowTitle = document.querySelector('#nowTitle');
const nowMeta = document.querySelector('#nowMeta');
const playPauseBtn = document.querySelector('#playPause');
const back10Btn = document.querySelector('#back10');
const forward10Btn = document.querySelector('#forward10');
const seekInput = document.querySelector('#seek');
const durationEl = document.querySelector('#duration');
const currentTimeEl = document.querySelector('#currentTime');
const toast = document.querySelector('#toast');
const installDialog = document.querySelector('#installDialog');
const installTip = document.querySelector('#installTip');
const closeDialog = document.querySelector('#closeDialog');

let allEpisodes = [];
let currentDateFilter = '';
let currentEpisode = null;
let deferredPrompt;
const FALLBACK_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#ffdf5c"/>
        <stop offset="1" stop-color="#ffb300"/>
      </linearGradient>
    </defs>
    <rect width="300" height="300" rx="36" fill="#0c0c0f"/>
    <rect x="40" y="36" width="220" height="220" rx="36" fill="url(#g)" stroke="#0c0c0f" stroke-width="14"/>
    <circle cx="150" cy="150" r="54" fill="#0c0c0f"/>
    <path d="M150 92c38 0 68 29 68 64s-30 64-68 64-68-29-68-64 30-64 68-64z" fill="none" stroke="#0c0c0f" stroke-width="18"/>
    <rect x="126" y="196" width="48" height="52" rx="12" fill="#0c0c0f"/>
    <rect x="92" y="236" width="116" height="22" rx="11" fill="#ffcc00" stroke="#0c0c0f" stroke-width="8"/>
  </svg>`);

async function loadEpisodes() {
  const response = await fetch('data/episodes.json');
  const data = await response.json();
  allEpisodes = data
    .map(ep => ({ ...ep, publishedDate: new Date(ep.publishedAt) }))
    .sort((a, b) => b.publishedDate - a.publishedDate);
  buildDateChips();
  renderTimeline();
}

function buildDateChips() {
  const uniqueDates = Array.from(
    new Set(allEpisodes.map(ep => ep.publishedDate.toISOString().slice(0, 10)))
  );
  uniqueDates.sort((a, b) => new Date(b) - new Date(a));

  chipRow.innerHTML = '';
  uniqueDates.forEach((date, index) => {
    const label = formatDateLabel(date);
    const chip = document.createElement('button');
    chip.className = `chip ${index === 0 ? 'active' : ''}`;
    chip.dataset.date = date;
    chip.textContent = label;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentDateFilter = date;
      renderTimeline();
    });
    chipRow.appendChild(chip);
    if (index === 0) currentDateFilter = date;
  });

  if (uniqueDates.length > 1) {
    const allChip = document.createElement('button');
    allChip.className = 'chip';
    allChip.textContent = 'Alle dagen';
    allChip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      allChip.classList.add('active');
      currentDateFilter = '';
      renderTimeline();
    });
    chipRow.appendChild(allChip);
  }
}

function renderTimeline() {
  const query = searchInput.value.toLowerCase();
  const filtered = allEpisodes.filter(ep => {
    const matchesDate = !currentDateFilter || ep.publishedDate.toISOString().startsWith(currentDateFilter);
    const matchesQuery = !query || ep.title.toLowerCase().includes(query) || ep.host.toLowerCase().includes(query);
    return matchesDate && matchesQuery;
  });

  const groups = groupByDate(filtered);
  const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
  timelineEl.innerHTML = '';

  if (!sortedDates.length) {
    timelineEl.innerHTML = '<p class="muted">Geen afleveringen gevonden.</p>';
    return;
  }

  sortedDates.forEach(dateKey => {
    const section = document.createElement('article');
    section.className = 'day-group';

    const header = document.createElement('div');
    header.className = 'day-header';

    const dateTitle = document.createElement('h2');
    dateTitle.textContent = formatDateLabel(dateKey);

    const dayCount = document.createElement('p');
    dayCount.className = 'muted';
    dayCount.textContent = `${groups[dateKey].length} afleveringen`;

    header.append(dateTitle, dayCount);
    section.appendChild(header);

    groups[dateKey]
      .sort((a, b) => a.publishedDate - b.publishedDate)
      .forEach(ep => section.appendChild(renderEpisode(ep)));

    timelineEl.appendChild(section);
  });
}

function groupByDate(episodes) {
  return episodes.reduce((acc, ep) => {
    const key = ep.publishedDate.toISOString().slice(0, 10);
    acc[key] = acc[key] || [];
    acc[key].push(ep);
    return acc;
  }, {});
}

function renderEpisode(ep) {
  const wrapper = document.createElement('article');
  wrapper.className = 'episode';
  wrapper.tabIndex = 0;
  wrapper.addEventListener('click', () => playEpisode(ep));
  wrapper.addEventListener('keydown', e => {
    if (e.key === 'Enter') playEpisode(ep);
  });

  const cover = document.createElement('img');
  cover.className = 'cover';
  cover.src = ep.image;
  cover.alt = `${ep.title} cover`;
  cover.loading = 'lazy';
  cover.addEventListener('error', () => {
    cover.src = FALLBACK_COVER;
  }, { once: true });

  const body = document.createElement('div');
  body.className = 'card-body';

  const text = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = ep.title;

  const meta = document.createElement('div');
  meta.className = 'meta';
  const time = document.createElement('span');
  time.className = 'time';
  time.textContent = ep.publishedDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const host = document.createElement('span');
  host.textContent = ep.host;
  const duration = document.createElement('span');
  duration.textContent = ep.duration;

  meta.append(time, host, duration);

  const description = document.createElement('p');
  description.className = 'description';
  description.textContent = ep.description;

  text.append(title, meta, description);

  const button = document.createElement('button');
  button.className = 'play-button';
  button.type = 'button';
  button.textContent = 'Play';
  button.addEventListener('click', e => {
    e.stopPropagation();
    playEpisode(ep);
  });

  body.append(text, button);
  wrapper.append(cover, body);
  return wrapper;
}

function playEpisode(ep) {
  currentEpisode = ep;
  nowTitle.textContent = ep.title;
  nowMeta.textContent = `${ep.host} • ${new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit', minute: '2-digit'
  }).format(ep.publishedDate)} • ${ep.duration}`;
  const newSrc = new URL(ep.audioUrl, location.href).href;
  const shouldReset = audio.src !== newSrc;
  audio.src = newSrc;
  if (shouldReset) {
    audio.currentTime = 0;
  }
  audio.play().catch(() => showToast('Kon de stream niet starten. Controleer je verbinding.'));
  updateMediaSession(ep);
  showToast(`Afspelen: ${ep.title}`);
}

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
  if (sameDay(date, today)) return 'Vandaag';
  if (sameDay(date, yesterday)) return 'Gisteren';

  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(date);
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => (toast.hidden = true), 2200);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}

function updateMediaSession(ep) {
  if (!('mediaSession' in navigator) || !ep) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: ep.title,
    artist: ep.host,
    album: 'BNR Podcasts',
    artwork: [
      { src: ep.image, sizes: '512x512', type: 'image/jpeg' },
      { src: FALLBACK_COVER, sizes: '512x512', type: 'image/svg+xml' }
    ]
  });

  const handlers = [
    ['play', () => audio.play()],
    ['pause', () => audio.pause()],
    ['seekbackward', () => seekRelative(-10)],
    ['seekforward', () => seekRelative(10)],
    ['previoustrack', () => seekRelative(-10)],
    ['nexttrack', () => seekRelative(10)]
  ];

  handlers.forEach(([action, fn]) => {
    try {
      navigator.mediaSession.setActionHandler(action, fn);
    } catch (err) {
      // no-op for unsupported actions
    }
  });
}

function seekRelative(seconds) {
  const newTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || Infinity));
  audio.currentTime = newTime;
}

function formatTime(time) {
  if (!Number.isFinite(time)) return '--:--';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateProgress() {
  const current = audio.currentTime || 0;
  const duration = audio.duration || 0;
  currentTimeEl.textContent = formatTime(current);
  durationEl.textContent = formatTime(duration);
  if (duration) {
    seekInput.value = ((current / duration) * 100).toFixed(1);
  }
}

function setupPlayerControls() {
  playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  back10Btn.addEventListener('click', () => seekRelative(-10));
  forward10Btn.addEventListener('click', () => seekRelative(10));

  seekInput.addEventListener('input', () => {
    const duration = audio.duration || 0;
    if (!duration) return;
    const percent = Number(seekInput.value) / 100;
    audio.currentTime = duration * percent;
  });

  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('durationchange', updateProgress);
  audio.addEventListener('loadedmetadata', updateProgress);

  audio.addEventListener('play', () => {
    playPauseBtn.textContent = '⏸';
    playPauseBtn.setAttribute('aria-label', 'Pauzeer');
  });

  audio.addEventListener('pause', () => {
    playPauseBtn.textContent = '▶️';
    playPauseBtn.setAttribute('aria-label', 'Speel af');
  });

  audio.addEventListener('ended', () => {
    playPauseBtn.textContent = '▶️';
    seekInput.value = 0;
    currentTimeEl.textContent = '0:00';
  });

  updateProgress();
}

function setupInstallPrompts() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installTip.hidden = false;
  });

  installTip.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt = null;
    } else {
      installDialog.showModal();
    }
  });

  closeDialog.addEventListener('click', () => installDialog.close());
}

searchInput.addEventListener('input', () => renderTimeline());

loadEpisodes();
registerServiceWorker();
setupInstallPrompts();
setupPlayerControls();
