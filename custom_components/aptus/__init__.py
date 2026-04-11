"""The Aptus integration."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ConfigEntryNotReady, HomeAssistantError
import voluptuous as vol

from .aptus_client import AptusClient, laundry
from .aptus_client.exceptions import AptusAuthError, AptusConnectionError
from .const import DOMAIN
from .coordinator import AptusDataUpdateCoordinator
from .websocket import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)

CARDS_DIR = Path(__file__).parent / "www"
CARDS = ["aptus-lock-card", "aptus-laundry-card"]

PLATFORMS: list[Platform] = [Platform.LOCK, Platform.CALENDAR, Platform.SENSOR]

type AptusConfigEntry = ConfigEntry[AptusDataUpdateCoordinator]


async def async_setup_entry(hass: HomeAssistant, entry: AptusConfigEntry) -> bool:
    """Set up Aptus from a config entry."""
    client = AptusClient(
        base_url=entry.data["base_url"],
        username=entry.data["username"],
        password=entry.data["password"],
    )

    try:
        await client.login()
    except (AptusConnectionError, AptusAuthError) as exc:
        await client.close()
        raise ConfigEntryNotReady(str(exc)) from exc

    coordinator = AptusDataUpdateCoordinator(hass, client, entry)
    await coordinator.async_config_entry_first_refresh()

    entry.runtime_data = coordinator

    async_register_websocket_commands(hass)
    await _register_frontend(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    _register_services(hass, coordinator)

    entry.async_on_unload(entry.add_update_listener(_async_options_updated))

    return True


async def _async_options_updated(hass: HomeAssistant, entry: AptusConfigEntry) -> None:
    """Reload the integration when options change."""
    await hass.config_entries.async_reload(entry.entry_id)


async def _register_frontend(hass: HomeAssistant) -> None:
    """Register Lovelace card JS resources with version cache-busting."""
    try:
        from homeassistant.components.http import StaticPathConfig

        manifest_path = Path(__file__).parent / "manifest.json"
        version = json.loads(manifest_path.read_text()).get("version", "0")

        static_paths = [
            StaticPathConfig(
                url_path=f"/{DOMAIN}/{card}.js",
                path=str(CARDS_DIR / f"{card}.js"),
                cache_headers=True,
            )
            for card in CARDS
        ]
        await hass.http.async_register_static_paths(static_paths)
        for card in CARDS:
            add_extra_js_url(hass, f"/{DOMAIN}/{card}.js?v={version}")
    except (AttributeError, KeyError, TypeError):
        _LOGGER.debug("Frontend not available, skipping card registration")


def _register_services(hass: HomeAssistant, coordinator: AptusDataUpdateCoordinator) -> None:
    """Register aptus.book_laundry and aptus.cancel_laundry services."""

    async def handle_book_laundry(call: ServiceCall) -> None:
        success = await laundry.book_slot(
            coordinator.client,
            pass_no=call.data["pass_no"],
            pass_date=call.data["pass_date"],
            group_id=call.data["group_id"],
        )
        if not success:
            raise HomeAssistantError("Failed to book laundry slot")
        await coordinator.async_request_refresh()

    async def handle_cancel_laundry(call: ServiceCall) -> None:
        success = await laundry.cancel_booking(
            coordinator.client,
            booking_id=call.data["booking_id"],
        )
        if not success:
            raise HomeAssistantError("Failed to cancel laundry booking")
        await coordinator.async_request_refresh()

    if not hass.services.has_service(DOMAIN, "book_laundry"):
        hass.services.async_register(
            DOMAIN,
            "book_laundry",
            handle_book_laundry,
            schema=vol.Schema(
                {
                    vol.Required("pass_no"): int,
                    vol.Required("pass_date"): str,
                    vol.Required("group_id"): str,
                }
            ),
        )

    if not hass.services.has_service(DOMAIN, "cancel_laundry"):
        hass.services.async_register(
            DOMAIN,
            "cancel_laundry",
            handle_cancel_laundry,
            schema=vol.Schema(
                {
                    vol.Required("booking_id"): str,
                }
            ),
        )


async def async_unload_entry(hass: HomeAssistant, entry: AptusConfigEntry) -> bool:
    """Unload an Aptus config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        await entry.runtime_data.client.close()
    return unload_ok
