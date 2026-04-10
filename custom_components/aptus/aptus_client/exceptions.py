"""Aptus client exception hierarchy."""


class AptusError(Exception):
    """Base exception for Aptus client errors."""


class AptusAuthError(AptusError):
    """Login failed or session expired."""


class AptusConnectionError(AptusError):
    """Network or timeout error communicating with the portal."""


class AptusParseError(AptusError):
    """Unexpected HTML structure from the portal."""
