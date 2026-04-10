"""Update the version in manifest.json."""

import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Update manifest.json version")
    parser.add_argument("--version", required=True, help="Version to set (e.g. 1.2.3)")
    args = parser.parse_args()

    version = args.version.lstrip("v")

    manifest_path = (
        Path(__file__).resolve().parents[2] / "custom_components" / "aptus" / "manifest.json"
    )
    manifest = json.loads(manifest_path.read_text())
    manifest["version"] = version
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")

    print(f"Updated manifest.json version to {version}")


if __name__ == "__main__":
    main()
