# 📄 Ticketator — Automatic Receipt Parser

Ticketator is an **n8n workflow** that reads receipts from your email, extracts all fields using **Azure Document Intelligence**, saves the ticket image to **Google Drive**, and logs both the receipt header and line items into **Google Sheets**.

---

## 🚀 How It Works

1. **Gmail Trigger**  
   Watches for emails *you send yourself* with subject **`ticket`** and an attached image/PDF.

2. **Attachment Check (IF)**  
   - **True** → continue processing  
   - **False** → sends you an email saying the ticket was missing  

3. **Save Raw Attachment to Google Drive**  
   Stores the original ticket image in your `tickets` folder and returns a public link.

4. **Pre-Processing Node (Code)**  
   - Runs Azure **prebuilt-read**  
   - Detects the vertical text block of the real ticket  
   - Computes a clean **pixelCrop** region  
   - Sends back:
     - cropped region  
     - base64  
     - mime type  
     - filename  

5. **Receipt Parser (Code)**  
   - Calls Azure **prebuilt-receipt** with the cropped region  
   - Extracts:
     - merchant  
     - date  
     - total  
     - VAT  
     - currency  
     - items[] (description, qty, price)  
   - Outputs multiple JSON items:
     - One `{ type: "receipt", ... }`
     - Many `{ type: "item", ... }`  

6. **IF Split**  
   - `type === "receipt"` → goes to Receipts sheet  
   - `type === "item"` → goes to ReceiptItems sheet  

7. **Google Sheets Append**  
   - Receipt → **Receipts** sheet  
   - Items → **ReceiptItems** sheet  
   - Each row includes:
     - Date  
     - Merchant  
     - Total / Qty / Price  
     - Drive URL  

8. **Optional Confirmation Email**  
   Sends you a summary of the processed ticket.

---

## 🧩 Requirements

- **Azure Document Intelligence** endpoint + key  
- **Google OAuth2** for Drive + Sheets  
- **Gmail OAuth2** for trigger and replies  
- **n8n Self-Hosted**  
- **axios** installed and allowed in Code nodes  

---

## 🔧 Install axios for the Code Nodes

npm install -g axios
export NODE_FUNCTION_ALLOW_EXTERNAL=axios

## RUN n8n

export NODE_FUNCTION_ALLOW_EXTERNAL=axios
n8n

# EMAIL trigger adapt to yours

from:your-email@gmail.com subject:"=ticket"


🎯 Summary

Send an email → Ticket saved → Azure extracts data → Sheets updated → Everything logged automatically.