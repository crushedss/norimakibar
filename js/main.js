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

var ROUTES = {
  '/concept': 'concept',
  '/limited': 'limited',
  '/lunch': 'lunch',
  '/dinner': 'dinner',
  '/drinks': 'drinks',
  '/location-hours': 'location'
};

function normalizePath(path) {
  if (!path || path === '/' || path === '/index.html') {
    return '/concept';
  }

  var clean = path.split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.charAt(clean.length - 1) === '/') {
    clean = clean.slice(0, -1);
  }

  return ROUTES[clean] ? clean : '/concept';
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
  categories.classList.remove('menu-meal-lunch', 'menu-meal-dinner', 'menu-meal-limited');

  if (meal === 'lunch') {
    categories.classList.add('menu-meal-lunch');
  }

  if (meal === 'dinner') {
    categories.classList.add('menu-meal-dinner');
  }

  if (meal === 'limited') {
    categories.classList.add('menu-meal-limited');
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

function showConcept() {
  setMenuView('concept');
  document.getElementById("concept").style.display = "block";
  $(".food").css("display", "none");
  document.getElementById("drinks").style.display = "none";
  document.getElementById("location").style.display = "none";
  setHomeFooterVisible(true);
}

function showFoodMenu(meal) {
  setMenuView('food');
  setMealView(meal);
  document.getElementById("concept").style.display = "none";
  document.getElementById("drinks").style.display = "none";
  document.getElementById("location").style.display = "none";
  setHomeFooterVisible(false);

  if (meal === 'limited') {
    $(".food").not("#limited, #limited *, #smallText").css("display", "none");
    $("#limited").css("display", "");
    $("#limited *").css("display", "");
    if (document.getElementById("smallText")) {
      document.getElementById("smallText").style.display = "block";
    }
    if (document.getElementById("allergenNotice")) {
      document.getElementById("allergenNotice").style.display = "none";
    }
    return;
  }

  document.getElementById("limited").style.display = "none";
  $(".food:not(#limited)").css("display", "block");
  if (document.getElementById("ramen")) {
    document.getElementById("ramen").style.display = "none";
  }
  if (document.getElementById("smallText")) {
    document.getElementById("smallText").style.display = "block";
  }
  if (document.getElementById("allergenNotice")) {
    document.getElementById("allergenNotice").style.display = "block";
  }
}

function showDrinks() {
  setMenuView('drinks');
  document.getElementById("concept").style.display = "none";
  $(".food").css("display", "none");
  document.getElementById("drinks").style.display = "";
  document.getElementById("location").style.display = "none";
  setHomeFooterVisible(false);
}

function showLocation() {
  setMenuView('location');
  document.getElementById("concept").style.display = "none";
  $(".food").css("display", "none");
  document.getElementById("drinks").style.display = "none";
  document.getElementById("location").style.display = "";
  setHomeFooterVisible(true);
}

function applyRoute(path) {
  var page = ROUTES[path] || 'concept';

  switch (page) {
    case 'concept':
      showConcept();
      break;
    case 'limited':
      showFoodMenu('limited');
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
      showConcept();
  }
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
