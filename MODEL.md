# Model

EdSparkAI uses **Gemma 4 E2B** in the `.litertlm` format, running fully on-device via MediaPipe LiteRT.

## Source

| | |
|---|---|
| **Model** | Gemma 4 E2B Instruct — LiteRT-LM |
| **HuggingFace repo** | [litert-community/gemma-4-E2B-it-litert-lm](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm) |
| **Format** | `.litertlm` (INT4 quantized) |
| **Size** | ~1.4 GB |
| **Runtime** | MediaPipe LiteRT `0.10.14`, CPU backend |

## Why this model

- INT4 quantization fits in ~1.4 GB RAM — works on 4 GB Android devices
- `.litertlm` is the only stable Gemma 4 format for Android CPU inference as of MediaPipe LiteRT 0.10.14
- GPU backend requires Vulkan + dedicated VRAM; CPU backend runs universally

## Device requirements

- Android 8.0+ (API 26+)
- 4 GB RAM minimum
- 3 GB free storage

## License

Gemma is a trademark of Google LLC. This project uses Gemma 4 E2B under the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
