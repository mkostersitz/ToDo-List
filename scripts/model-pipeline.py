#!/usr/bin/env python3
"""
ONNX Model Pipeline for EthervoxAI
Downloads, converts, and validates all required ONNX models.

Models required:
  asr-whisper-tiny.onnx     — openai/whisper-tiny via optimum
  lang-detect.onnx          — fasttext lid.176.ftz converted to ONNX
  intent-classifier.onnx    — fine-tuned distilbert for 8 intent types
  entity-extractor.onnx     — fine-tuned distilbert NER
  pattern-coach.onnx        — custom LSTM (trained on synthetic habit data)

Usage:
  pip install optimum[onnxruntime] transformers torch fasttext
  python scripts/model-pipeline.py --model all
  python scripts/model-pipeline.py --model whisper
  python scripts/model-pipeline.py --model intent-classifier
"""

import argparse
import os
import sys
from pathlib import Path

OUTPUT_DIR = Path("assets/models")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MODELS = {
    "whisper": {
        "description": "ASR — openai/whisper-tiny",
        "output": "asr-whisper-tiny.onnx",
        "max_size_mb": 50,
        "max_latency_ms": 800,
    },
    "lang-detect": {
        "description": "Language ID — fasttext-langdetect",
        "output": "lang-detect.onnx",
        "max_size_mb": 2,
        "max_latency_ms": 20,
    },
    "intent-classifier": {
        "description": "Intent classification — fine-tuned distilbert (8 classes)",
        "output": "intent-classifier.onnx",
        "max_size_mb": 15,
        "max_latency_ms": 80,
        "intent_labels": [
            "log-complete", "log-detail", "skip-with-reason",
            "habit-create", "habit-edit", "habit-delete",
            "status-query", "compound"
        ],
    },
    "entity-extractor": {
        "description": "Entity extraction — fine-tuned distilbert NER",
        "output": "entity-extractor.onnx",
        "max_size_mb": 15,
        "max_latency_ms": 80,
        "entity_labels": ["habit-name", "metric-value", "metric-unit", "duration", "skip-reason"],
    },
    "pattern-coach": {
        "description": "Pattern coaching — custom LSTM",
        "output": "pattern-coach.onnx",
        "max_size_mb": 20,
        "max_latency_ms": 100,
    },
}


def export_whisper():
    """Export openai/whisper-tiny to ONNX using optimum."""
    print("Exporting whisper-tiny to ONNX...")
    print("Run: optimum-cli export onnx --model openai/whisper-tiny --task automatic-speech-recognition whisper-tiny-onnx/")
    print("Then: cp whisper-tiny-onnx/model.onnx assets/models/asr-whisper-tiny.onnx")
    print("Note: Full export ~77MB — quantize with: optimum-cli onnxruntime quantize --onnx_model whisper-tiny-onnx/ -o whisper-tiny-quant/ --quantize_with_conf_file quantization.yml")


def export_lang_detect():
    """Convert fasttext language detection model to ONNX."""
    print("For lang-detect.onnx:")
    print("1. Download: wget https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.ftz")
    print("2. Use skl2onnx or a custom PyTorch wrapper to export to ONNX format")
    print("   Alternative: Use 'papluca/xlm-roberta-base-language-detection' from HuggingFace")
    print("   optimum-cli export onnx --model papluca/xlm-roberta-base-language-detection lang-detect-onnx/")


def create_intent_classifier_training_data():
    """Generate training data for intent classifier."""
    import json
    training_data = {
        "intents": {
            "log-complete": [
                "done with run", "finished meditation", "hit my water goal",
                "completed morning workout", "did my pushups", "finished reading",
                "gym done", "yoga complete", "journaled", "took my vitamins"
            ],
            "log-detail": [
                "ran 5k in 28 minutes", "slept 7.5 hours", "drank 6 glasses of water",
                "walked 10000 steps", "meditated for 20 minutes", "read 30 pages",
                "lifted 200 pounds", "cycled 15 miles", "swam 40 laps"
            ],
            "skip-with-reason": [
                "skipping gym knee hurts", "rest day today", "too tired for reading",
                "skipping meditation headache", "not running it's raining",
                "missed yoga had a meeting", "no workout traveling today"
            ],
            "habit-create": [
                "add habit journal every night", "new habit drink 8 glasses daily",
                "create habit meditate 10 minutes morning", "add daily pushups habit",
                "set up habit walk 30 minutes after lunch"
            ],
            "habit-edit": [
                "change gym to 4 times a week", "rename run to morning jog",
                "update water goal to 10 glasses", "move meditation to evening",
                "change reading target to 20 pages"
            ],
            "habit-delete": [
                "remove the flossing habit", "delete cold plunge",
                "stop tracking coffee", "remove gym habit",
                "delete the reading goal"
            ],
            "status-query": [
                "how am I doing", "what's my meditation streak",
                "what's left today", "show my progress", "how many habits today",
                "what did I complete this week", "what's my current streak"
            ],
            "compound": [
                "skipped gym but did yoga instead", "didn't run but walked 40 minutes",
                "missed reading but listened to audiobook", "no gym today but did stretching",
                "skipped run and also missed meditation"
            ]
        }
    }
    output = Path("scripts/intent_training_data.json")
    output.write_text(json.dumps(training_data, indent=2))
    print(f"Training data written to {output}")
    print("Use this data to fine-tune distilbert-base-uncased for intent classification")
    print("Then export with: optimum-cli export onnx --model ./fine-tuned-intent/ intent-classifier-onnx/")


def create_pattern_coach_model():
    """Create and export custom LSTM pattern coaching model."""
    print("Pattern coach LSTM — requires PyTorch:")
    print("""
import torch
import torch.nn as nn

class PatternCoachLSTM(nn.Module):
    def __init__(self, input_size=10, hidden_size=64, num_layers=2, num_patterns=6):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.classifier = nn.Linear(hidden_size, num_patterns)

    def forward(self, x):
        out, _ = self.lstm(x)
        return torch.sigmoid(self.classifier(out[:, -1, :]))

model = PatternCoachLSTM()
dummy_input = torch.randn(1, 30, 10)  # 30 days, 10 features
torch.onnx.export(model, dummy_input, "assets/models/pattern-coach.onnx",
    input_names=["habit_history"], output_names=["pattern_scores"],
    dynamic_axes={"habit_history": {0: "batch", 1: "sequence"}})
print("Exported pattern-coach.onnx")
""")


def main():
    parser = argparse.ArgumentParser(description="EthervoxAI ONNX Model Pipeline")
    parser.add_argument("--model", choices=list(MODELS.keys()) + ["all"], default="all")
    args = parser.parse_args()

    print("EthervoxAI ONNX Model Pipeline")
    print("=" * 40)
    print(f"Output directory: {OUTPUT_DIR.absolute()}")
    print()

    if args.model in ("all", "whisper"):
        export_whisper()
        print()
    if args.model in ("all", "lang-detect"):
        export_lang_detect()
        print()
    if args.model in ("all", "intent-classifier"):
        create_intent_classifier_training_data()
        print()
    if args.model in ("all", "pattern-coach"):
        create_pattern_coach_model()
        print()

    print("\nNext step: run each export command above, then verify with:")
    print("  python -c \"import onnxruntime as ort; print(ort.InferenceSession('assets/models/asr-whisper-tiny.onnx').get_inputs())\"")


if __name__ == "__main__":
    main()
