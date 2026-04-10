"""Aptus portal API client."""

from __future__ import annotations

import logging
from typing import Self

import aiohttp
from bs4 import BeautifulSoup

from .auth import encrypt_password
from .exceptions import AptusAuthError, AptusConnectionError, AptusParseError

_LOGGER = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/116.0.5845.97 Safari/537.36"
    ),
    "Accept": "*/*",
}


class AptusClient:
    """Async client for an AptusPortal instance."""

    _headers = _HEADERS

    def __init__(
        self,
        base_url: str,
        username: str,
        password: str,
        session: aiohttp.ClientSession | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._username = username
        self._password = password
        self._session = session

    async def login(self) -> None:
        """Authenticate against the portal. Raises on failure."""
        try:
            if self._session is None:
                self._session = aiohttp.ClientSession(headers=_HEADERS)

            # 1. Set language
            _LOGGER.debug("Setting portal language to en-GB")
            await self._session.get(
                f"{self._base_url}/Account/SetCustomerLanguage?lang=en-GB",
                allow_redirects=False,
            )

            # 2. Fetch login page for CSRF token + salt
            _LOGGER.debug("Fetching login page for CSRF token")
            login_url = f"{self._base_url}/Account/Login"
            r = await self._session.get(
                login_url, params={"ReturnUrl": f"/{self._base_url.split('/')[-1]}/"}
            )
            soup = BeautifulSoup(await r.text(), "html.parser")

            token_el = soup.find("input", {"name": "__RequestVerificationToken"})
            if not token_el:
                raise AptusParseError("CSRF token not found on login page")
            token = token_el["value"]

            salt_el = soup.find("input", {"id": "PasswordSalt"})
            if not salt_el:
                raise AptusParseError("Password salt not found on login page")
            salt = int(salt_el["value"])

            # 3. POST login
            _LOGGER.debug("Posting login credentials for user %s", self._username)
            await self._session.post(
                login_url,
                params={"ReturnUrl": f"/{self._base_url.split('/')[-1]}/"},
                data={
                    "DeviceType": "PC",
                    "DesktopSelected": "true",
                    "__RequestVerificationToken": token,
                    "UserName": self._username,
                    "Password": self._password,
                    "PwEnc": encrypt_password(self._password, salt),
                    "PasswordSalt": str(salt),
                },
                allow_redirects=False,
            )

            # 4. Verify auth cookie
            cookies = {c.key for c in self._session.cookie_jar}
            if ".ASPXAUTH" not in cookies:
                raise AptusAuthError("Login failed — no auth cookie received")
            _LOGGER.debug("Login successful — .ASPXAUTH cookie received")

        except (aiohttp.ClientError, OSError) as exc:
            raise AptusConnectionError(str(exc)) from exc

    @property
    def session(self) -> aiohttp.ClientSession:
        if self._session is None:
            raise RuntimeError("Not logged in — call login() first")
        return self._session

    def _check_response(self, response: aiohttp.ClientResponse) -> None:
        """Raise if the portal redirected to an error or login page."""
        url_path = response.url.path.lower()
        if "/account/error" in url_path:
            _LOGGER.debug("Portal redirected to error page: %s", response.url)
            raise AptusAuthError(f"Portal redirected to error page: {response.url}")
        if "/account/login" in url_path:
            _LOGGER.debug("Session expired — redirected to login: %s", response.url)
            raise AptusAuthError(f"Session expired — redirected to login: {response.url}")

    async def get(self, path: str, **kwargs) -> aiohttp.ClientResponse:
        """GET a path relative to the portal base URL."""
        _LOGGER.debug("GET %s/%s", self._base_url, path.lstrip("/"))
        response = await self.session.get(f"{self._base_url}/{path.lstrip('/')}", **kwargs)
        self._check_response(response)
        return response

    async def get_ajax(self, path: str, **kwargs) -> aiohttp.ClientResponse:
        """GET with AJAX headers (required for JSON endpoints)."""
        _LOGGER.debug("GET (AJAX) %s", path)
        headers = kwargs.pop("headers", {})
        headers["X-Requested-With"] = "XMLHttpRequest"
        return await self.get(path, headers=headers, **kwargs)

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    async def __aenter__(self) -> Self:
        await self.login()
        return self

    async def __aexit__(self, *exc) -> None:
        await self.close()
