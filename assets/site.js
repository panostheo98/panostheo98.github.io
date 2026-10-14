(() => {
  const header = document.querySelector('.site-header');
  const links = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  let scheduled = false;

  function updateCurrentSection() {
    const threshold = header.getBoundingClientRect().height + 140;
    const tops = sections.map(section => section.querySelector('h1, h2').getBoundingClientRect().top);
    let current = 0;
    tops.forEach((top, index) => {
      if (top <= threshold && (top > tops[current] + 2 || tops[current] > threshold)) current = index;
    });
    const destination = sections.findIndex(section => '#' + section.id === location.hash);
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (atBottom) {
      current = destination >= 0 && tops[destination] >= header.offsetHeight && tops[destination] < innerHeight
        ? destination : sections.length - 1;
    } else if (destination >= 0 && Math.abs(tops[destination] - tops[current]) < 2) {
      // If headings share a position, keep the explicitly chosen destination.
      current = destination;
    }
    links.forEach((link, index) => {
      link.classList.toggle('is-active', index === current);
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateCurrentSection);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  window.addEventListener('hashchange', scheduleUpdate);
  updateCurrentSection();
})();
