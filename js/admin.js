// 1. Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB4whTIJbHf83ClTU3p08B9fhWof_atc_U",
  authDomain: "ram-brahmmam-jewelleries.firebaseapp.com",
  projectId: "ram-brahmmam-jewelleries",
  storageBucket: "ram-brahmmam-jewelleries.firebasestorage.app",
  messagingSenderId: "265229185647",
  appId: "1:265229185647:web:d5cdf9cce847724aff139a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. Auth Protection
const PASSCODE = "rbj@2026";

function login() {
  if (document.getElementById('adminPass').value === PASSCODE) {
    document.getElementById('loginScreen').style.display = 'none';
    sessionStorage.setItem('rbj_auth', 'true');
    loadLiveList();
    loadSiteSettings();
  } else {
    document.getElementById('errTxt').style.display = 'block';
  }
}

function logout() {
  sessionStorage.removeItem('rbj_auth');
  location.reload();
}

if (sessionStorage.getItem('rbj_auth') === 'true') {
  document.getElementById('loginScreen').style.display = 'none';
  window.onload = () => { loadLiveList(); loadSiteSettings(); };
}

// 3. Tab Switcher
function showTab(tab) {
  document.getElementById('galleryTab').style.display = (tab === 'gallery') ? 'block' : 'none';
  document.getElementById('settingsTab').style.display = (tab === 'settings') ? 'block' : 'none';
  document.getElementById('tabGalleryBtn').classList.toggle('active', tab === 'gallery');
  document.getElementById('tabSettingsBtn').classList.toggle('active', tab === 'settings');
}

// 4. Compress Image to Base64
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 550;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
    };
  });
}

// 5. Publish Jewellery Item
async function publishItem() {
  const name = document.getElementById('itemName').value.trim();
  const cat = document.getElementById('itemCat').value;
  const grams = document.getElementById('itemGrams').value.trim() || "Custom";
  const code = document.getElementById('itemCode').value.trim() || ("RB-" + Date.now().toString().slice(-4));
  const file = document.getElementById('itemFile').files[0];
  const url = document.getElementById('itemUrl').value.trim();
  const status = document.getElementById('publishStatus');

  if (!name) { alert("Please enter jewellery title!"); return; }
  if (!file && !url) { alert("Please choose a photo or paste an image URL!"); return; }

  status.style.color = "#8c6717";
  status.innerText = "Publishing design to live website...";
  document.getElementById('publishBtn').disabled = true;

  try {
    let finalImg = url;
    if (file) {
      finalImg = await compressImage(file);
    }

    await db.collection("catalog").add({
      code: code,
      name: name,
      category: cat,
      grams: grams,
      img: finalImg,
      createdAt: Date.now()
    });

    status.style.color = "#15803d";
    status.innerText = "✓ Published successfully! Visible on main website.";
    document.getElementById('itemName').value = '';
    document.getElementById('itemGrams').value = '';
    document.getElementById('itemCode').value = '';
    document.getElementById('itemUrl').value = '';
    document.getElementById('itemFile').value = '';
  } catch (err) {
    status.style.color = "#b91c1c";
    status.innerText = "Error: " + err.message;
  }
  document.getElementById('publishBtn').disabled = false;
}

// 6. Load Live List
function loadLiveList() {
  const tbody = document.getElementById('liveListBody');
  db.collection("catalog").orderBy("createdAt", "desc").onSnapshot((snap) => {
    tbody.innerHTML = '';
    document.getElementById('countTxt').innerText = `${snap.size} custom photos uploaded`;

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color:#8c7a6b;">No custom photos added yet. Upload using the form above!</td></tr>`;
      return;
    }

    snap.forEach((doc) => {
      const item = doc.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${item.img}" class="thumb-preview"></td>
        <td><strong>${item.code}</strong></td>
        <td>${item.name}</td>
        <td style="text-transform: capitalize;">${item.category}</td>
        <td><strong style="color:var(--gold-dark);">${item.grams}</strong></td>
        <td><button class="del-btn" onclick="deleteItem('${doc.id}')">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

async function deleteItem(id) {
  if (confirm("Are you sure you want to delete this design?")) {
    await db.collection("catalog").doc(id).delete();
  }
}

// 7. Settings Handlers
async function saveSiteSettings() {
  const status = document.getElementById('settingsStatus');
  status.innerText = "Saving settings...";
  try {
    await db.collection("siteMeta").doc("settings").set({
      rate22k: document.getElementById('set22k').value,
      rate24k: document.getElementById('set24k').value,
      phone: document.getElementById('setPhone').value,
      address: document.getElementById('setAddress').value
    }, { merge: true });
    status.innerText = "✓ Settings saved! Main site updated.";
  } catch (e) {
    status.innerText = "Error: " + e.message;
  }
}

async function loadSiteSettings() {
  const snap = await db.collection("siteMeta").doc("settings").get();
  if (snap.exists) {
    const d = snap.data();
    if (d.rate22k) document.getElementById('set22k').value = d.rate22k;
    if (d.rate24k) document.getElementById('set24k').value = d.rate24k;
    if (d.phone) document.getElementById('setPhone').value = d.phone;
    if (d.address) document.getElementById('setAddress').value = d.address;
  }
}