"""BDD tests for Aptus config flow."""

from unittest.mock import AsyncMock, patch

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
import voluptuous as vol

from custom_components.aptus.aptus_client.exceptions import (
    AptusAuthError,
    AptusConnectionError,
)
from custom_components.aptus.const import (
    CONF_ENABLE_APARTMENT_DOOR,
    CONF_ENABLE_ENTRANCE_DOORS,
    CONF_ENABLE_LAUNDRY,
    CONF_SCAN_INTERVAL,
    DEFAULT_SCAN_INTERVAL_MINUTES,
    DOMAIN,
    MAX_SCAN_INTERVAL_MINUTES,
    MIN_SCAN_INTERVAL_MINUTES,
)

from .conftest import TEST_BASE_URL, TEST_PASSWORD, TEST_USERNAME

MOCK_DETECTED_FEATURES = {
    "enable_entrance_doors": True,
    "enable_apartment_door": False,
    "enable_laundry": True,
}


def _mock_config_flow_patches():
    """Return context manager with standard config flow mocks."""
    mock_client = AsyncMock()
    return (
        mock_client,
        patch("custom_components.aptus.config_flow.AptusClient", return_value=mock_client),
        patch(
            "custom_components.aptus.config_flow._detect_features",
            return_value=MOCK_DETECTED_FEATURES,
        ),
        patch("custom_components.aptus.async_setup_entry", return_value=True),
    )


async def _complete_user_step(hass, flow_id):
    """Submit credentials in the user step, returning the features step."""
    return await hass.config_entries.flow.async_configure(
        flow_id,
        {
            "base_url": TEST_BASE_URL,
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
        },
    )


async def _complete_features_step(hass, flow_id, features=None):
    """Submit features in the features step."""
    if features is None:
        features = MOCK_DETECTED_FEATURES
    return await hass.config_entries.flow.async_configure(flow_id, features)


class TestAptusConfigFlow:
    """Describe the user configuration step."""

    async def test_it_should_show_form_on_initial_load(self, hass: HomeAssistant):
        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )

        assert result["type"] == FlowResultType.FORM
        assert result["step_id"] == "user"

    async def test_it_should_show_features_step_after_login(self, hass: HomeAssistant):
        mock_client, client_patch, detect_patch, setup_patch = _mock_config_flow_patches()
        with client_patch, detect_patch, setup_patch:
            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await _complete_user_step(hass, result["flow_id"])

        assert result["type"] == FlowResultType.FORM
        assert result["step_id"] == "features"

    async def test_it_should_create_entry_on_successful_login(self, hass: HomeAssistant):
        mock_client, client_patch, detect_patch, setup_patch = _mock_config_flow_patches()
        with client_patch, detect_patch, setup_patch:
            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await _complete_user_step(hass, result["flow_id"])
            result = await _complete_features_step(hass, result["flow_id"])

        assert result["type"] == FlowResultType.CREATE_ENTRY
        assert result["title"] == "Aptus"

    async def test_it_should_store_base_url_username_and_password(self, hass: HomeAssistant):
        mock_client, client_patch, detect_patch, setup_patch = _mock_config_flow_patches()
        with client_patch, detect_patch, setup_patch:
            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await _complete_user_step(hass, result["flow_id"])
            result = await _complete_features_step(hass, result["flow_id"])

        assert result["data"]["base_url"] == TEST_BASE_URL
        assert result["data"]["username"] == TEST_USERNAME
        assert result["data"]["password"] == TEST_PASSWORD

    async def test_it_should_store_feature_options(self, hass: HomeAssistant):
        mock_client, client_patch, detect_patch, setup_patch = _mock_config_flow_patches()
        with client_patch, detect_patch, setup_patch:
            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await _complete_user_step(hass, result["flow_id"])
            result = await _complete_features_step(hass, result["flow_id"])

        assert result["options"]["enable_entrance_doors"] is True
        assert result["options"]["enable_apartment_door"] is False
        assert result["options"]["enable_laundry"] is True

    async def test_it_should_set_unique_id_from_base_url_and_username(self, hass: HomeAssistant):
        mock_client, client_patch, detect_patch, setup_patch = _mock_config_flow_patches()
        with client_patch, detect_patch, setup_patch:
            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await _complete_user_step(hass, result["flow_id"])
            result = await _complete_features_step(hass, result["flow_id"])

        assert result["type"] == FlowResultType.CREATE_ENTRY
        entry = hass.config_entries.async_entries(DOMAIN)[0]
        assert entry.unique_id == f"{TEST_BASE_URL}_{TEST_USERNAME}"

    async def test_it_should_show_invalid_auth_on_login_failure(self, hass: HomeAssistant):
        with patch("custom_components.aptus.config_flow.AptusClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.login.side_effect = AptusAuthError("bad creds")
            mock_client_cls.return_value = mock_client

            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"],
                {
                    "base_url": TEST_BASE_URL,
                    "username": TEST_USERNAME,
                    "password": "wrong",
                },
            )

        assert result["type"] == FlowResultType.FORM
        assert result["errors"] == {"base": "invalid_auth"}

    async def test_it_should_show_cannot_connect_on_connection_error(self, hass: HomeAssistant):
        with patch("custom_components.aptus.config_flow.AptusClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.login.side_effect = AptusConnectionError("timeout")
            mock_client_cls.return_value = mock_client

            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"],
                {
                    "base_url": TEST_BASE_URL,
                    "username": TEST_USERNAME,
                    "password": TEST_PASSWORD,
                },
            )

        assert result["type"] == FlowResultType.FORM
        assert result["errors"] == {"base": "cannot_connect"}

    async def test_it_should_abort_if_already_configured(self, hass: HomeAssistant):
        mock_client, client_patch, detect_patch, setup_patch = _mock_config_flow_patches()

        # Create first entry
        with client_patch, detect_patch, setup_patch:
            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await _complete_user_step(hass, result["flow_id"])
            await _complete_features_step(hass, result["flow_id"])

        # Try creating duplicate
        mock_client2, client_patch2, detect_patch2, setup_patch2 = _mock_config_flow_patches()
        with client_patch2, detect_patch2, setup_patch2:
            result = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": config_entries.SOURCE_USER}
            )
            result = await _complete_user_step(hass, result["flow_id"])
            result = await _complete_features_step(hass, result["flow_id"])

        assert result["type"] == FlowResultType.ABORT
        assert result["reason"] == "already_configured"


def _make_options_entry(hass: HomeAssistant, options: dict | None = None) -> MockConfigEntry:
    """Create a config entry suitable for driving the options flow."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Aptus Test",
        data={
            "base_url": TEST_BASE_URL,
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
        },
        options=options or {},
        unique_id=f"{TEST_BASE_URL}_{TEST_USERNAME}",
    )
    entry.add_to_hass(hass)
    return entry


def _marker_for(schema: vol.Schema, key: str):
    """Return the vol marker (Required/Optional) for a given key in a schema."""
    for marker in schema.schema:
        marker_key = marker.schema if hasattr(marker, "schema") else marker
        if marker_key == key:
            return marker
    return None


def _resolve_default(marker):
    """Return the marker's default value (calls the default factory if needed)."""
    default = marker.default
    return default() if callable(default) else default


def _valid_options_payload(**overrides):
    """Return a complete options-step payload with overrides merged in."""
    payload = {
        CONF_ENABLE_ENTRANCE_DOORS: True,
        CONF_ENABLE_APARTMENT_DOOR: False,
        CONF_ENABLE_LAUNDRY: True,
        CONF_SCAN_INTERVAL: DEFAULT_SCAN_INTERVAL_MINUTES,
    }
    payload.update(overrides)
    return payload


class TestAptusOptionsFlowScanInterval:
    """Describe the scan_interval field in the options flow."""

    async def test_it_should_render_a_scan_interval_field_in_the_options_form(
        self, hass: HomeAssistant
    ):
        entry = _make_options_entry(hass)
        result = await hass.config_entries.options.async_init(entry.entry_id)

        assert result["type"] == FlowResultType.FORM
        assert _marker_for(result["data_schema"], CONF_SCAN_INTERVAL) is not None

    async def test_it_should_default_the_scan_interval_field_to_the_currently_saved_value(
        self, hass: HomeAssistant
    ):
        saved_value = MIN_SCAN_INTERVAL_MINUTES + 2
        entry = _make_options_entry(hass, options={CONF_SCAN_INTERVAL: saved_value})

        result = await hass.config_entries.options.async_init(entry.entry_id)

        marker = _marker_for(result["data_schema"], CONF_SCAN_INTERVAL)
        assert _resolve_default(marker) == saved_value

    async def test_it_should_default_the_scan_interval_field_to_the_default_when_no_value_is_saved(
        self, hass: HomeAssistant
    ):
        entry = _make_options_entry(hass)

        result = await hass.config_entries.options.async_init(entry.entry_id)

        marker = _marker_for(result["data_schema"], CONF_SCAN_INTERVAL)
        assert _resolve_default(marker) == DEFAULT_SCAN_INTERVAL_MINUTES

    async def test_it_should_persist_the_scan_interval_when_options_are_submitted(
        self, hass: HomeAssistant
    ):
        entry = _make_options_entry(hass)
        chosen_value = MIN_SCAN_INTERVAL_MINUTES + 1

        result = await hass.config_entries.options.async_init(entry.entry_id)
        result = await hass.config_entries.options.async_configure(
            result["flow_id"],
            _valid_options_payload(**{CONF_SCAN_INTERVAL: chosen_value}),
        )

        assert result["type"] == FlowResultType.CREATE_ENTRY
        assert entry.options[CONF_SCAN_INTERVAL] == chosen_value

    async def test_it_should_reject_a_scan_interval_below_the_allowed_minimum(
        self, hass: HomeAssistant
    ):
        entry = _make_options_entry(hass)
        below_minimum = MIN_SCAN_INTERVAL_MINUTES - 1

        result = await hass.config_entries.options.async_init(entry.entry_id)
        with pytest.raises(vol.Invalid):
            await hass.config_entries.options.async_configure(
                result["flow_id"],
                _valid_options_payload(**{CONF_SCAN_INTERVAL: below_minimum}),
            )

    async def test_it_should_reject_a_scan_interval_above_the_allowed_maximum(
        self, hass: HomeAssistant
    ):
        entry = _make_options_entry(hass)
        above_maximum = MAX_SCAN_INTERVAL_MINUTES + 1

        result = await hass.config_entries.options.async_init(entry.entry_id)
        with pytest.raises(vol.Invalid):
            await hass.config_entries.options.async_configure(
                result["flow_id"],
                _valid_options_payload(**{CONF_SCAN_INTERVAL: above_maximum}),
            )
