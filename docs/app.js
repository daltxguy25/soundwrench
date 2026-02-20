const recordButton = document.getElementById("recordButton");
const stopButton = document.getElementById("stopButton");
const analyzeButton = document.getElementById("analyzeButton");
const audioInput = document.getElementById("audioInput");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const audioPreview = document.getElementById("audioPreview");
const recordStatus = document.getElementById("recordStatus");
const analyzeStatus = document.getElementById("analyzeStatus");
const resultsCard = document.getElementById("resultsCard");

let mediaRecorder;
let audioChunks = [];
let activeAudioBlob;

recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
audioInput.addEventListener("change", handleAudioUpload);
photoInput.addEventListener("change", handlePhotoUpload);
analyzeButton.addEventListener("click", analyzeAudio);

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });

    mediaRecorder.addEventListener("stop", () => {
      activeAudioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      audioPreview.src = URL.createObjectURL(activeAudioBlob);
      recordStatus.textContent = "Recording captured.";
      stream.getTracks().forEach((track) => track.stop());
    });

    mediaRecorder.start();
    recordButton.disabled = true;
    stopButton.disabled = false;
    recordStatus.textContent = "Recording...";
  } catch {
    recordStatus.textContent = "Microphone access failed. Try file upload instead.";
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    recordButton.disabled = false;
    stopButton.disabled = true;
  }
}

function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  activeAudioBlob = file;
  audioPreview.src = URL.createObjectURL(file);
  analyzeStatus.textContent = `Loaded audio: ${file.name}`;
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    photoPreview.hidden = true;
    return;
  }

  photoPreview.src = URL.createObjectURL(file);
  photoPreview.hidden = false;
}

async function analyzeAudio() {
  if (!activeAudioBlob) {
    analyzeStatus.textContent = "Upload or record audio first.";
    return;
  }

  analyzeStatus.textContent = "Analyzing...";

  try {
    const features = await extractFeatures(activeAudioBlob);
    const diagnosis = classify(features);
    renderResults(diagnosis, features);
    analyzeStatus.textContent = "Analysis complete.";
    saveHistory({
      timestamp: new Date().toISOString(),
      diagnosis,
      features,
    });
  } catch {
    analyzeStatus.textContent = "Could not read this audio file. Try another format.";
  }
}

async function extractFeatures(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const data = audioBuffer.getChannelData(0);

  const rms = Math.sqrt(data.reduce((sum, sample) => sum + sample * sample, 0) / data.length);

  let zcrCount = 0;
  for (let i = 1; i < data.length; i += 1) {
    if ((data[i - 1] >= 0 && data[i] < 0) || (data[i - 1] < 0 && data[i] >= 0)) {
      zcrCount += 1;
    }
  }

  const zcr = zcrCount / data.length;
  const duration = audioBuffer.duration;
  await audioContext.close();

  return { rms, zcr, duration };
}

function classify({ rms, zcr, duration }) {
  if (duration < 1.5) {
    return {
      urgency: "Need More Audio",
      issue: "Recording too short",
      confidence: 0.25,
      reason: "Low sample length reduces pattern reliability.",
      nextStep: "Record 5-10 seconds near the sound source while parked.",
    };
  }

  if (rms > 0.22 && zcr > 0.11) {
    return {
      urgency: "Soon",
      issue: "Possible belt squeal or high-pitch friction",
      confidence: 0.67,
      reason: "High overall energy with rapid zero-crossing can indicate squeal-like noise.",
      nextStep: "Inspect serpentine belt condition and tension. Seek mechanic confirmation.",
    };
  }

  if (rms > 0.16 && zcr < 0.06) {
    return {
      urgency: "Urgent",
      issue: "Possible knock or low-frequency rattle",
      confidence: 0.64,
      reason: "Strong energy with lower crossing rate can indicate lower-frequency mechanical events.",
      nextStep: "Avoid hard driving. Get a professional inspection as soon as possible.",
    };
  }

  return {
    urgency: "Monitor",
    issue: "No dominant critical pattern detected",
    confidence: 0.52,
    reason: "Feature levels are moderate and not strongly matched to severe heuristics.",
    nextStep: "Re-test in a quieter environment and compare under idle vs light rev.",
  };
}

function renderResults(diagnosis, features) {
  document.getElementById("urgency").textContent = diagnosis.urgency;
  document.getElementById("issue").textContent = diagnosis.issue;
  document.getElementById("confidence").textContent = `${Math.round(diagnosis.confidence * 100)}%`;
  document.getElementById("reason").textContent = `${diagnosis.reason} (rms=${features.rms.toFixed(3)}, zcr=${features.zcr.toFixed(3)}, duration=${features.duration.toFixed(1)}s)`;
  document.getElementById("nextStep").textContent = diagnosis.nextStep;
  resultsCard.hidden = false;
}

function saveHistory(entry) {
  const key = "soundwrench_history";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.unshift(entry);
  const trimmed = existing.slice(0, 20);
  localStorage.setItem(key, JSON.stringify(trimmed));
}