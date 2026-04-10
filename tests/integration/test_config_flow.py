"""BDD tests for Aptus config flow."""

from unittest.mock import AsyncMock, patch

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.aptus.aptus_client.exceptions import (
    AptusAuthError,
    AptusConnectionError,
)
from custom_components.aptus.const import DOMAIN

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
