"""Shared fixtures for aptus_client tests."""

import re
from http.cookies import SimpleCookie

import aiohttp
import pytest_asyncio
from aioresponses import aioresponses
from yarl import URL

from custom_components.aptus.aptus_client import AptusClient

TEST_BASE_URL = "https://bokning.test.se/Aptusportal"

LOGIN_PAGE_HTML = """
<html><body><form>
    <input name="__RequestVerificationToken" type="hidden" value="test-token-123">
    <input id="PasswordSalt" type="hidden" value="667">
</form></body></html>
"""

LOGIN_PAGE_NO_TOKEN_HTML = """
<html><body><form>
    <input id="PasswordSalt" type="hidden" value="667">
</form></body></html>
"""

LOGIN_PAGE_NO_SALT_HTML = """
<html><body><form>
    <input name="__RequestVerificationToken" type="hidden" value="test-token-123">
</form></body></html>
"""

LOCK_PAGE_SINGLE_DOOR_HTML = """
<html><body>
<div class="lockCard" id="entranceDoor_12227">
    <span>Entity Example</span>
    <button id="entranceDoorButton_12227">Unlock</button>
</div>
</body></html>
"""

LOCK_PAGE_MULTIPLE_DOORS_HTML = """
<html><body>
<div class="lockCard" id="entranceDoor_12227">
    <span>Entity Example</span>
</div>
<div class="lockCard" id="entranceDoor_100">
    <span>Front Door</span>
</div>
<div class="lockCard" id="entranceDoor_200">
    <span>Back Door</span>
</div>
</body></html>
"""

LOCK_PAGE_EMPTY_HTML = """
<html><body></body></html>
"""

LOCK_PAGE_INVALID_ID_HTML = """
<html><body>
<div class="lockCard" id="invalidCard">
    <span>Bad door</span>
</div>
</body></html>
"""

LOGIN_URL_RE = re.compile(r".*/Account/Login.*")
LANG_URL_RE = re.compile(r".*/Account/SetCustomerLanguage.*")


def _inject_auth_cookie(session: aiohttp.ClientSession, base_url: str) -> None:
    """Inject .ASPXAUTH cookie — aioresponses doesn't relay Set-Cookie headers."""
    cookie = SimpleCookie()
    cookie[".ASPXAUTH"] = "fake-auth-token"
    cookie[".ASPXAUTH"]["path"] = "/"
    session.cookie_jar.update_cookies(cookie, URL(base_url))


@pytest_asyncio.fixture
async def mock_aio():
    """Yield an aioresponses context."""
    with aioresponses() as m:
        yield m


@pytest_asyncio.fixture
async def logged_in_client(mock_aio):
    """Yield a pre-authenticated AptusClient backed by aioresponses mocks.

    Bypasses the real login flow by directly creating a session and
    injecting the .ASPXAUTH cookie.
    """
    client = AptusClient(
        base_url=TEST_BASE_URL, username="testuser", password="testpass"
    )
    client._session = aiohttp.ClientSession(headers=client._headers)
    _inject_auth_cookie(client._session, TEST_BASE_URL)

    yield client, mock_aio

    await client.close()
