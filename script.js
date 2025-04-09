const backendURL = "https://nova-x-v2-backend.onrender.com/chat";

function showTab(tabName) {
  document.querySelectorAll(".panel-section").forEach(panel => panel.style.display = "none");
  document.querySelectorAll(".tab-button").forEach(button => button.classList.remove("active"));
  document.getElementById(tabName).style.display = "block";
  document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");
  const waveform = document.getElementById("waveform");

  const attachmentButton = document.getElementById("attachment-button");
  const fileSelectModal = document.getElementById("file-select-modal");
  const selectPDF = document.getElementById("select-pdf");
  const selectImage = document.getElementById("select-image");

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";

  micButton.addEventListener("click", () => {
    recognition.start();
    waveform.classList.remove("hidden");
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    sendMessage();
    waveform.classList.add("hidden");
  };

  recognition.onerror = () => waveform.classList.add("hidden");
  recognition.onspeechend = () => waveform.classList.add("hidden");

  sendButton.addEventListener("click", () => sendMessage());
  userInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage("You", message);
    userInput.value = "";

    const loader = document.createElement("div");
    loader.classList.add("typing-indicator");
    loader.innerHTML = "<span></span><span></span><span></span>";
    chatBox.appendChild(loader);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const res = await fetch(backendURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      chatBox.removeChild(loader);
      addMessage("Nova X", data.response);
    } catch {
      chatBox.removeChild(loader);
      addMessage("Nova X", "⚠️ Error connecting to backend.");
    }
  }

  function addMessage(sender, text) {
    const div = document.createElement("div");
    div.className = sender === "You" ? "user-message" : "ai-message";
    div.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // 📎 Attachment Toggle
  attachmentButton.addEventListener("click", (e) => {
    e.stopPropagation();
    fileSelectModal.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!attachmentButton.contains(e.target)) {
      fileSelectModal.classList.add("hidden");
    }
  });

  selectPDF.addEventListener("click", () => {
    fileSelectModal.classList.add("hidden");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      addMessage("Nova X", "📄 Processing PDF...");
      const formData = new FormData();
      formData.append("pdf", file);
      try {
        const res = await fetch("https://nova-x-v2-backend.onrender.com/pdf", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        const prompt = `Summarize this PDF:\n\n${data.text}`;
        const chatRes = await fetch(backendURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt })
        });
        const chatData = await chatRes.json();
        addMessage("Nova X", chatData.response);
      } catch {
        addMessage("Nova X", "❌ Error processing PDF.");
      }
    };
    input.click();
  });

  selectImage.addEventListener("click", () => {
    fileSelectModal.classList.add("hidden");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      addMessage("Nova X", "🧠 Extracting text from image...");
      try {
        const { data: { text } } = await Tesseract.recognize(file, "eng");
        const prompt = `Summarize this image:\n\n${text}`;
        const chatRes = await fetch(backendURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt })
        });
        const chatData = await chatRes.json();
        addMessage("Nova X", chatData.response);
      } catch {
        addMessage("Nova X", "❌ OCR failed.");
      }
    };
    input.click();
  });

  // 📋 Help & Tasks
  document.getElementById("help-button").addEventListener("click", () => {
    document.getElementById("help-panel").classList.toggle("hidden");
  });

  document.getElementById("todo-panel-toggle").addEventListener("click", () => {
    document.getElementById("assistant-panel").classList.toggle("hidden");
  });

  document.getElementById("close-assistant").addEventListener("click", () => {
    document.getElementById("assistant-panel").classList.add("hidden");
  });

  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
      showTab(button.dataset.tab);
    });
  });

  document.getElementById("add-task").addEventListener("click", () => {
    const input = document.getElementById("task-input");
    if (!input.value.trim()) return;
    const li = document.createElement("li");
    li.innerHTML = `<input type="checkbox"><span>${input.value}</span><button>🗑️</button>`;
    li.querySelector("button").onclick = () => li.remove();
    document.getElementById("task-list").appendChild(li);
    input.value = "";
  });

  document.getElementById("add-reminder").addEventListener("click", () => {
    const input = document.getElementById("reminder-input");
    if (!input.value.trim()) return;
    const li = document.createElement("li");
    li.textContent = input.value;
    document.getElementById("reminder-list").appendChild(li);
    input.value = "";
  });
});
