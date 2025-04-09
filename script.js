document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");
  const waveform = document.getElementById("waveform");
  const helpButton = document.getElementById("help-button");
  const helpPanel = document.getElementById("help-panel");
  const attachmentButton = document.getElementById("attachment-button");
  const fileInput = document.getElementById("file-input");
  const fileSelectModal = document.getElementById("file-select-modal");

  const backendBase = "https://nova-x-v2-backend.onrender.com";

  // Send user message
  const sendMessage = async () => {
    const message = userInput.value.trim();
    if (!message) return;
    addMessage("You", message, "user-message");
    userInput.value = "";

    addMessage("Nova X", "🧠 Thinking...");

    try {
      const res = await fetch(`${backendBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();
      updateLastMessage(`🧠 ${data.response || "No response."}`);
    } catch (err) {
      console.error(err);
      updateLastMessage("❌ Error processing your request.");
    }
  };

  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  // Add message to chat
  function addMessage(sender, text, className = "ai-message") {
    const msg = document.createElement("div");
    msg.classList.add("message", className);
    msg.innerHTML = `<strong>${sender}:</strong> ${text.replace(/\n/g, "<br>")}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function updateLastMessage(text) {
    const messages = chatBox.querySelectorAll(".message");
    const last = messages[messages.length - 1];
    if (last) last.innerHTML = `<strong>Nova X:</strong> ${text.replace(/\n/g, "<br>")}`;
  }

  // Voice input
  let recognition;
  micButton.addEventListener("click", () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported.");
      return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    waveform.classList.remove("hidden");

    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      waveform.classList.add("hidden");
      sendMessage();
    };

    recognition.onerror = () => {
      waveform.classList.add("hidden");
    };
  });

  // Help toggle
  helpButton.addEventListener("click", () => {
    helpPanel.classList.toggle("hidden");
  });

  // File upload modal
  attachmentButton.addEventListener("click", () => {
    fileSelectModal.classList.remove("hidden");
  });

  document.getElementById("select-pdf").addEventListener("click", () => {
    fileInput.setAttribute("accept", ".pdf");
    fileSelectModal.classList.add("hidden");
    fileInput.click();
  });

  document.getElementById("select-image").addEventListener("click", () => {
    fileInput.setAttribute("accept", "image/*");
    fileSelectModal.classList.add("hidden");
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const fileType = file.type;

    if (fileType === "application/pdf") {
      addMessage("Nova X", "📄 Uploading PDF for analysis...");
      const formData = new FormData();
      formData.append("pdf", file);

      try {
        const res = await fetch(`${backendBase}/pdf`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        addMessage("Nova X", `📑 PDF Summary:\n\n${data.summary || "No summary returned."}`);
      } catch (err) {
        console.error(err);
        addMessage("Nova X", "❌ Error analyzing PDF.");
      }

    } else if (fileType.startsWith("image/")) {
      addMessage("Nova X", "🖼️ Extracting text from image...");

      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result;

        try {
          const { data: { text } } = await Tesseract.recognize(imageData, 'eng');

          if (!text.trim()) {
            addMessage("Nova X", "❌ No text found in the image.");
            return;
          }

          addMessage("Nova X", `🔍 Extracted Text:\n\n${text.trim()}`);

          // Summarize the extracted text
          addMessage("Nova X", "🧠 Summarizing extracted text...");
          const summaryRes = await fetch(`${backendBase}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `Summarize this:\n\n${text.trim()}` })
          });

          const summaryData = await summaryRes.json();
          addMessage("Nova X", `📝 Summary:\n\n${summaryData.response || "No summary returned."}`);
        } catch (err) {
          console.error(err);
          addMessage("Nova X", "❌ Error analyzing the image.");
        }
      };
      reader.readAsDataURL(file);
    } else {
      addMessage("Nova X", "⚠️ Unsupported file type.");
    }

    fileInput.value = '';
  });

  // Assistant panel tabs (Tasks & Reminders)
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabSections = document.querySelectorAll(".panel-section");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabSections.forEach(sec => sec.classList.add("hidden"));

      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.remove("hidden");
    });
  });

  // Tasks
  document.getElementById("add-task").addEventListener("click", () => {
    const input = document.getElementById("task-input");
    const text = input.value.trim();
    if (!text) return;

    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const span = document.createElement("span");
    span.textContent = text;
    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.addEventListener("click", () => li.remove());

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(del);
    document.getElementById("task-list").appendChild(li);
    input.value = "";
  });

  // Reminders
  document.getElementById("add-reminder").addEventListener("click", () => {
    const input = document.getElementById("reminder-input");
    const text = input.value.trim();
    if (!text) return;

    const match = text.match(/(.+)\s+at\s+(\d{1,2}:\d{2})/i);
    if (!match) {
      alert("Use format: Do something at HH:MM");
      return;
    }

    const [_, task, time] = match;
    const li = document.createElement("li");
    li.textContent = `${task} at ${time}`;
    document.getElementById("reminder-list").appendChild(li);

    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const remindTime = new Date();
    remindTime.setHours(hours, minutes, 0, 0);

    let delay = remindTime - now;
    if (delay < 0) delay += 86400000;

    setTimeout(() => {
      alert(`⏰ Reminder: ${task}`);
    }, delay);

    input.value = "";
  });

  // Toggle assistant panel
  document.getElementById("close-assistant").addEventListener("click", () => {
    document.getElementById("assistant-panel").classList.toggle("hidden");
  });

  // Optional: Open assistant panel automatically
  // document.getElementById("assistant-panel").classList.remove("hidden");
});
