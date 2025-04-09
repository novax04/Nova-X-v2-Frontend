
const backendURL = "https://nova-x-v2-backend.onrender.com/chat";

document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");
  const waveform = document.getElementById("waveform");
  const helpButton = document.getElementById("help-button");
  const helpPanel = document.getElementById("help-panel");

  const taskInput = document.getElementById("task-input");
  const addTaskButton = document.getElementById("add-task");
  const taskList = document.getElementById("task-list");

  const reminderInput = document.getElementById("reminder-input");
  const addReminderButton = document.getElementById("add-reminder");
  const reminderList = document.getElementById("reminder-list");

  const todoPanelToggle = document.getElementById("todo-panel-toggle");
  const assistantPanel = document.getElementById("assistant-panel");
  const closeAssistant = document.getElementById("close-assistant");

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabSections = document.querySelectorAll(".panel-section");

  const pdfUpload = document.getElementById("pdf-upload");
  const imageUpload = document.getElementById("image-upload");
  const fileSelectModal = document.getElementById("file-select-modal");
  const selectPdf = document.getElementById("select-pdf");
  const selectImage = document.getElementById("select-image");
  const attachmentButton = document.getElementById("attachment-button");

  // Core Chat
  async function sendMessage(message) {
    if (!message.trim()) return;
    addMessage("You", message);
    userInput.value = "";

    try {
      const res = await fetch(backendURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      addMessage("Nova X", data.response);
    } catch (err) {
      addMessage("Nova X", "⚠️ Error: Unable to reach server.");
    }
  }

  function addMessage(sender, text) {
    const messageEl = document.createElement("div");
    messageEl.className = sender === "You" ? "user-message" : "ai-message";
    messageEl.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  sendButton.addEventListener("click", () => sendMessage(userInput.value));
  userInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage(userInput.value);
  });

  // Voice Input
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.continuous = false;

  micButton.addEventListener("click", () => {
    recognition.start();
    waveform.classList.remove("hidden");
  });

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    sendMessage(transcript);
    waveform.classList.add("hidden");
  };

  recognition.onerror = () => waveform.classList.add("hidden");
  recognition.onend = () => waveform.classList.add("hidden");

  // Help Panel Toggle
  helpButton.addEventListener("click", () => {
    helpPanel.classList.toggle("hidden");
  });

  // Tasks
  function addTask(taskText) {
    if (!taskText.trim()) return;
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" />
      <span>${taskText}</span>
      <button class="delete-task">❌</button>
    `;
    taskList.appendChild(li);

    li.querySelector(".delete-task").addEventListener("click", () => li.remove());
  }

  addTaskButton.addEventListener("click", () => addTask(taskInput.value));
  taskInput.addEventListener("keydown", e => {
    if (e.key === "Enter") addTask(taskInput.value);
  });

  // Reminders
  function addReminder(reminderText) {
    if (!reminderText.trim()) return;
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${reminderText}</span>
      <button class="delete-task">❌</button>
    `;
    reminderList.appendChild(li);

    li.querySelector(".delete-task").addEventListener("click", () => li.remove());

    const timeMatch = reminderText.match(/at\s(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]) || 0;
      const period = timeMatch[3]?.toLowerCase();

      if (period === "pm" && hour < 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;

      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hour, minute, 0, 0);

      const delay = reminderTime - now;
      if (delay > 0) {
        setTimeout(() => alert(`⏰ Reminder: ${reminderText}`), delay);
      }
    }
  }

  addReminderButton.addEventListener("click", () => addReminder(reminderInput.value));
  reminderInput.addEventListener("keydown", e => {
    if (e.key === "Enter") addReminder(reminderInput.value);
  });

  // Assistant Panel Toggle
  todoPanelToggle.addEventListener("click", () => {
    assistantPanel.classList.toggle("hidden");
  });

  closeAssistant.addEventListener("click", () => {
    assistantPanel.classList.add("hidden");
  });

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      const targetTab = button.getAttribute("data-tab");
      tabSections.forEach(section => {
        section.classList.toggle("hidden", section.id !== targetTab);
      });
    });
  });

  // File Upload Modal Handling
  attachmentButton.addEventListener("click", () => {
    fileSelectModal.classList.remove("hidden");
  });

  selectPdf.addEventListener("click", () => {
    fileSelectModal.classList.add("hidden");
    pdfUpload.click();
  });

  selectImage.addEventListener("click", () => {
    fileSelectModal.classList.add("hidden");
    imageUpload.click();
  });

  // PDF Upload
  pdfUpload.addEventListener("change", async function () {
    const file = this.files[0];
    if (!file || file.type !== "application/pdf") {
      addMessage("Nova X", "⚠️ Please upload a valid PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await fetch("https://nova-x-v2-backend.onrender.com/upload/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const summaryPrompt = `Summarize the contents of this PDF:\n\n${data.text}`;
      const summaryRes = await fetch(backendURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: summaryPrompt }),
      });

      const summaryData = await summaryRes.json();
      addMessage("Nova X", summaryData.response);
    } catch {
      addMessage("Nova X", "❌ Error processing the PDF.");
    }
  });

  // Image Upload with Tesseract
  imageUpload.addEventListener("change", async function () {
    const file = this.files[0];
    if (!file || !file.type.startsWith("image/")) {
      addMessage("Nova X", "⚠️ Please upload a valid image file.");
      return;
    }

    addMessage("Nova X", "🖼️ Processing image...");
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      const summaryPrompt = `Summarize this image content:\n\n${text}`;
      const chatRes = await fetch(backendURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: summaryPrompt }),
      });

      const chatData = await chatRes.json();
      addMessage("Nova X", chatData.response);
    } catch {
      addMessage("Nova X", "❌ Error processing the image.");
    }
  });
});
