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
      // Service and Talks share a desktop row. Keep the explicitly chosen link.
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

  const oral = document.querySelector('.oral-badge');
  const explanation = document.getElementById('oral-explanation');
  let closeTimer;

  function hideExplanation() {
    clearTimeout(closeTimer);
    explanation.hidden = true;
  }

  function positionExplanation() {
    const trigger = oral.getBoundingClientRect();
    const box = explanation.getBoundingClientRect();
    const left = Math.max(16, Math.min(trigger.left, innerWidth - box.width - 16));
    const top = trigger.bottom + 8 + box.height <= innerHeight - 16
      ? trigger.bottom + 8 : Math.max(16, trigger.top - box.height - 8);
    explanation.style.left = `${left}px`;
    explanation.style.top = `${top}px`;
  }

  function showExplanation() {
    clearTimeout(closeTimer);
    explanation.hidden = false;
    positionExplanation();
  }

  function closeWhenIdle() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!oral.matches(':hover, :focus-visible') && !explanation.matches(':hover')) hideExplanation();
    }, 150);
  }

  // The title remains a native hover fallback when JavaScript is unavailable.
  oral.removeAttribute('title');
  oral.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') showExplanation();
  });
  oral.addEventListener('pointerleave', closeWhenIdle);
  oral.addEventListener('focus', () => {
    if (oral.matches(':focus-visible')) showExplanation();
  });
  oral.addEventListener('blur', closeWhenIdle);
  oral.addEventListener('click', () => explanation.hidden ? showExplanation() : hideExplanation());
  explanation.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  explanation.addEventListener('pointerleave', closeWhenIdle);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hideExplanation();
  });
  document.addEventListener('pointerdown', event => {
    if (!oral.contains(event.target) && !explanation.contains(event.target)) hideExplanation();
  });
  window.addEventListener('scroll', () => {
    if (explanation.hidden) return;
    const trigger = oral.getBoundingClientRect();
    if (trigger.bottom < header.offsetHeight || trigger.top > innerHeight) hideExplanation();
    else positionExplanation();
  }, { passive: true });
  window.addEventListener('resize', hideExplanation);
})();
