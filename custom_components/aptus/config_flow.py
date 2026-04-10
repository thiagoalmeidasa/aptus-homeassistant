"""Config flow for Aptus integration."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .aptus_client import AptusClient
from .aptus_client.exceptions import AptusAuthError, AptusConnectionError
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required("base_url"): str,
        vol.Required("username"): str,
        vol.Required("password"): str,
    }
)


class AptusConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Aptus."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            client = AptusClient(
                base_url=user_input["base_url"],
                username=user_input["username"],
                password=user_input["password"],
            )
            try:
                await client.login()
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
                unique_id = f"{user_input['base_url']}_{user_input['username']}"
                await self.async_set_unique_id(unique_id)
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title="Aptus",
                    data=user_input,
                )

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_DATA_SCHEMA,
            errors=errors,
        )
