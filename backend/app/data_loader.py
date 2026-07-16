import json
from pathlib import Path


def load_guidelines() -> list[dict]:
    path = Path(__file__).resolve().parent.parent.parent / "data" / "guidelines.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)
