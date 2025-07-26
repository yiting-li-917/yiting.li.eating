// ========== GLOBAL STATE & CONSTANTS =============
// COMMENT: Stores album and photo data for gallery and lightbox
let allAlbums = [];
let filteredAlbums = [];
let displayedCount = 0;
const BATCH_SIZE = 10; // COMMENT: Number of albums loaded per batch
let currentPhotos = [];
let currentPhotoIndex = 0;
let currentDesc = '';
let currentCamera = '';
let activeTag = null;

// COMMENT: Cache frequently accessed DOM elements
const backHomeBtn = document.getElementById('backHomeBtn');
const scrollBtn = document.getElementById('scrollTopBtn');
const rightPanel = document.getElementById('right-panel');
const lightbox = document.getElementById('lightbox');

// get year for copyright
document.getElementById('year').textContent = new Date().getFullYear();

// ========== FONT SPLIT UTILITY =============
// Splits text into spans with different classes for Chinese and English
function splitTitleWithFonts(title) {
  const container = document.createElement('span');
  let buffer = '';
  let currentType = '';

  function flushBuffer() {
    if (buffer) {
      const span = document.createElement('span');
      span.textContent = buffer;
      span.className = (currentType === 'chinese') ? 'chinese-font' : 'english-font';
      container.appendChild(span);
      buffer = '';
    }
  }

  function getCharType(char) {
    if (/[\u4e00-\u9fff]/.test(char)) return 'chinese';
    if (/[\u3000-\u303F\uFF00-\uFFEF\u2022]/.test(char)) return 'chinese'; // Chinese punctuation + bullet
    return 'english';
  }

  for (const char of title) {
    const charType = getCharType(char);
    if (charType !== currentType && buffer.length > 0) {
      flushBuffer();
    }
    buffer += char;
    currentType = charType;
  }
  flushBuffer();

  return container;
}

// ========== SCROLL HANDLER =============
// COMMENT: Controls visibility of scroll-to-top button based on layout & lightbox state
function handleScroll() {
  // COMMENT: Hide scroll button if lightbox is active
  if (lightbox && lightbox.classList.contains('show')) {
    scrollBtn.style.display = 'none';
    return;
  }

  if (document.body.classList.contains('vertical-layout')) {
    scrollBtn.style.display = 'block'; // COMMENT: Vertical layout - always visible
  } else {
    const scrollTop = rightPanel.scrollTop;
    scrollBtn.style.display = scrollTop > 200 ? 'block' : 'none'; // COMMENT: Horizontal layout - show after scrolling 200px
  }
}

// COMMENT: Dynamically binds the correct scroll listener based on layout
function bindScrollListener() {
  window.removeEventListener('scroll', handleScroll);
  rightPanel.removeEventListener('scroll', handleScroll);

  const container = document.body.classList.contains('vertical-layout') ? window : rightPanel;
  container.addEventListener('scroll', handleScroll);

  //console.log("Scroll listener bound to:", container === window ? "window" : "#right-panel");
}

// COMMENT: Smoothly scrolls to the top of the page
function scrollToTop() {
  if (document.body.classList.contains('vertical-layout')) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ========== LAYOUT DETECTION =============
// COMMENT: Switches between vertical and horizontal layouts based on screen size/orientation
function checkVerticalLayout() {
  const isVertical = window.innerWidth < 900 || window.innerHeight > window.innerWidth;
  if (isVertical) {
    document.documentElement.classList.add("vertical-layout");
    document.body.classList.add("vertical-layout");

    // COMMENT: Ensure scroll button is visible when switching to vertical
    if (!(lightbox && lightbox.classList.contains('show'))) {
      scrollBtn.style.display = 'block';
    }
  } else {
    document.documentElement.classList.remove("vertical-layout");
    document.body.classList.remove("vertical-layout");
  }
  bindScrollListener();
}
window.addEventListener('resize', checkVerticalLayout);

// ========== GALLERY LOADING =============
// COMMENT: Fetches album data and renders gallery
async function loadGallery() {
  try {
    const response = await fetch('https://list.yitingli.xyz/gallery.json');
    allAlbums = await response.json();
    filteredAlbums = [...allAlbums];
    displayedCount = 0;
    renderAlbums(true);
    bindTagEvents();
  } catch (e) {
    console.error('Loading album error:', e);
  }
}

// COMMENT: Renders a batch of albums into the gallery
function renderAlbums(reset = false) {
  const gallery = document.getElementById('gallery');
  const moreBtn = document.getElementById('moreButton');
  if (!gallery || !moreBtn) return;
  if (reset) gallery.innerHTML = '';

  const end = Math.min(displayedCount + BATCH_SIZE, filteredAlbums.length);
  for (let i = displayedCount; i < end; i++) {
    const album = filteredAlbums[i];
    const wrapper = document.createElement('div');
    wrapper.className = 'album-wrapper';

    // Album cover image
    const imgContainer = document.createElement('div');
    imgContainer.className = 'album-image-container';
    const img = document.createElement('img');
    img.src = album.cover;
    img.alt = album.title;
    img.loading = 'lazy'; // enable lazy loading
    img.addEventListener('click', () => openLightbox(album.photos, 0, album.desc, album.camera));
    imgContainer.appendChild(img);

    // Album title with optional NEW badge
    const titleDiv = document.createElement('div');
    titleDiv.className = 'album-title';
    if (album.new === 1) {
      const newSpan = document.createElement('span');
      newSpan.innerText = 'NEW! ';
      newSpan.className = 'new-badge';
      titleDiv.appendChild(newSpan);
    }
    // Use font-split function
    const title = album.title || 'Untitled';
    titleDiv.appendChild(splitTitleWithFonts(title));

    wrapper.appendChild(imgContainer);
    wrapper.appendChild(titleDiv);
    gallery.appendChild(wrapper);
  }
  displayedCount = end;
  moreBtn.style.display = (displayedCount < filteredAlbums.length) ? 'block' : 'none';
}

// COMMENT: Loads additional albums when 'More' button is clicked
function loadMoreAlbums() {
  renderAlbums();
}

// ========== TAG FILTERING =============
// COMMENT: Binds click events to tags for album filtering
function bindTagEvents() {
  document.querySelectorAll('#tagBar .tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const tagValue = tag.dataset.tag;
      document.querySelectorAll('#tagBar .tag').forEach(t => t.classList.remove('active'));

      if (activeTag === tagValue) {
        activeTag = null;
        filteredAlbums = [...allAlbums];
      } else {
        activeTag = tagValue;
        filteredAlbums = allAlbums.filter(a => a.tags && a.tags.includes(tagValue));
        tag.classList.add('active');
      }
      displayedCount = 0;
      renderAlbums(true);
    });
  });
}
// ===== Scroll lock for mobile without disabling pinch-zoom =====
let scrollTopPosition = 0;

function disableScroll() {
  scrollTopPosition = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollTopPosition}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

function enableScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollTopPosition);
}
// ========== LIGHTBOX FUNCTIONS =============
// COMMENT: Opens the lightbox with selected album photos
function openLightbox(photos, startIndex, desc, camera) {
  currentPhotos = photos;
  currentPhotoIndex = startIndex;
  currentDesc = desc;
  currentCamera = camera || 'Unknown Camera';
  updateLightbox();

  lightbox.classList.add('show');
  disableScroll(); // Lock scroll

  if (backHomeBtn) backHomeBtn.style.display = 'none';
  if (scrollBtn) scrollBtn.style.display = 'none';
}

// COMMENT: Updates lightbox content (photo, description, and counter)
function updateLightbox() {
  const img = document.getElementById('lightbox-img');
  const descContent = document.getElementById('photo-desc-content');
  if (descContent) {
    // Apply font split for camera + desc
    const combinedText = `${currentCamera}<br>${currentDesc || ''}`;
    const parts = combinedText.split('<br>');
    descContent.innerHTML = ''; // Clear existing content

    const cameraSpan = splitTitleWithFonts(parts[0]);
    descContent.appendChild(cameraSpan);
    descContent.appendChild(document.createElement('br'));

    if (parts[1]) {
      const descSpan = splitTitleWithFonts(parts[1]);
      descContent.appendChild(descSpan);
    }
  }

  // Create or update photo counter
  let counter = document.getElementById('photo-counter');
  if (!counter) {
    counter = document.createElement('span');
    counter.id = 'photo-counter';
    Object.assign(counter.style, {
      position: 'absolute',
      bottom: '5%',
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#000',
      fontSize: '0.9rem',
      zIndex: '220'
    });
    const controls = document.querySelector('.lightbox-controls');
    if (controls) controls.appendChild(counter);
  }
  counter.textContent = `${currentPhotoIndex + 1} / ${currentPhotos.length}`;
  img.src = currentPhotos[currentPhotoIndex];

  // ===== pre load next and prev photo  =====
  if (currentPhotoIndex < currentPhotos.length - 1) {
    const nextImg = new Image();
    nextImg.src = currentPhotos[currentPhotoIndex + 1];
  }
  if (currentPhotoIndex > 0) {
    const prevImg = new Image();
    prevImg.src = currentPhotos[currentPhotoIndex - 1];
  }
}

// COMMENT: Closes the lightbox and restores scroll
function closeLightbox() {
  lightbox.classList.remove('show');
  enableScroll(); // Restore scroll

  if (backHomeBtn) backHomeBtn.style.display = 'inline-block';
  handleScroll(); // Reset scroll button state
}
// COMMENT: Moves to the next photo in lightbox
function nextPhoto() {
  if (currentPhotoIndex < currentPhotos.length - 1) {
    currentPhotoIndex++;
    updateLightbox();
  }
}

// COMMENT: Moves to the previous photo in lightbox
function prevPhoto() {
  if (currentPhotoIndex > 0) {
    currentPhotoIndex--;
    updateLightbox();
  }
}

// ========== DESCRIPTION BOX TOGGLE =============
// COMMENT: Toggles visibility of the photo description box
function toggleDescBox() {
  const box = document.getElementById('photo-desc-content');
  if (box) box.classList.toggle('show');
}

// ========== INITIALIZATION =============
// COMMENT: Initialize gallery, layout, and scroll listeners on page load
window.onload = function() {
  loadGallery();
  checkVerticalLayout();
  bindScrollListener();
  handleScroll();
};

// COMMENT: Navigates back to home page
function goHome() {
  window.location.href = "index.html";
}
