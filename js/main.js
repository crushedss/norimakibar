function copyClipboard(value) {
  var tempInput = document.createElement("input");
  tempInput.value = value;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);

  var x = document.getElementById("toast").style.display = "block";
  setTimeout(function(){ document.getElementById("toast").style.display = "none"}, 1500);

}

document.querySelector('#noriAddress').onclick = function() {
  copyClipboard('200 A Walnut Street, Fort Collins, CO 80524');
}

var SITE_ORIGIN = 'https://www.norimakibar.com';

var ROUTES = {
  '/home': 'home',
  '/lunch': 'lunch',
  '/dinner': 'dinner',
  '/drinks': 'drinks',
  '/location-hours': 'location'
};

var PAGE_SEO = {
  home: {
    title: 'Nori Maki Bar | Sushi, Ramen & Maki Rolls in Old Town Fort Collins',
    description: 'Nori Maki Bar is an Old Town Fort Collins sushi restaurant serving creative maki rolls, sashimi, ramen, lunch, dinner, and drinks. Dine-in and take-out at 200 A Walnut Street. Call (970) 930-6254.',
    path: '/home'
  },
  lunch: {
    title: 'Lunch Menu | Nori Maki Bar Fort Collins — 2 Rolls for $16',
    description: 'Lunch menu at Nori Maki Bar in Old Town Fort Collins: starters, ramen, classic rolls (2 for $16), specialty creations, and sweets. Dine-in and take-out.',
    path: '/lunch'
  },
  dinner: {
    title: 'Dinner Menu | Nori Maki Bar Fort Collins Sushi & Ramen',
    description: 'Dinner menu at Nori Maki Bar: creative maki rolls, dragon rolls, sashimi, ramen, starters, and sweets in Old Town Fort Collins. Open late for dine-in and take-out.',
    path: '/dinner'
  },
  drinks: {
    title: 'Drinks Menu | Sake, Wine & Cocktails — Nori Maki Bar Fort Collins',
    description: 'Drinks at Nori Maki Bar Fort Collins: hot and cold sake, wine by the glass and bottle, beer, and cocktails. Pair with sushi and ramen in Old Town.',
    path: '/drinks'
  },
  location: {
    title: 'Location & Hours | Nori Maki Bar — 200 A Walnut St, Old Town Fort Collins',
    description: 'Visit Nori Maki Bar at 200 A Walnut Street, Fort Collins, CO 80524. Hours: Mon–Sat 11am–9pm, Sun 3pm–9pm. Call (970) 930-6254 for dine-in and take-out.',
    path: '/location-hours'
  }
};

function setMetaTag(selector, attr, value) {
  var el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function updatePageSeo(page) {
  var seo = PAGE_SEO[page] || PAGE_SEO.home;
  var url = SITE_ORIGIN + seo.path;

  document.title = seo.title;
  setMetaTag('meta[name="description"]', 'content', seo.description);
  setMetaTag('link[rel="canonical"]', 'href', url);
  setMetaTag('meta[property="og:url"]', 'content', url);
  setMetaTag('meta[property="og:title"]', 'content', seo.title);
  setMetaTag('meta[property="og:description"]', 'content', seo.description);
  setMetaTag('meta[name="twitter:title"]', 'content', seo.title);
  setMetaTag('meta[name="twitter:description"]', 'content', seo.description);
}

function normalizePath(path) {
  if (!path || path === '/' || path === '/index.html') {
    return '/home';
  }

  var clean = path.split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.charAt(clean.length - 1) === '/') {
    clean = clean.slice(0, -1);
  }

  if (clean === '/concept' || clean === '/limited') {
    clean = '/lunch';
  }

  return ROUTES[clean] ? clean : '/home';
}

function getRoutePath() {
  return normalizePath(window.location.pathname);
}

function setMenuView(mode) {
  var categories = document.getElementById('categories');
  var smallText = document.getElementById('smallText');

  categories.classList.remove('menu-layout', 'drinks-layout', 'location-layout');

  if (mode === 'food') {
    categories.classList.add('menu-layout');
    if (smallText) smallText.style.display = 'block';
    return;
  }

  if (mode === 'drinks') {
    categories.classList.add('drinks-layout');
  }

  if (mode === 'location') {
    categories.classList.add('location-layout');
  }

  if (smallText) smallText.style.display = 'none';
}

function setMealView(meal) {
  var categories = document.getElementById('categories');
  categories.classList.remove('menu-meal-lunch', 'menu-meal-dinner');

  if (meal === 'lunch') {
    categories.classList.add('menu-meal-lunch');
  }

  if (meal === 'dinner') {
    categories.classList.add('menu-meal-dinner');
  }
}

function closeMenuSubnav() {
  var group = document.querySelector('.nav-menu-group');
  var toggle = document.getElementById('menuToggle');
  var subnav = document.getElementById('menuSubnav');

  if (group) group.classList.remove('is-open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  if (subnav) subnav.hidden = true;

  if (window.matchMedia('(min-width: 1031px)').matches) {
    document.body.classList.remove('nav-desktop-menu-open');
  }
}

function setHomeFooterVisible(isVisible) {
  var footer = document.getElementById('siteFooter');
  if (!footer) return;
  footer.hidden = !isVisible;
  footer.classList.toggle('is-visible', isVisible);
}

function showHome() {
  setMenuView('home');
  document.getElementById("home").style.display = "block";
  $(".food").css("display", "none");
  document.getElementById("drinks").style.display = "none";
  document.getElementById("location").style.display = "none";
  setHomeFooterVisible(true);
}

function showFoodMenu(meal) {
  setMenuView('food');
  setMealView(meal);
  document.getElementById("home").style.display = "none";
  document.getElementById("drinks").style.display = "none";
  document.getElementById("location").style.display = "none";
  setHomeFooterVisible(false);

  $(".food").css("display", "block");
  if (document.getElementById("smallText")) {
    document.getElementById("smallText").style.display = "block";
  }
  if (document.getElementById("allergenNotice")) {
    document.getElementById("allergenNotice").style.display = "block";
  }
}

function showDrinks() {
  setMenuView('drinks');
  document.getElementById("home").style.display = "none";
  $(".food").css("display", "none");
  document.getElementById("drinks").style.display = "";
  document.getElementById("location").style.display = "none";
  setHomeFooterVisible(false);
}

function showLocation() {
  setMenuView('location');
  document.getElementById("home").style.display = "none";
  $(".food").css("display", "none");
  document.getElementById("drinks").style.display = "none";
  document.getElementById("location").style.display = "";
  setHomeFooterVisible(true);
}

function applyRoute(path) {
  var page = ROUTES[path] || 'home';

  switch (page) {
    case 'home':
      showHome();
      break;
    case 'lunch':
      showFoodMenu('lunch');
      break;
    case 'dinner':
      showFoodMenu('dinner');
      break;
    case 'drinks':
      showDrinks();
      break;
    case 'location':
      showLocation();
      break;
    default:
      showHome();
  }

  updatePageSeo(page);
}

function navigate(path, replace) {
  var normalized = normalizePath(path);

  if (replace) {
    history.replaceState({ path: normalized }, '', normalized);
  } else {
    history.pushState({ path: normalized }, '', normalized);
  }

  applyRoute(normalized);
}

function closeMobileNav() {
  var nav = document.getElementById('siteNav');
  var toggle = document.getElementById('navToggle');
  if (nav) nav.classList.remove('nav-open');
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'open navigation');
  }
  document.body.classList.remove('nav-menu-open');
  closeMenuSubnav();
}

function toggleMobileNav() {
  var nav = document.getElementById('siteNav');
  var toggle = document.getElementById('navToggle');
  if (!nav || !toggle) return;

  var isOpen = nav.classList.toggle('nav-open');
  toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  toggle.setAttribute('aria-label', isOpen ? 'close navigation' : 'open navigation');
  document.body.classList.toggle('nav-menu-open', isOpen);

  if (!isOpen) {
    closeMenuSubnav();
  }
}

var navToggle = document.getElementById('navToggle');
if (navToggle) {
  navToggle.addEventListener('click', toggleMobileNav);
}

var menuToggle = document.getElementById('menuToggle');
if (menuToggle) {
  menuToggle.addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation();

    var group = this.closest('.nav-menu-group');
    var subnav = document.getElementById('menuSubnav');
    if (!group || !subnav) return;

    var isOpen = !group.classList.contains('is-open');
    group.classList.toggle('is-open', isOpen);
    this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    subnav.hidden = !isOpen;

    if (window.matchMedia('(min-width: 1031px)').matches) {
      document.body.classList.toggle('nav-desktop-menu-open', isOpen);
    }
  });
}

document.addEventListener('click', function(event) {
  var group = document.querySelector('.nav-menu-group');
  if (!group || !group.classList.contains('is-open')) return;
  if (group.contains(event.target)) return;
  closeMenuSubnav();
});

$('.click').click(function(event) {
  var href = $(this).attr('href');

  if (href && href.charAt(0) === '/') {
    event.preventDefault();
    closeMobileNav();

    if (normalizePath(href) === getRoutePath()) {
      return;
    }

    navigate(href);
  }
});

window.addEventListener('popstate', function() {
  applyRoute(getRoutePath());
});

closeMenuSubnav();
navigate(getRoutePath(), true);
