import json
from typing import Any, Dict, List

from django.core.management.base import BaseCommand

from apps.characters.models import Character


class Command(BaseCommand):
    help = (
        "Normalize malformed character equipment payloads (including stringified "
        "JSON/Python-list blobs) into proper item arrays."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Persist normalized equipment back to the database.",
        )

    def handle(self, *args, **options):
        apply_changes = bool(options.get("apply"))
        scanned = 0
        changed = 0

        for character in Character.objects.all().only("id", "name", "equipment"):
            scanned += 1
            original = character.equipment
            normalized = self._normalize_equipment(original)

            if not self._equivalent(original, normalized):
                changed += 1
                self.stdout.write(
                    f"Character #{character.id} ({character.name}): equipment normalized"
                )

                if apply_changes:
                    character.equipment = normalized
                    character.save(update_fields=["equipment"])

        if changed == 0:
            self.stdout.write(self.style.SUCCESS("No malformed equipment payloads found."))
            return

        if apply_changes:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Normalized equipment for {changed} of {scanned} character(s)."
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"Dry run: {changed} of {scanned} character(s) would be updated. "
                    "Re-run with --apply to persist changes."
                )
            )

    def _equivalent(self, left: Any, right: Any) -> bool:
        try:
            return json.dumps(left, sort_keys=True) == json.dumps(right, sort_keys=True)
        except Exception:
            return left == right

    def _coerce_int(self, value: Any, default: int = 1) -> int:
        try:
            number = int(value)
            return number if number > 0 else default
        except (TypeError, ValueError):
            return default

    def _parse_string_payload(self, raw: str) -> Any:
        trimmed = raw.strip()
        if not trimmed:
            return []

        if (trimmed.startswith("[") and trimmed.endswith("]")) or (
            trimmed.startswith("{") and trimmed.endswith("}")
        ):
            try:
                return json.loads(trimmed)
            except Exception:
                try:
                    normalized = (
                        trimmed.replace("None", "null")
                        .replace("True", "true")
                        .replace("False", "false")
                        .replace("'", '"')
                    )
                    return json.loads(normalized)
                except Exception:
                    pass

        return trimmed

    def _normalize_item_dict(self, item: Dict[str, Any]) -> List[Dict[str, Any]]:
        if isinstance(item.get("items"), list):
            return self._normalize_equipment(item.get("items"))

        if item.get("name"):
            normalized = dict(item)
            normalized["name"] = str(normalized.get("name", "")).strip()
            normalized["quantity"] = self._coerce_int(normalized.get("quantity", 1))
            if not normalized["name"]:
                return []
            return [normalized]

        results: List[Dict[str, Any]] = []
        for key, value in item.items():
            if isinstance(value, dict) and value.get("name"):
                nested = dict(value)
                nested["name"] = str(nested.get("name", "")).strip()
                nested["quantity"] = self._coerce_int(nested.get("quantity", 1))
                if nested["name"]:
                    results.append(nested)
                continue

            name = str(key).strip()
            if not name:
                continue
            results.append(
                {
                    "name": name,
                    "quantity": self._coerce_int(value if isinstance(value, int) else 1),
                }
            )

        return results

    def _normalize_equipment(self, equipment: Any) -> List[Dict[str, Any]]:
        if equipment is None:
            return []

        if isinstance(equipment, str):
            parsed = self._parse_string_payload(equipment)
            if isinstance(parsed, str):
                text = parsed.strip()
                return [{"name": text, "quantity": 1}] if text else []
            return self._normalize_equipment(parsed)

        if isinstance(equipment, dict):
            return self._normalize_item_dict(equipment)

        if isinstance(equipment, list):
            normalized_items: List[Dict[str, Any]] = []
            for entry in equipment:
                normalized_items.extend(self._normalize_equipment(entry))

            # De-duplicate by name and merge quantities for a cleaner inventory.
            merged: Dict[str, Dict[str, Any]] = {}
            ordered_names: List[str] = []
            for item in normalized_items:
                name = str(item.get("name", "")).strip()
                if not name:
                    continue

                key = name.lower()
                if key not in merged:
                    ordered_names.append(key)
                    merged[key] = dict(item)
                    merged[key]["name"] = name
                    merged[key]["quantity"] = self._coerce_int(item.get("quantity", 1))
                else:
                    merged[key]["quantity"] = (
                        self._coerce_int(merged[key].get("quantity", 1))
                        + self._coerce_int(item.get("quantity", 1))
                    )

            return [merged[key] for key in ordered_names]

        return []
