// gallery.js: call by gallery.html
let allAlbums = [];
let filteredAlbums = [];
let displayedCount = 0;
const BATCH_SIZE = 10;
let currentPhotos = [];
let currentPhotoIndex = 0;
let currentDesc = '';
let currentCamera = '';
let activeTag = null;

// decide whether resize the layout
function checkVerticalLayout() {
  const isVertical = window.innerWidth < 900 || window.innerHeight > window.innerWidth; 

  if (isVertical) {
    document.documentElement.classList.add("vertical-layout");
    document.body.classList.add("vertical-layout");
  } else {
    document.documentElement.classList.remove("vertical-layout");
    document.body.classList.remove("vertical-layout");
  }
}

// initial check
checkVerticalLayout();

// when window change, check again
window.addEventListener('resize', checkVerticalLayout);
// resize end here

// load gallery
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
//渲染相册
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
    titleDiv.innerText = album.title ? album.title : 'Something Random';
    wrapper.appendChild(imgContainer);
    wrapper.appendChild(titleDiv);
    gallery.appendChild(wrapper);
  }
  displayedCount = end;
  moreBtn.style.display = (displayedCount < filteredAlbums.length) ? 'block' : 'none';
}
// load more 
function loadMoreAlbums() { renderAlbums(); }
//绑定tag event
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
// ======== light box ===========
function openLightbox(photos, startIndex, desc, camera) {
  currentPhotos = photos;
  currentPhotoIndex = startIndex;
  currentDesc = desc;
  currentCamera = camera || 'Unknown Camera';
  updateLightbox();
  document.getElementById('lightbox').classList.add('show');

  // COMMENT: Hide the Back to Home button when lightbox is open
  const backBtn = document.getElementById('backHomeBtn');
  if (backBtn) backBtn.style.display = 'none';
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

  // COMMENT: Show the Back to Home button again when lightbox is closed
  const backBtn = document.getElementById('backHomeBtn');
  if (backBtn) backBtn.style.display = 'inline-block';
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
// ================== Scroll to Top ==================
const scrollBtn = document.getElementById('scrollTopBtn');

function bindScrollListener() {
  const container = document.body.classList.contains('vertical-layout') ? window : document.getElementById('right-panel');

  // 【UPDATED】先移除旧的监听器，防止重复绑定
  if (bindScrollListener._lastContainer) {
    bindScrollListener._lastContainer.removeEventListener('scroll', bindScrollListener._handler);
  }

  // 【UPDATED】定义新的滚动处理函数
  bindScrollListener._handler = () => {
    const scrollTop = container === window ? window.scrollY : container.scrollTop;
    scrollBtn.style.display = scrollTop > 300 ? 'block' : 'none';
  };

  // 【UPDATED】绑定新的监听器
  container.addEventListener('scroll', bindScrollListener._handler);
  bindScrollListener._lastContainer = container;
}

// 【UPDATED】当布局切换时重新绑定滚动监听
window.addEventListener('resize', () => {
  checkVerticalLayout(); // 保持原有布局检查
  bindScrollListener();  // 【新增】重新绑定监听
});

// 初始化时绑定
bindScrollListener();

function scrollToTop() {
  const container = document.body.classList.contains('vertical-layout') ? window : document.getElementById('right-panel');
  if (container === window) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// load more
window.onload = loadGallery;

// back to home
function goHome() {
  window.location.href = "index.html"; // main page html
}
