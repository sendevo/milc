import json
import sys

if len(sys.argv) != 2:
    print(f"Usage: {sys.argv[0]} <json-file>")
    sys.exit(1)

filename = sys.argv[1]

with open(filename, "r", encoding="utf-8") as f:
    data = json.load(f)

keys = [key for key in data.keys() if key != "timestamp"]

print(", ".join(keys))