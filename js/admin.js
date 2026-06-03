(function () {
  var STORAGE_KEY = 'nori-menu-data';
  var VERSIONS_KEY = 'nori-menu-versions';
  var SESSION_KEY = 'nori-admin-session';
  var MOBILE_QUERY = '(max-width: 800px)';

  var draftData = null;
  var hasUnsavedChanges = false;
  var activeSectionId = 'starters';
  var searchQuery = '';

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function getPriceFromNode(node) {
    var priceEl = node.querySelector('h3');
    if (priceEl) return priceEl.textContent.trim();

    var match = node.innerHTML.match(/<!--\s*<h3>([^<]*)<\/h3>\s*-->/i);
    return match ? match[1].trim() : '';
  }

  function getSortLetter(name) {
    var letter = (name || '').trim().charAt(0).toLowerCase();
    return /[a-z]/.test(letter) ? letter : '#';
  }

  function parseSection(container, sectionId, sectionName) {
    var items = [];
    var ul = container.querySelector('ul');
    if (!ul) return { id: sectionId, name: sectionName, items: items };

    var nodes = ul.children;
    var pendingDescription = '';

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];

      if (node.tagName === 'H4') {
        if (items.length && !items[items.length - 1].description) {
          items[items.length - 1].description = node.textContent.trim();
        } else {
          pendingDescription = node.textContent.trim();
        }
        continue;
      }

      if (node.tagName === 'H2') {
        var wineItemId = sectionId + '-' + items.length;
        node.setAttribute('data-admin-id', wineItemId);
        items.push({
          id: wineItemId,
          name: node.textContent.trim(),
          price: '',
          description: pendingDescription
        });
        pendingDescription = '';
        continue;
      }

      if (node.tagName !== 'LI') continue;

      var nameEl = node.querySelector('h2');
      if (!nameEl) continue;

      var itemId = sectionId + '-' + items.length;
      node.setAttribute('data-admin-id', itemId);

      items.push({
        id: itemId,
        name: nameEl.textContent.trim(),
        price: getPriceFromNode(node),
        description: pendingDescription
      });

      pendingDescription = '';
    }

    return { id: sectionId, name: sectionName, items: items };
  }

  function parseDrinkSubsection(container, sectionId) {
    var titleEl = container.querySelector('h1');
    var sectionName = titleEl ? titleEl.textContent.trim() : sectionId;
    return parseSection(container, sectionId, sectionName);
  }

  function parseMenuFromDOM() {
    var sections = [];

    ['starters', 'rolls', 'ramen', 'creations', 'sweets', 'limited'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        var title = el.querySelector('h1');
        sections.push(parseSection(el, id, title ? title.textContent.trim() : id));
      }
    });

    ['hotSake', 'coldSake', 'onTap', 'bottles', 'plumWine', 'whiteWine', 'redWine', 'cocktails', 'spirits'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sections.push(parseDrinkSubsection(el, id));
    });

    return { sections: sections, savedAt: null };
  }

  function mergeWithDOM(data) {
    var domData = parseMenuFromDOM();
    data.sections.forEach(function (section) {
      var domSection = domData.sections.find(function (s) { return s.id === section.id; });
      if (!domSection) return;

      section.items.forEach(function (item, index) {
        var domItem = domSection.items.find(function (i) { return i.id === item.id; }) ||
          domSection.items[index];
        if (!domItem) return;
        if (!item.price && domItem.price) item.price = domItem.price;
        if (!item.description && domItem.description) item.description = domItem.description;
        if (!item.name && domItem.name) item.name = domItem.name;
      });

      if (section.items.length < domSection.items.length) {
        domSection.items.forEach(function (domItem) {
          if (!section.items.some(function (i) { return i.id === domItem.id; })) {
            section.items.push(cloneData(domItem));
          }
        });
      }
    });

    domData.sections.forEach(function (domSection) {
      if (!data.sections.some(function (s) { return s.id === domSection.id; })) {
        data.sections.push(cloneData(domSection));
      }
    });

    return data;
  }

  function loadMenuData() {
    var domData = parseMenuFromDOM();
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return mergeWithDOM(JSON.parse(stored));
    } catch (e) {}
    return domData;
  }

  function loadVersions() {
    try {
      var stored = localStorage.getItem(VERSIONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  function saveVersions(versions) {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  }

  function applyItemToDOM(item) {
    var el = document.querySelector('[data-admin-id="' + item.id + '"]');
    if (!el) return;

    if (el.tagName === 'H2') {
      el.textContent = item.name;
      return;
    }

    var nameEl = el.querySelector('h2');
    var priceEl = el.querySelector('h3');

    if (nameEl) nameEl.textContent = item.name;
    if (priceEl) {
      priceEl.textContent = item.price;
    } else if (item.price) {
      var h3 = document.createElement('h3');
      h3.textContent = item.price;
      el.appendChild(h3);
    }

    var next = el.nextElementSibling;
    if (item.description) {
      if (next && next.tagName === 'H4') {
        next.textContent = item.description;
      } else {
        var h4 = document.createElement('h4');
        h4.textContent = item.description;
        el.parentNode.insertBefore(h4, el.nextSibling);
      }
    } else if (next && next.tagName === 'H4') {
      next.remove();
    }
  }

  function applyMenuToDOM(data) {
    data.sections.forEach(function (section) {
      section.items.forEach(applyItemToDOM);
    });
  }

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function showOverlay(id) {
    var el = $(id);
    if (el) {
      el.classList.add('nori-admin-overlay--visible');
      document.body.classList.add('nori-admin-open');
    }
  }

  function hideOverlay(id) {
    var el = $(id);
    if (el) {
      el.classList.remove('nori-admin-overlay--visible');
    }
    if (!$('noriAdminLogin').classList.contains('nori-admin-overlay--visible') &&
        !$('noriAdminDashboard').classList.contains('nori-admin-overlay--visible')) {
      document.body.classList.remove('nori-admin-open');
    }
  }

  function updateSaveButton() {
    var btn = $('noriAdminSave');
    if (!btn) return;
    btn.disabled = !hasUnsavedChanges;
    btn.textContent = hasUnsavedChanges ? 'save changes' : 'saved';
  }

  function itemMatchesSearch(item, sectionName) {
    if (!searchQuery) return true;
    var haystack = [
      item.name,
      item.price,
      item.description,
      sectionName
    ].join(' ').toLowerCase();
    return haystack.indexOf(searchQuery.toLowerCase()) !== -1;
  }

  function renderItemCard(item, section) {
    var searchText = [item.name, item.price, item.description, section.name].join(' ').toLowerCase();
    return (
      '<div class="nori-admin-item" data-item-id="' + escapeHtml(item.id) + '" data-section-id="' + escapeHtml(section.id) + '" data-search-text="' + escapeHtml(searchText) + '">' +
        (searchQuery ? '<span class="nori-admin-item-category">' + escapeHtml(section.name) + '</span>' : '') +
        '<label>name<input type="text" class="nori-admin-input nori-admin-name" value="' + escapeHtml(item.name) + '"></label>' +
        '<label>price<input type="text" class="nori-admin-input nori-admin-price" inputmode="decimal" value="' + escapeHtml(item.price) + '"></label>' +
        '<label>ingredients<textarea class="nori-admin-input nori-admin-description" rows="2" placeholder="ingredients">' + escapeHtml(item.description) + '</textarea></label>' +
      '</div>'
    );
  }

  function groupItemsByLetter(items, section) {
    var groups = {};
    var letters = [];

    items.forEach(function (item) {
      var letter = getSortLetter(item.name);
      if (!groups[letter]) {
        groups[letter] = [];
        letters.push(letter);
      }
      groups[letter].push(item);
    });

    letters.sort();
    if (letters.indexOf('#') > -1) {
      letters = letters.filter(function (l) { return l !== '#'; }).concat('#');
    }

    return { groups: groups, letters: letters };
  }

  function renderCategoryNav() {
    var nav = $('noriAdminCategoryNav');
    if (!nav || !draftData) return;

    nav.innerHTML = draftData.sections.map(function (section) {
      var isActive = !searchQuery && section.id === activeSectionId;
      return (
        '<button type="button" class="nori-admin-category-tab' + (isActive ? ' nori-admin-category-tab--active' : '') + '" data-section-id="' + escapeHtml(section.id) + '">' +
          escapeHtml(section.name) +
        '</button>'
      );
    }).join('');

    nav.classList.toggle('nori-admin-category-nav--hidden', !!searchQuery);
  }

  function renderAlphaNav(letters) {
    var nav = $('noriAdminAlphaNav');
    if (!nav) return;

    if (searchQuery || !letters.length) {
      nav.innerHTML = '';
      nav.classList.add('nori-admin-alpha-nav--hidden');
      return;
    }

    nav.classList.remove('nori-admin-alpha-nav--hidden');
    nav.innerHTML = letters.map(function (letter) {
      return '<button type="button" class="nori-admin-alpha-btn" data-letter="' + escapeHtml(letter) + '">' + escapeHtml(letter) + '</button>';
    }).join('');
  }

  function renderMenuItems() {
    var container = $('noriAdminMenuList');
    if (!container || !draftData) return;

    if (searchQuery) {
      var results = [];
      draftData.sections.forEach(function (section) {
        section.items.forEach(function (item) {
          if (itemMatchesSearch(item, section.name)) {
            results.push({ item: item, section: section });
          }
        });
      });

      if (!results.length) {
        container.innerHTML = '<p class="nori-admin-empty">no items match "' + escapeHtml(searchQuery) + '"</p>';
        renderAlphaNav([]);
        return;
      }

      container.innerHTML =
        '<div class="nori-admin-results-meta">' + results.length + ' result' + (results.length === 1 ? '' : 's') + '</div>' +
        results.map(function (result) {
          return renderItemCard(result.item, result.section);
        }).join('');

      renderAlphaNav([]);
      return;
    }

    var section = draftData.sections.find(function (s) { return s.id === activeSectionId; }) ||
      draftData.sections[0];

    if (!section) {
      container.innerHTML = '<p class="nori-admin-empty">no items in this category</p>';
      renderAlphaNav([]);
      return;
    }

    activeSectionId = section.id;
    var grouped = groupItemsByLetter(section.items, section);

    container.innerHTML = grouped.letters.map(function (letter) {
      var itemsHtml = grouped.groups[letter].map(function (item) {
        return renderItemCard(item, section);
      }).join('');

      return (
        '<section class="nori-admin-letter-group" id="nori-admin-letter-' + escapeHtml(letter) + '">' +
          '<h3 class="nori-admin-letter-heading">' + escapeHtml(letter) + '</h3>' +
          itemsHtml +
        '</section>'
      );
    }).join('');

    renderAlphaNav(grouped.letters);
  }

  function bindDashboardEvents() {
    var container = $('noriAdminMenuList');
    if (!container) return;

    container.querySelectorAll('.nori-admin-input').forEach(function (input) {
      input.addEventListener('input', function () {
        syncDraftFromForm();
        hasUnsavedChanges = true;
        updateSaveButton();
      });
    });

    var categoryNav = $('noriAdminCategoryNav');
    if (categoryNav) {
      categoryNav.querySelectorAll('.nori-admin-category-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          if (!isMobile()) return;
          syncDraftFromForm();
          activeSectionId = tab.getAttribute('data-section-id');
          searchQuery = '';
          var search = $('noriAdminSearch');
          if (search) search.value = '';
          renderDashboard();
        });
      });
    }

    var alphaNav = $('noriAdminAlphaNav');
    if (alphaNav) {
      alphaNav.querySelectorAll('.nori-admin-alpha-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var letter = btn.getAttribute('data-letter');
          var target = document.getElementById('nori-admin-letter-' + letter);
          var scrollParent = document.querySelector('.nori-admin-body');
          if (!target || !scrollParent) return;

          alphaNav.querySelectorAll('.nori-admin-alpha-btn').forEach(function (b) {
            b.classList.remove('nori-admin-alpha-btn--active');
          });
          btn.classList.add('nori-admin-alpha-btn--active');

          var top = target.getBoundingClientRect().top -
            scrollParent.getBoundingClientRect().top +
            scrollParent.scrollTop - 8;
          scrollParent.scrollTo({ top: top, behavior: 'smooth' });
        });
      });
    }
  }

  function renderVersionHistory() {
    var container = $('noriAdminVersions');
    if (!container) return;

    var versions = loadVersions();
    if (!versions.length) {
      container.innerHTML = '<p class="nori-admin-versions-empty">no saved versions yet</p>';
      return;
    }

    container.innerHTML = versions.map(function (version, index) {
      var itemCount = version.data.sections.reduce(function (sum, s) {
        return sum + s.items.length;
      }, 0);
      return (
        '<div class="nori-admin-version">' +
          '<div class="nori-admin-version-info">' +
            '<span class="nori-admin-version-date">' + escapeHtml(formatDate(version.savedAt)) + '</span>' +
            '<span class="nori-admin-version-meta">' + itemCount + ' items</span>' +
          '</div>' +
          '<button type="button" class="nori-admin-version-restore" data-version-index="' + index + '">restore</button>' +
        '</div>'
      );
    }).join('');

    container.querySelectorAll('.nori-admin-version-restore').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!isMobile()) return;
        var index = parseInt(btn.getAttribute('data-version-index'), 10);
        restoreVersion(index);
      });
    });
  }

  function renderDashboard() {
    if (!draftData) return;
    if (!draftData.sections.some(function (s) { return s.id === activeSectionId; })) {
      activeSectionId = draftData.sections[0] ? draftData.sections[0].id : '';
    }

    renderCategoryNav();
    renderMenuItems();
    bindDashboardEvents();
    renderVersionHistory();
    updateSaveButton();
  }

  function syncDraftFromForm() {
    if (!draftData) return;

    document.querySelectorAll('.nori-admin-item').forEach(function (itemEl) {
      var itemId = itemEl.getAttribute('data-item-id');
      var sectionId = itemEl.getAttribute('data-section-id');
      var section = draftData.sections.find(function (s) { return s.id === sectionId; });
      if (!section) return;

      var item = section.items.find(function (i) { return i.id === itemId; });
      if (!item) return;

      item.name = itemEl.querySelector('.nori-admin-name').value;
      item.price = itemEl.querySelector('.nori-admin-price').value;
      item.description = itemEl.querySelector('.nori-admin-description').value;
    });
  }

  function saveChanges() {
    if (!isMobile() || !hasUnsavedChanges) return;

    syncDraftFromForm();
    draftData.savedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));

    var versions = loadVersions();
    versions.unshift({
      savedAt: draftData.savedAt,
      data: cloneData(draftData)
    });
    if (versions.length > 30) versions = versions.slice(0, 30);
    saveVersions(versions);

    applyMenuToDOM(draftData);
    hasUnsavedChanges = false;
    updateSaveButton();
    renderVersionHistory();

    var status = $('noriAdminStatus');
    if (status) {
      status.textContent = 'changes saved';
      setTimeout(function () { status.textContent = ''; }, 2000);
    }
  }

  function restoreVersion(index) {
    if (!isMobile()) return;

    var versions = loadVersions();
    if (!versions[index]) return;

    if (hasUnsavedChanges && !window.confirm('restore this version? unsaved changes will be lost.')) {
      return;
    }

    draftData = mergeWithDOM(cloneData(versions[index].data));
    hasUnsavedChanges = true;
    renderDashboard();
  }

  function openLogin() {
    if (!isMobile()) return;
    showOverlay('noriAdminLogin');
    var user = $('noriAdminUsername');
    if (user) user.focus();
  }

  function openDashboard() {
    if (!isMobile()) return;
    draftData = cloneData(loadMenuData());
    hasUnsavedChanges = false;
    searchQuery = '';
    activeSectionId = draftData.sections[0] ? draftData.sections[0].id : 'starters';
    hideOverlay('noriAdminLogin');
    var search = $('noriAdminSearch');
    if (search) search.value = '';
    renderDashboard();
    showOverlay('noriAdminDashboard');
  }

  function closeDashboard() {
    if (hasUnsavedChanges && !window.confirm('you have unsaved changes. leave anyway?')) {
      return;
    }
    hideOverlay('noriAdminDashboard');
    hasUnsavedChanges = false;
  }

  function handleLogin(event) {
    event.preventDefault();
    if (!isMobile()) return;
    sessionStorage.setItem(SESSION_KEY, 'active');
    openDashboard();
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    hasUnsavedChanges = false;
    hideOverlay('noriAdminDashboard');
  }

  function init() {
    if (!isMobile()) return;

    var stored = loadMenuData();
    if (stored.savedAt) {
      applyMenuToDOM(stored);
    }

    var trigger = $('noriSecretTrigger');
    if (trigger) {
      trigger.addEventListener('click', openLogin);
    }

    var loginForm = $('noriAdminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    var loginClose = $('noriAdminLoginClose');
    if (loginClose) {
      loginClose.addEventListener('click', function () {
        hideOverlay('noriAdminLogin');
      });
    }

    var searchInput = $('noriAdminSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        syncDraftFromForm();
        searchQuery = searchInput.value.trim();
        renderDashboard();
      });
    }

    var saveBtn = $('noriAdminSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveChanges);
    }

    var logoutBtn = $('noriAdminLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    var dashClose = $('noriAdminDashboardClose');
    if (dashClose) {
      dashClose.addEventListener('click', closeDashboard);
    }

    if (sessionStorage.getItem(SESSION_KEY) === 'active') {
      openDashboard();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('resize', function () {
    if (!isMobile()) {
      hideOverlay('noriAdminLogin');
      hideOverlay('noriAdminDashboard');
      document.body.classList.remove('nori-admin-open');
    }
  });
})();
