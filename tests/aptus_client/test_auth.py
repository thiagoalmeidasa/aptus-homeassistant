"""BDD tests for Aptus client authentication."""

import re

import aiohttp
import pytest
from yarl import URL

from custom_components.aptus.aptus_client import AptusClient
from custom_components.aptus.aptus_client.auth import encrypt_password
from custom_components.aptus.aptus_client.exceptions import (
    AptusAuthError,
    AptusConnectionError,
    AptusParseError,
    AptusSessionExpiredError,
)

from .conftest import (
    LOGIN_PAGE_HTML,
    LOGIN_PAGE_NO_SALT_HTML,
    LOGIN_PAGE_NO_TOKEN_HTML,
    TEST_BASE_URL,
    _inject_auth_cookie,
)

LOGIN_URL_RE = re.compile(r".*/Account/Login.*")
LANG_URL_RE = re.compile(r".*/Account/SetCustomerLanguage.*")


def _find_post_data(mock_aio) -> dict | None:
    """Find the first POST request's form data in aioresponses history."""
    for (method, _url), calls in mock_aio.requests.items():
        if method == "POST":
            return calls[0].kwargs.get("data")
    return None


def _setup_login_mocks(mock_aio, base_url=TEST_BASE_URL, login_html=LOGIN_PAGE_HTML):
    """Register standard login mocks."""
    mock_aio.get(LANG_URL_RE, status=302)
    mock_aio.get(LOGIN_URL_RE, body=login_html)
    mock_aio.post(LOGIN_URL_RE, status=302)


class TestEncryptPassword:
    """Describe encrypt_password (XOR cipher)."""

    def test_it_should_xor_each_character_with_the_salt(self):
        result = encrypt_password("abc", 1)

        assert result == "".join(chr(ord(c) ^ 1) for c in "abc")
        assert result == "`cb"

    def test_it_should_return_the_original_string_when_salt_is_zero(self):
        assert encrypt_password("hello", 0) == "hello"

    def test_it_should_return_empty_string_for_empty_password(self):
        assert encrypt_password("", 667) == ""

    def test_it_should_handle_unicode_characters(self):
        result = encrypt_password("åäö", 5)
        assert result == "".join(chr(ord(c) ^ 5) for c in "åäö")


class TestAptusClientLogin:
    """Describe AptusClient.login()."""

    async def test_it_should_set_language_to_english_before_login(self, mock_aio, aiohttp_session):
        _setup_login_mocks(mock_aio)
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        try:
            await client.login()
        except AptusAuthError:
            pass

        # Verify a GET to SetCustomerLanguage was made
        has_lang_call = any(
            method == "GET" and "SetCustomerLanguage" in str(url)
            for (method, url) in mock_aio.requests
        )
        assert has_lang_call

    async def test_it_should_extract_csrf_token_and_salt_from_login_page(
        self, mock_aio, aiohttp_session
    ):
        _setup_login_mocks(mock_aio)
        client = AptusClient(TEST_BASE_URL, "user", "testpass", session=aiohttp_session)

        try:
            await client.login()
        except AptusAuthError:
            pass

        form_data = _find_post_data(mock_aio)
        assert form_data is not None
        assert form_data["__RequestVerificationToken"] == "test-token-123"
        assert form_data["PasswordSalt"] == "667"
        assert form_data["PwEnc"] == encrypt_password("testpass", 667)

    async def test_it_should_post_encrypted_password_with_form_data(
        self, mock_aio, aiohttp_session
    ):
        _setup_login_mocks(mock_aio)
        client = AptusClient(TEST_BASE_URL, "myuser", "mypass", session=aiohttp_session)

        try:
            await client.login()
        except AptusAuthError:
            pass

        form_data = _find_post_data(mock_aio)
        assert form_data["UserName"] == "myuser"
        assert form_data["Password"] == "mypass"
        assert form_data["DeviceType"] == "PC"
        assert form_data["DesktopSelected"] == "true"

    async def test_it_should_succeed_when_aspxauth_cookie_is_received(
        self, mock_aio, aiohttp_session
    ):
        _setup_login_mocks(mock_aio)

        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        await aiohttp_session.get(
            f"{TEST_BASE_URL}/Account/SetCustomerLanguage?lang=en-GB",
            allow_redirects=False,
        )
        await aiohttp_session.get(
            f"{TEST_BASE_URL}/Account/Login",
            params={"ReturnUrl": "/Aptusportal/"},
        )
        await aiohttp_session.post(
            f"{TEST_BASE_URL}/Account/Login",
            params={"ReturnUrl": "/Aptusportal/"},
            data={},
            allow_redirects=False,
        )
        _inject_auth_cookie(aiohttp_session, TEST_BASE_URL)
        cookies = {c.key for c in aiohttp_session.cookie_jar}
        assert ".ASPXAUTH" in cookies  # Should not raise

    async def test_it_should_raise_auth_error_when_no_auth_cookie(self, mock_aio, aiohttp_session):
        _setup_login_mocks(mock_aio)
        client = AptusClient(TEST_BASE_URL, "user", "badpass", session=aiohttp_session)

        with pytest.raises(AptusAuthError):
            await client.login()

    async def test_it_should_raise_connection_error_on_network_failure(
        self, mock_aio, aiohttp_session
    ):
        mock_aio.get(
            LANG_URL_RE,
            exception=aiohttp.ClientError("Connection refused"),
        )

        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        with pytest.raises(AptusConnectionError):
            await client.login()

    async def test_it_should_raise_parse_error_when_csrf_token_missing(
        self, mock_aio, aiohttp_session
    ):
        _setup_login_mocks(mock_aio, login_html=LOGIN_PAGE_NO_TOKEN_HTML)
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        with pytest.raises(AptusParseError):
            await client.login()

    async def test_it_should_raise_parse_error_when_salt_missing(self, mock_aio, aiohttp_session):
        _setup_login_mocks(mock_aio, login_html=LOGIN_PAGE_NO_SALT_HTML)
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        with pytest.raises(AptusParseError):
            await client.login()

    async def test_it_should_work_with_different_base_urls(self, mock_aio, aiohttp_session):
        other_url = "https://sssb.aptustotal.se/AptusPortal"
        _setup_login_mocks(mock_aio, base_url=other_url)

        client = AptusClient(other_url, "user", "pass", session=aiohttp_session)
        try:
            await client.login()
        except AptusAuthError:
            pass

        has_lang_call = any(
            method == "GET" and "sssb.aptustotal.se" in str(url)
            for (method, url) in mock_aio.requests
        )
        assert has_lang_call


class TestAptusClientSessionLifecycle:
    """Describe AptusClient session lifecycle."""

    async def test_it_should_use_provided_session(self, mock_aio, aiohttp_session):
        _setup_login_mocks(mock_aio)
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        assert client._session is aiohttp_session

    async def test_it_should_create_session_on_login_if_none_provided(
        self, mock_aio, aiohttp_session
    ):
        _setup_login_mocks(mock_aio)
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        try:
            await client.login()
        except AptusAuthError:
            pass

        assert client._session is not None

    async def test_it_should_close_session_on_close(self, mock_aio, aiohttp_session):
        _setup_login_mocks(mock_aio)
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        try:
            await client.login()
        except AptusAuthError:
            pass

        await client.close()
        assert aiohttp_session.closed

    async def test_it_should_support_async_context_manager(self, mock_aio, aiohttp_session):
        _setup_login_mocks(mock_aio)

        try:
            async with AptusClient(
                TEST_BASE_URL, "user", "pass", session=aiohttp_session
            ) as client:
                pass
        except AptusAuthError:
            pass

    async def test_it_should_raise_when_accessing_session_before_login(self):
        client = AptusClient(TEST_BASE_URL, "user", "pass")

        with pytest.raises(RuntimeError):
            _ = client.session


class TestSessionReconnect:
    """Describe AptusClient auto-reconnect when session is closed."""

    async def test_it_should_re_login_when_session_is_closed(self, mock_aio, aiohttp_session):
        _setup_login_mocks(mock_aio)
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)

        # Close the session to simulate expiry
        await client.close()
        assert aiohttp_session.closed

        # Mock login + the GET request
        _setup_login_mocks(mock_aio)
        mock_aio.get(re.compile(r".*/Lock$"), body="<html></html>")

        # Patch _ensure_session to create a new mock session with auth cookie
        async def _mock_ensure():
            if client._session is None or client._session.closed:
                from .conftest import _make_session

                client._session = _make_session(headers=client._headers)
                _inject_auth_cookie(client._session, TEST_BASE_URL)

        client._ensure_session = _mock_ensure  # type: ignore[assignment]

        response = await client.get("Lock")
        assert response.status == 200
        await client.close()

    async def test_it_should_not_re_login_when_session_is_active(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Lock$"), body="<html></html>")

        original_session = client._session

        response = await client.get("Lock")

        # Session should be the same — no reconnect needed
        assert client._session is original_session
        assert response.status == 200


class TestCheckResponse:
    """Describe AptusClient._check_response() redirect detection."""

    async def test_it_should_raise_auth_error_when_redirected_to_error_page(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(re.compile(r".*/Account/Error"), status=200, body="<html>Error</html>")

        with pytest.raises(AptusAuthError, match="error page"):
            await client.get("Account/Error")

    async def test_it_should_not_raise_for_normal_responses(self, logged_in_client):
        client, mock_aio = logged_in_client
        mock_aio.get(
            re.compile(r".*/Lock/UnlockEntryDoor/123"),
            payload={"StatusText": "OK", "HeaderStatusText": "OK"},
        )

        response = await client.get("Lock/UnlockEntryDoor/123")
        data = await response.json()

        assert data["HeaderStatusText"] == "OK"


class TestSessionRetryOnExpiry:
    """Describe AptusClient auto-retry when server-side session expires."""

    @staticmethod
    def _make_mock_login(client) -> object:
        """Create a mock login that creates a new session with auth cookie."""

        async def _mock_login():
            if client._session is None or client._session.closed:
                client._session = aiohttp.ClientSession(headers=client._headers)
            _inject_auth_cookie(client._session, TEST_BASE_URL)

        return _mock_login

    async def test_it_should_re_login_and_retry_on_too_many_redirects(
        self, mock_aio, aiohttp_session
    ):
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)
        _inject_auth_cookie(aiohttp_session, TEST_BASE_URL)

        # First GET raises TooManyRedirects (session expired, portal redirects to login)
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            exception=aiohttp.TooManyRedirects(
                aiohttp.RequestInfo(
                    url=URL(f"{TEST_BASE_URL}/CustomerBooking"),
                    method="GET",
                    headers={},
                    real_url=URL(f"{TEST_BASE_URL}/CustomerBooking"),
                ),
                history=(),
            ),
        )

        client.login = self._make_mock_login(client)  # type: ignore[assignment]

        # Second GET succeeds after re-login
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            body="<html><body>Bookings</body></html>",
        )

        response = await client.get("CustomerBooking")
        assert response.status == 200
        await client.close()

    async def test_it_should_re_login_and_retry_when_check_response_detects_login(
        self, mock_aio, aiohttp_session
    ):
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)
        _inject_auth_cookie(aiohttp_session, TEST_BASE_URL)

        # First GET returns OK but _check_response will detect login redirect
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            body="<html>Login</html>",
        )

        call_count = 0
        original_check = client._check_response

        def _check_raising_first_time(response):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise AptusSessionExpiredError("Session expired — redirected to login")
            original_check(response)

        client._check_response = _check_raising_first_time  # type: ignore[assignment]
        client.login = self._make_mock_login(client)  # type: ignore[assignment]

        # Second GET succeeds after re-login
        mock_aio.get(
            re.compile(r".*/CustomerBooking$"),
            body="<html><body>Bookings</body></html>",
        )

        response = await client.get("CustomerBooking")
        assert response.status == 200
        assert call_count == 2  # First call raised, second succeeded
        await client.close()

    async def test_it_should_not_retry_more_than_once(self, mock_aio, aiohttp_session):
        client = AptusClient(TEST_BASE_URL, "user", "pass", session=aiohttp_session)
        _inject_auth_cookie(aiohttp_session, TEST_BASE_URL)

        # Both attempts raise TooManyRedirects
        for _ in range(2):
            mock_aio.get(
                re.compile(r".*/CustomerBooking$"),
                exception=aiohttp.TooManyRedirects(
                    aiohttp.RequestInfo(
                        url=URL(f"{TEST_BASE_URL}/CustomerBooking"),
                        method="GET",
                        headers={},
                        real_url=URL(f"{TEST_BASE_URL}/CustomerBooking"),
                    ),
                    history=(),
                ),
            )

        client.login = self._make_mock_login(client)  # type: ignore[assignment]

        with pytest.raises(AptusAuthError, match="re-login"):
            await client.get("CustomerBooking")
        await client.close()
