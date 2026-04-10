"""Config flow for Aptus integration."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
import voluptuous as vol

from .aptus_client import AptusClient, doors, laundry
from .aptus_client.exceptions import AptusAuthError, AptusConnectionError
from .const import (
    CONF_ENABLE_APARTMENT_DOOR,
    CONF_ENABLE_ENTRANCE_DOORS,
    CONF_ENABLE_LAUNDRY,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required("base_url"): str,
        vol.Required("username"): str,
        vol.Required("password"): str,
    }
)


def _features_schema(defaults: dict[str, bool] | None = None) -> vol.Schema:
    """Build the features schema with defaults."""
    if defaults is None:
        defaults = {}
    return vol.Schema(
        {
            vol.Optional(
                CONF_ENABLE_ENTRANCE_DOORS,
                default=defaults.get(CONF_ENABLE_ENTRANCE_DOORS, True),
            ): bool,
            vol.Optional(
                CONF_ENABLE_APARTMENT_DOOR,
                default=defaults.get(CONF_ENABLE_APARTMENT_DOOR, False),
            ): bool,
            vol.Optional(
                CONF_ENABLE_LAUNDRY,
                default=defaults.get(CONF_ENABLE_LAUNDRY, True),
            ): bool,
        }
    )


class AptusOptionsFlow(OptionsFlow):
    """Handle options for Aptus."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=_features_schema(dict(self.config_entry.options)),
        )


class AptusConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Aptus."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialize the config flow."""
        self._user_data: dict[str, Any] = {}
        self._detected_features: dict[str, bool] = {}

    @staticmethod
    @callback
    def async_get_options_flow(_config_entry) -> AptusOptionsFlow:
        """Get the options flow."""
        return AptusOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Handle the credentials step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            client = AptusClient(
                base_url=user_input["base_url"],
                username=user_input["username"],
                password=user_input["password"],
            )
            try:
                await client.login()
                self._detected_features = await _detect_features(client)
            except AptusAuthError:
                errors["base"] = "invalid_auth"
            except AptusConnectionError:
                errors["base"] = "cannot_connect"
            except Exception:
                _LOGGER.exception("Unexpected exception during login")
                errors["base"] = "unknown"
            finally:
                await client.close()

            if not errors:
                self._user_data = user_input
                return await self.async_step_features()

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_DATA_SCHEMA,
            errors=errors,
        )

    async def async_step_features(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the features step — pre-filled with detected availability."""
        if user_input is not None:
            unique_id = f"{self._user_data['base_url']}_{self._user_data['username']}"
            await self.async_set_unique_id(unique_id)
            self._abort_if_unique_id_configured()

            return self.async_create_entry(
                title="Aptus",
                data=self._user_data,
                options=user_input,
            )

        return self.async_show_form(
            step_id="features",
            data_schema=_features_schema(self._detected_features),
            description_placeholders=self._detected_features,
        )


async def _detect_features(client: AptusClient) -> dict[str, bool]:
    """Probe the portal to detect which features are available."""
    features: dict[str, bool] = {}

    # Entrance doors
    door_list = await doors.list_doors(client)
    features[CONF_ENABLE_ENTRANCE_DOORS] = len(door_list) > 0

    # Apartment door
    status = await doors.get_apartment_door_status(client)
    features[CONF_ENABLE_APARTMENT_DOOR] = status is not None

    # Laundry
    bookings = await laundry.list_bookings(client)
    features[CONF_ENABLE_LAUNDRY] = bookings is not None

    _LOGGER.debug("Detected features: %s", features)
    return features
