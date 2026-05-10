# EdSparkAI — Offline AI Tutor for Every Student

**Igniting learning, even offline.**

EdSparkAI is a fully offline Android app that lets students scan any printed textbook page and instantly get a bilingual explanation, key points, a real-life example, and a quiz — all powered by Gemma 4 E2B running entirely on the device. No internet. No server. No account.

---

## What It Does

1. **Scan** — Point the camera at any textbook page. ML Kit OCR extracts printed text (English + Hindi/Devanagari) offline.
2. **Explain** — Gemma 4 E2B generates a structured bilingual explanation (English + chosen Indian language) at three difficulty levels: Simple, Grade Level, Advanced.
3. **Quiz** — Auto-generated questions test comprehension.
4. **Read Aloud** — Android TTS reads explanations in English and the student's native language.
5. **Ask Doubts** — Conversational AI chat grounded on the scanned page content.
6. **Teacher Pack** — Generates lesson objectives, blackboard summary, worksheet, homework, and differentiated versions for slow learners and advanced students.

Supports 12 Indian languages: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, Punjabi, Urdu, English.

---

## How We Run a 2B Model on Budget Android Phones

This was the core engineering challenge. Most on-device LLM demos require flagship phones with dedicated NPUs. We needed it to work on mid-range Android devices (4 GB RAM, CPU-only).

### The Stack

| Layer | Technology | Why |
|---|---|---|
| Inference | MediaPipe LiteRT `0.10.14` | Only stable Gemma 4 runtime on Android CPU |
| Model | Gemma 4 E2B INT4 quantized (`.litertlm`) | ~1.4 GB vs ~4 GB FP16 — fits on 4 GB RAM devices |
| Backend | `Backend.CPU()` | GPU backend requires Vulkan + VRAM; CPU works universally |
| OCR | ML Kit Text Recognition v2 (Latin + Devanagari) | Fully offline, <50 MB |
| TTS | Android TextToSpeech API | Zero overhead, built into OS |
| Database | Room + SQLite | RAG context retrieval, no external dependencies |

### Key Optimizations

**INT4 Quantization** — The `.litertlm` model format packs weights into 4-bit integers. This cuts memory by 4× versus FP16 with minimal accuracy loss on instruction-following tasks. The model loads into ~1.4 GB RAM, leaving headroom for the OS and UI on a 4 GB device.

**Prompt Engineering for Small Models** — 2B parameter models are extremely sensitive to prompt structure. We use a strict system prompt (`"Start with { end with }"`) and a schema-first user prompt so the model fills in a JSON template rather than generating free-form text. This dramatically reduces hallucination and formatting failures on a constrained model.

**Token Budget** — Capped at 2048 tokens (`maxNumTokens`). OCR input truncated to 350 characters. Keeps inference time under 30 seconds on CPU even on lower-end hardware.

**Wake Lock** — Holds `PARTIAL_WAKE_LOCK` during inference to prevent CPU throttling mid-generation on battery-saving devices.

**Parallel Model Download** — 6 concurrent HTTP range requests (`Range: bytes=start-end`) download the 1.4 GB model ~6× faster than a single stream. Uses `RandomAccessFile.seek()` to write each chunk directly at its correct file offset — no merge step required.

### Problems We Solved

**LiteRT Java compatibility** — `com.google.ai.edge.litertlm:0.10.22+` compiles against Java 21 class files but Android builds use Java 17 (`jvmTarget = "17"`). This causes `UnsupportedClassVersionError` at runtime. Fix: pin to `0.10.14`.

**React Native dependency conflicts** — `react-native-screens 4.x` has a codegen schema bug. `<3.34` has a `StateWrapper` crash. Working range: `3.34.x – 3.37.x`. `react-native-reanimated 4.x` requires RN 0.77+. `mediapipe 0.10.22+` breaks Java 17 builds.

**LLM output is not always valid JSON** — Even with explicit instructions, the model occasionally outputs markdown fences (` ```json `) or truncates mid-object due to token limits. We handle this with:
- Strip ` ```json ``` ` fences
- Find first `{` and last `}`
- Repair truncated JSON: count unbalanced `{[` → append `]}`
- Close unclosed string literals if `"` count is odd

**Bilingual TTS race conditions** — Android TTS `speak()` is async. Queueing both languages caused race conditions with the stop button. Fix: `await` each utterance sequentially.

**OCR path handling** — `BitmapFactory.decodeFile()` requires a plain filesystem path. The React Native `file://` URI prefix must be stripped before passing to native Kotlin. Crop output from `cacheDir` uses the same plain-path convention.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native UI                       │
│  HomeScreen → ScanScreen → ExplainScreen → QuizScreen   │
│  ChatScreen · TeacherScreen · OnboardingScreen          │
└──────────────┬──────────────────────────────────────────┘
               │ NativeModules bridge (JSI-free, legacy arch)
┌──────────────▼──────────────────────────────────────────┐
│                  Kotlin Native Modules                   │
│  AiRuntimeModule    — MediaPipe LiteRT inference         │
│  VisionModule       — ML Kit OCR + ratio-based crop      │
│  SpeechModule       — Android TTS (sequential bilingual) │
│  SchoolPackModule   — Room DB (curriculum RAG)           │
│  ModelDownloadModule — 6-stream parallel OkHttp download │
└──────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│               On-Device AI  (zero network calls)         │
│  Gemma 4 E2B INT4  ·  ML Kit OCR  ·  Android TTS        │
└─────────────────────────────────────────────────────────┘
```

---

## Setup

### Prerequisites
- Android device: API 26+ (Android 8.0+), 4 GB RAM minimum, 3 GB free storage
- Development: JDK 17, Node.js 18+, Android SDK (compileSdk 36)

### Install

```bash
git clone https://github.com/Destroyer1543/EdSparkAI.git
cd EdSparkAI
npm install
```

### Model

The Gemma 4 E2B INT4 model (~1.4 GB) is downloaded separately. Launch the app — the download screen handles it automatically with a 6-stream parallel downloader.

To push manually:
```bash
adb push model.litertlm /data/local/tmp/gemma4/model.litertlm
```

### Run

```bash
# Terminal 1
npx react-native start --reset-cache

# Terminal 2
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
```

---

## Tech Stack

| | |
|---|---|
| **UI** | React Native 0.76.7, React Navigation 7, Zustand 5 |
| **AI Inference** | MediaPipe LiteRT 0.10.14 (Gemma 4 E2B, CPU backend) |
| **OCR** | ML Kit Text Recognition v2 (Latin + Devanagari, offline) |
| **TTS** | Android TextToSpeech (12 Indian language locales) |
| **Storage** | Room 2.6.1 + SQLite (RAG), AsyncStorage (user prefs) |
| **Networking** | OkHttp (parallel model download only) |
| **Language** | TypeScript (UI) + Kotlin (native modules) |
| **Min SDK** | 26 (Android 8.0) |

---

## License

Apache 2.0

Gemma is a trademark of Google LLC. This project uses Gemma 4 E2B under the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
