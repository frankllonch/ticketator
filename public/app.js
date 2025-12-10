console.log("APP.JS VERSION 1002 - FLIP CARDS + FILTER + SUMMARY");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBJ7N9BihtiqEw0-bCrbrX8Ci_FYl0vM2s",
  authDomain: "ticketator-57be6.firebaseapp.com",
  projectId: "ticketator-57be6",
  storageBucket: "ticketator-57be6.firebasestorage.app",
  messagingSenderId: "6015225460",
  appId: "1:6015225460:web:c094e13330278bf0b58b21",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM refs
const grid = document.getElementById("ticketsGrid");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

let allTickets = [];

// Utils
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // If Firestore stores other formats, show as-is
    return dateStr;
  }
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatAmount(num) {
  if (num == null || isNaN(num)) return { int: "0", dec: "00" };
  const fixed = Number(num).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  return { int: intPart, dec: decPart };
}

// Truncate to avoid multi-line overflow in the card
function truncateText(str, maxLength) {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

// If someday you store an explicit "type" field in Firestore, we use that; else infer
function getTicketType(ticket) {
  if (ticket.type) return ticket.type.toUpperCase();

  const name = (ticket.merchant || "").toLowerCase();

  if (name.includes("mercadona") || name.includes("carrefour") || name.includes("lidl")) {
    return "SUPER";
  }
  if (name.includes("restaurant") || name.includes("rest.") || name.includes("bar ")) {
    return "RESTAURANT";
  }

  return "—";
}

// Render one card
function createTicketCard(ticket) {
  const { int: totalInt, dec: totalDec } = formatAmount(ticket.total);
  const dateLabel = formatDate(ticket.date);
  const typeLabel = ticket.category
    ? ticket.category.toUpperCase()
    : getTicketType(ticket);

  const vatLabel =
    ticket.vat != null && !isNaN(ticket.vat) ? Number(ticket.vat).toFixed(2) : null;

  // New LLM fields
  const categoryValue = ticket.category || "OTHER";
  const summaryValue = ticket.summary || "";

  const tilt = document.createElement("div");
  tilt.className = "ticket-card-tilt";

  const outer = document.createElement("div");
  outer.className = "ticket-card-outer";

  const inner = document.createElement("div");
  inner.className = "ticket-card-inner";

  // FRONT
  const front = document.createElement("div");
  front.className = "card-face card-front";

  // header
  const header = document.createElement("div");
  header.className = "card-front-header";

  const left = document.createElement("div");

  const labelComercio = document.createElement("div");
  labelComercio.className = "label-chip";
  labelComercio.textContent = "Comerci";

  const merchantName = document.createElement("div");
  merchantName.className = "merchant-name";
  merchantName.textContent = ticket.merchant || "Sense nom";
  merchantName.style.whiteSpace = "normal";
  merchantName.style.display = "block";
  merchantName.style.lineHeight = "1.15";
  merchantName.style.maxHeight = "1em"; // allows two lines
  merchantName.style.overflow = "hidden";

  left.appendChild(labelComercio);
  left.appendChild(merchantName);

  const typePill = document.createElement("div");
  typePill.className = "type-pill";
  typePill.textContent = typeLabel;
  typePill.style.display = "inline-block";
  typePill.style.whiteSpace = "normal";
  typePill.style.padding = "5px 12px";
  typePill.style.lineHeight = "1.2";
  typePill.style.maxWidth = "220px";
  typePill.style.overflow = "visible";
  typePill.style.textOverflow = "unset";


  header.appendChild(left);
  header.appendChild(typePill);

  // middle
  const middle = document.createElement("div");
  middle.className = "card-front-middle";

  const dateBlock = document.createElement("div");
  dateBlock.className = "date-block";

  const dateLabelEl = document.createElement("div");
  dateLabelEl.className = "label-chip";
  dateLabelEl.textContent = "Data";

  const dateText = document.createElement("div");
  dateText.className = "date-text";
  dateText.textContent = dateLabel;

  dateBlock.appendChild(dateLabelEl);
  dateBlock.appendChild(dateText);

  const amountBlock = document.createElement("div");
  amountBlock.className = "amount-block";

  const amountLabel = document.createElement("div");
  amountLabel.className = "label-chip";
  amountLabel.textContent = "Total";

  const amountMain = document.createElement("div");
  amountMain.className = "amount-main";

  const intSpan = document.createElement("span");
  intSpan.className = "amount-int";
  intSpan.textContent = totalInt;

  const decSpan = document.createElement("span");
  decSpan.className = "amount-dec";
  decSpan.textContent = "." + totalDec;

  amountMain.appendChild(intSpan);
  amountMain.appendChild(decSpan);

  const currency = document.createElement("div");
  currency.className = "amount-currency";
  currency.textContent = ticket.currency || "";

  const vat = document.createElement("div");
  vat.className = "amount-vat";
  vat.textContent = vatLabel ? `IVA: ${vatLabel}` : "IVA: —";

  amountBlock.appendChild(amountLabel);
  amountBlock.appendChild(amountMain);
  amountBlock.appendChild(currency);
  amountBlock.appendChild(vat);

  middle.appendChild(dateBlock);
  middle.appendChild(amountBlock);

  // footer
  const footer = document.createElement("div");
  footer.className = "card-front-footer";

  // Short description / summary from LLM
  const summaryEl = document.createElement("div");
  summaryEl.className = "summary-text";
  summaryEl.textContent = truncateText(summaryValue, 10); // 1–2 lines max

  const flipHint = document.createElement("div");
  flipHint.className = "flip-hint";
  flipHint.innerHTML = '<span>Click</span> per veure el tiquet';
  flipHint.style.whiteSpace = "nowrap";

  summaryEl.style.marginTop = "4px";
  summaryEl.style.marginBottom = "4px";
  summaryEl.style.display = "block";

  flipHint.style.marginTop = "0px";
  flipHint.style.marginBottom = "4px";
  flipHint.style.display = "block";

  footer.appendChild(summaryEl);
  footer.appendChild(flipHint);

  front.appendChild(header);
  front.appendChild(middle);
  front.appendChild(footer);

  // BACK
  const back = document.createElement("div");
  back.className = "card-face card-back";

  const backInner = document.createElement("div");
  backInner.className = "card-back-inner";

  const imgWrapper = document.createElement("div");
  imgWrapper.className = "ticket-image-wrapper";
  imgWrapper.style.position = "relative";

  const img = document.createElement("img");
  img.src = ticket.imageUrl || "";
  img.alt = "Imatge del tiquet";

  imgWrapper.appendChild(img);

  // Zoom button
  const zoomBtn = document.createElement("button");
  zoomBtn.textContent = "🔍";
  zoomBtn.style.position = "absolute";
  zoomBtn.style.bottom = "10px";
  zoomBtn.style.right = "10px";
  zoomBtn.style.background = "rgba(0,0,0,0.6)";
  zoomBtn.style.color = "#fff";
  zoomBtn.style.border = "none";
  zoomBtn.style.padding = "6px 10px";
  zoomBtn.style.borderRadius = "8px";
  zoomBtn.style.fontSize = "16px";
  zoomBtn.style.cursor = "pointer";
  zoomBtn.style.zIndex = "10";
  imgWrapper.appendChild(zoomBtn);

  // Zoom logic
  zoomBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const modal = document.getElementById("zoomModal");
    const zoomImg = document.getElementById("zoomImage");
    modal.classList.remove("hidden");
    zoomImg.src = ticket.imageUrl;
  });

  const backLabel = document.createElement("div");
  backLabel.className = "back-label";
  backLabel.textContent = "Click per tornar a la informació del tiquet";

  backInner.appendChild(imgWrapper);
  backInner.appendChild(backLabel);
  back.appendChild(backInner);

  inner.appendChild(front);
  inner.appendChild(back);
  outer.appendChild(inner);
  tilt.appendChild(outer);

  // Flip on click
  outer.addEventListener("click", () => {
    inner.classList.toggle("is-flipped");
  });

  // 3D tilt (like your personal website)
  outer.addEventListener("mousemove", (e) => {
    const rect = outer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 14; // left/right
    const rotateX = ((y / rect.height) - 0.5) * -14; // up/down

    outer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  });

  outer.addEventListener("mouseleave", () => {
    outer.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  });

  return tilt;
}

// Render list with filter + sort
function renderTickets() {
  grid.innerHTML = "";

  const term = (searchInput.value || "").toLowerCase().trim();
  const sortMode = sortSelect.value;

  let filtered = allTickets.filter((t) =>
    (t.merchant || "").toLowerCase().includes(term)
  );

  filtered.sort((a, b) => {
    const dateA = new Date(a.date || "1970-01-01").getTime();
    const dateB = new Date(b.date || "1970-01-01").getTime();
    const totalA = Number(a.total) || 0;
    const totalB = Number(b.total) || 0;

    switch (sortMode) {
      case "date_old":
        return dateA - dateB;
      case "total_high":
        return totalB - totalA;
      case "total_low":
        return totalA - totalB;
      case "date_new":
      default:
        return dateB - dateA;
    }
  });

  if (!filtered.length) {
    statusEl.textContent = "Cap ticket trobat amb aquest filtre.";
  } else {
    statusEl.textContent = `Mostrant ${filtered.length} tickets.`;
  }

  filtered.forEach((ticket) => {
    const card = createTicketCard(ticket);
    grid.appendChild(card);
  });
}

// Load tickets from Firestore
async function loadTickets() {
  statusEl.textContent = "Carregant tickets...";

  try {
    const snapshot = await getDocs(collection(db, "tickets"));

    if (snapshot.empty) {
      statusEl.textContent = "No hi ha tickets registrats.";
      return;
    }

    allTickets = [];
    snapshot.forEach((doc) => {
      allTickets.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    renderTickets();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error carregant tickets: " + err.message;
  }
}

// Filter / sort events
searchInput.addEventListener("input", () => renderTickets());
sortSelect.addEventListener("change", () => renderTickets());

// Zoom modal close
document.getElementById("zoomClose").addEventListener("click", () => {
  document.getElementById("zoomModal").classList.add("hidden");
});

document.querySelector(".zoom-backdrop").addEventListener("click", () => {
  document.getElementById("zoomModal").classList.add("hidden");
});

// Init
loadTickets();