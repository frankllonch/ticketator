console.log("APP.JS VERSION 999 - LOADED");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Configuració Firebase del projecte
const firebaseConfig = {
  apiKey: "AIzaSyBJ7N9BihtiqEw0-bCrbrX8Ci_FYl0vM2s",
  authDomain: "ticketator-57be6.firebaseapp.com",
  projectId: "ticketator-57be6",
  storageBucket: "ticketator-57be6.firebasestorage.app",
  messagingSenderId: "6015225460",
  appId: "1:6015225460:web:c094e13330278bf0b58b21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements del DOM
const grid = document.getElementById("ticketsGrid");
const status = document.getElementById("status");

// Carregar tickets
async function loadTickets() {
  status.textContent = "Carregant tickets...";

  try {
    const ticketSnap = await getDocs(collection(db, "tickets"));

    if (ticketSnap.empty) {
      status.textContent = "No hi ha tickets registrats.";
      return;
    }

    status.textContent = `S'han carregat ${ticketSnap.size} tickets.`;

    ticketSnap.forEach(doc => {
      const data = doc.data();

      const card = document.createElement("div");
      card.className = "card";

      // Comerç
      const merchant = document.createElement("div");
      merchant.className = "merchant";
      merchant.textContent = data.merchant || "Sense nom";
      card.appendChild(merchant);

      // Meta info
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${data.date || "???"} — Total ${data.total ?? 0} ${data.currency || ""}`;
      card.appendChild(meta);

      // Imatge del tiquet (always rendered)
      const img = document.createElement("img");
      img.src = data.imageUrl || "";
      img.alt = "Imatge del tiquet";
      img.style.width = "100%";
      img.style.borderRadius = "8px";
      img.style.marginTop = "10px";
      card.appendChild(img);

      // Botó ITEMS
      const btnItems = document.createElement("div");
      btnItems.className = "btn";
      btnItems.textContent = "Mostrar Items";
      card.appendChild(btnItems);

      const itemsBox = document.createElement("div");
      itemsBox.className = "json-box";

      itemsBox.textContent = data.items
        ? data.items.map(it => `${it.qty}x ${it.description} — ${it.price}€`).join("\n")
        : "Sense items";

      card.appendChild(itemsBox);

      btnItems.addEventListener("click", () => {
        itemsBox.style.display = itemsBox.style.display === "block" ? "none" : "block";
      });

      // Botó RAW
      const btnRaw = document.createElement("div");
      btnRaw.className = "btn";
      btnRaw.textContent = "Mostrar RAW";
      card.appendChild(btnRaw);

      const rawBox = document.createElement("div");
      rawBox.className = "json-box";
      rawBox.textContent = data.raw || "Cap RAW disponible.";
      card.appendChild(rawBox);

      btnRaw.addEventListener("click", () => {
        rawBox.style.display = rawBox.style.display === "block" ? "none" : "block";
      });

      grid.appendChild(card);
    });

  } catch (err) {
    status.textContent = "Error carregant tickets: " + err.message;
    console.error(err);
  }
}

loadTickets();