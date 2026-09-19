/**
 * Hispanic Heritage Month Sticker Contest - Frontend Engine
 */

const APPS_SCRIPT_API = "https://script.google.com/macros/s/AKfycbzdCi1jXWLNLoSgyZCtEuCpxeom2BjumBgBNqNBm3nrQnvH22ADfq6PpFOMRPybkZI/exec";

// Toggle to enable/disable sample mock data for offline testing
// Set to false for live production with Google Sheets
const USE_SAMPLE_DATA = false;

// Sample preview stickers (only used if USE_SAMPLE_DATA is set to true)
const SAMPLE_STICKERS = [
  {
    id: "sample_1",
    title: "Corazón y Raíces",
    designer: "Elena Vega",
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    votes: 28
  },
  {
    id: "sample_2",
    title: "Sol Azteca Tech",
    designer: "Mateo Silva",
    imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    votes: 21
  },
  {
    id: "sample_3",
    title: "Unidad & Cultura",
    designer: "Sofia Delgado",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    votes: 17
  },
  {
    id: "sample_4",
    title: "Luchador Innovator",
    designer: "Lucas Gomez",
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80",
    votes: 11
  }
];

let allStickers = [];
let selectedStickerId = null;

async function initApp() {
  await loadAndRender();

  const voteForm = document.getElementById("voteForm");
  if (voteForm) {
    voteForm.addEventListener("submit", handleVoteSubmit);
  }

  // Silent background refresh every 15s
  setInterval(async () => {
    await loadAndRender(true);
  }, 15000);
}

async function fetchContestData() {
  try {
    const res = await fetch(APPS_SCRIPT_API + "?action=getStickers", {
      method: "GET",
      cache: "no-store"
    });
    return await res.json();
  } catch (err) {
    console.error("API fetch error:", err);
    return { success: false, stickers: [] };
  }
}

async function loadAndRender(isSilent = false) {
  const data = await fetchContestData();
  
  if (data.success && data.stickers && data.stickers.length > 0) {
    allStickers = data.stickers;
  } else if (USE_SAMPLE_DATA) {
    allStickers = SAMPLE_STICKERS;
  } else {
    allStickers = [];
  }

  const topSection = document.getElementById("topThreeSection");
  const otherSection = document.getElementById("otherEntriesSection");
  const emptyState = document.getElementById("emptyState");
  const topGrid = document.getElementById("topThreeGrid");
  const stickersList = document.getElementById("stickersList");

  if (allStickers.length === 0) {
    if (topSection) topSection.style.display = "none";
    if (otherSection) otherSection.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  // Sort by votes descending
  const sorted = [...allStickers].sort((a, b) => b.votes - a.votes);

  // 1. Render Top 3
  const top3 = sorted.slice(0, 3);
  if (top3.length > 0) {
    topSection.style.display = "block";

    const rank1 = top3[0] || null;
    const rank2 = top3[1] || null;
    const rank3 = top3[2] || null;

    let podiumHtml = "";

    // 2nd Place (Left)
    if (rank2) {
      podiumHtml += renderTopCard(rank2, 2, "🥈");
    }

    // 1st Place (Center)
    if (rank1) {
      podiumHtml += renderTopCard(rank1, 1, "👑");
    }

    // 3rd Place (Right)
    if (rank3) {
      podiumHtml += renderTopCard(rank3, 3, "🥉");
    }

    topGrid.innerHTML = podiumHtml;
  } else {
    topSection.style.display = "none";
  }

  // 2. Render Remaining Entries
  const remaining = sorted.slice(3);
  if (remaining.length > 0) {
    otherSection.style.display = "block";
    stickersList.innerHTML = remaining.map((sticker, idx) => `
      <div class="sticker-row" onclick="openVoteModal('${sticker.id}')" style="cursor: pointer;">
        <span class="row-rank">#${idx + 4}</span>
        <img class="row-thumb" src="${sticker.imageUrl}" alt="${sticker.title}" onclick="event.stopPropagation(); openZoom('${sticker.id}')" onerror="this.src='https://placehold.co/100x100/1a1e27/f59e0b?text=Preview'" />
        <div class="row-info">
          <div class="row-title">${escapeHtml(sticker.title)}</div>
          <div class="row-artist">By ${escapeHtml(sticker.designer)}</div>
        </div>
        <div class="row-votes">
          ${sticker.votes} <span>votes</span>
        </div>
      </div>
    `).join("");
  } else {
    otherSection.style.display = "none";
  }

  renderVisualPicker(allStickers);
}

function renderTopCard(sticker, rank, badge) {
  return `
    <div class="top-card rank-${rank}" onclick="openVoteModal('${sticker.id}')" style="cursor: pointer;">
      <div class="rank-badge">${badge}</div>
      <div class="top-card-img-wrap" onclick="event.stopPropagation(); openZoom('${sticker.id}')">
        <img src="${sticker.imageUrl}" alt="${sticker.title}" onerror="this.src='https://placehold.co/300x300/1a1e27/f59e0b?text=Preview'" />
      </div>
      <div class="top-card-title">${escapeHtml(sticker.title)}</div>
      <div class="top-card-artist">By ${escapeHtml(sticker.designer)}</div>
      <div class="top-card-votes">${sticker.votes} <span>votes</span></div>
    </div>
  `;
}

// ============================== VISUAL PICKER IN MODAL ==============================
function renderVisualPicker(stickers) {
  const container = document.getElementById("visualStickerPicker");
  if (!container) return;

  if (!selectedStickerId && stickers.length > 0) {
    selectedStickerId = stickers[0].id;
  }

  container.innerHTML = stickers.map(s => {
    const isSelected = s.id === selectedStickerId;
    return `
      <div class="visual-sticker-option ${isSelected ? 'selected' : ''}" onclick="selectSticker('${s.id}')">
        <img class="option-thumb" src="${s.imageUrl}" alt="${s.title}" onerror="this.src='https://placehold.co/100x100/1a1e27/f59e0b?text=Sticker'" />
        <div>
          <div class="option-title">${escapeHtml(s.title)}</div>
          <div class="option-artist">By ${escapeHtml(s.designer)}</div>
        </div>
        <input type="radio" name="stickerSelection" value="${s.id}" class="option-radio" ${isSelected ? 'checked' : ''} />
      </div>
    `;
  }).join("");
}

function selectSticker(id) {
  selectedStickerId = id;
  renderVisualPicker(allStickers);
}

function openVoteModal(preSelectedId = null) {
  if (preSelectedId) {
    selectedStickerId = preSelectedId;
  }
  renderVisualPicker(allStickers);

  const errorMsg = document.getElementById("voteErrorMsg");
  if (errorMsg) errorMsg.style.display = "none";

  const savedUsername = localStorage.getItem("hh_voter_username");
  if (savedUsername) {
    document.getElementById("hawkUsername").value = savedUsername;
  }

  document.getElementById("voteModal").classList.add("active");
}

async function handleVoteSubmit(e) {
  e.preventDefault();
  const usernameInput = document.getElementById("hawkUsername");
  const errorMsg = document.getElementById("voteErrorMsg");
  const submitBtn = document.getElementById("btnSubmitVote");

  let username = usernameInput.value.trim().toLowerCase();
  errorMsg.style.display = "none";

  // If user accidentally included @hawk..., extract the username part
  if (username.includes("@")) {
    username = username.split("@")[0].trim();
  }

  if (!username) {
    errorMsg.textContent = "Please enter your Hawk ID username.";
    errorMsg.style.display = "block";
    return;
  }

  if (!selectedStickerId) {
    errorMsg.textContent = "Please select a sticker design.";
    errorMsg.style.display = "block";
    return;
  }

  const fullEmail = `${username}@hawk.illinoistech.edu`;

  submitBtn.disabled = true;
  submitBtn.textContent = "Recording Vote...";

  try {
    // If testing with sample data before real submissions exist:
    if (selectedStickerId.startsWith("sample_")) {
      const sample = allStickers.find(s => s.id === selectedStickerId);
      if (sample) sample.votes += 1;
      localStorage.setItem("hh_voter_username", username);
      closeAllModals();
      alert(`🎉 Demo Vote Recorded for "${sample.title}"! (Live votes will record directly into your Google Sheet)`);
      await loadAndRender();
      return;
    }

    const res = await fetch(APPS_SCRIPT_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        voterEmail: fullEmail,
        stickerId: selectedStickerId
      })
    });

    const result = await res.json();
    if (result.success) {
      localStorage.setItem("hh_voter_username", username);
      closeAllModals();
      alert("🎉 Your vote has been recorded! Thank you for supporting the artists.");
      await loadAndRender();
    } else {
      errorMsg.textContent = result.error || "Submission failed. Please try again.";
      errorMsg.style.display = "block";
    }
  } catch (err) {
    errorMsg.textContent = "Network error. Please try again.";
    errorMsg.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Vote";
  }
}

// ============================== ZOOM LIGHTBOX ==============================
function openZoom(stickerId) {
  const sticker = allStickers.find(s => s.id === stickerId);
  if (!sticker) return;

  document.getElementById("zoomImg").src = sticker.imageUrl;
  document.getElementById("zoomTitle").textContent = sticker.title;
  document.getElementById("zoomArtist").textContent = `By ${sticker.designer}`;

  document.getElementById("zoomModal").classList.add("active");
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
}

function escapeHtml(str) {
  return String(str || "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
