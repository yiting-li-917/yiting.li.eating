// ========== Gallery and Layout =============
let allAlbums = [];
let filteredAlbums = [];
let displayedCount = 0;
const BATCH_SIZE = 10;
let currentPhotos = [];
let currentPhotoIndex = 0;
let currentDesc = '';
let currentCamera = '';
let activeTag = null;
const backHomeBtn = document.getElementById('backHomeBtn'); // COMMENT: Added reference to back to home button

// COMMENT: Check vertical/horizontal layout
function checkVerticalLayout() {
  const isVertical = window.innerWidth < 900 || window.innerHeight > window.innerWidth;
  if (isVertical) {
    document.documentElement.classList.add("vertical-layout");
    document.body.classList.add("vertical-layout");
  } else {
    document.documentElement.classList.remove("vertical-layout");
    document.body.classList.remove("vertical-layout");
  }
  bindScrollListener(); // COMMENT: Re-bind scroll listener when layout changes
}

window.addEventListener('resize', checkVerticalLayout);

// ========== Scroll to Top =============
const scrollBtn = document.getElementById('scrollTopBtn');
const rightPanel = document.getElementById('right-panel');

function bindScrollListener() {
  window.removeEventListener('scroll', handleScroll);
  rightPanel.removeEventListener('scroll', handleScroll);
  const container = document.body.classList.contains('vertical-layout') ? window : rightPanel;
  container.addEventListener('scroll', handleScroll);
  console.log("Scroll listener bound to:", container === window ? "window" : "#right-panel");
}

function handleScroll() {
  const container = document.body.classList.contains('vertical-layout') ? window : rightPanel;
  const scrollTop = container === window ? window.scrollY : rightPanel.scrollTop;
  scrollBtn.style.display = scrollTop > 300 ? 'block' : 'none';
  console.log("ScrollTop:", scrollTop, "Button Display:", scrollBtn.style.display);
}

function scrollToTop() {
  const container = document.body.classList.contains('vertical-layout') ? window : rightPanel;
  if (container === window) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ========== Gallery Loading =============
async function loadGallery() {
  try {
    const response = await fetch('https://www.yitingli.xyz/gallery.json');
    allAlbums = await response.json();
    filteredAlbums = [...allAlbums];
    displayedCount = 0;
    renderAlbums(true);
    bindTagEvents();
  } catch (e) {
    console.error('Loading album error:', e);
  }
}

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
    const imgContainer = document.createElement('div');
    imgContainer.className = 'album-image-container';
    const img = document.createElement('img');
    img.src = album.cover;
    img.alt = album.title;
    img.addEventListener('click', () => openLightbox(album.photos, 0, album.desc, album.camera));
    imgContainer.appendChild(img);
    const titleDiv = document.createElement('div');
    titleDiv.className = 'album-title';
    titleDiv.innerText = album.title || 'Untitled';
    wrapper.appendChild(imgContainer);
    wrapper.appendChild(titleDiv);
    gallery.appendChild(wrapper);
  }
  displayedCount = end;
  moreBtn.style.display = (displayedCount < filteredAlbums.length) ? 'block' : 'none';
}

function loadMoreAlbums() { renderAlbums(); }

// ========== Tag Events =============
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

// ========== Lightbox =============
function openLightbox(photos, startIndex, desc, camera) {
  currentPhotos = photos;
  currentPhotoIndex = startIndex;
  currentDesc = desc;
  currentCamera = camera || 'Unknown Camera';
  updateLightbox();
  document.getElementById('lightbox').classList.add('show');
  if (backHomeBtn) backHomeBtn.style.display = 'none'; // COMMENT: Hide Back to Home button when lightbox is open
}

function updateLightbox() {
  const img = document.getElementById('lightbox-img');
  const descBox = document.getElementById('photo-desc');
  descBox.innerHTML = `Camera: ${currentCamera}<br>${currentDesc || ''}`;
  descBox.style.display = 'block';
  img.src = currentPhotos[currentPhotoIndex];
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('show');
  if (backHomeBtn) backHomeBtn.style.display = 'inline-block'; // COMMENT: Show Back to Home button when lightbox is closed
}

function nextPhoto() {
  if (currentPhotoIndex < currentPhotos.length - 1) {
    currentPhotoIndex++;
    updateLightbox();
  }
}

function prevPhoto() {
  if (currentPhotoIndex > 0) {
    currentPhotoIndex--;
    updateLightbox();
  }
}

// ========== Initialize =============
window.onload = function() {
  loadGallery();
  checkVerticalLayout();
  bindScrollListener();
};

function goHome() {
  window.location.href = "index.html";
}
