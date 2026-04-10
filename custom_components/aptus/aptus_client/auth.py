"""Aptus portal authentication."""


def encrypt_password(password: str, salt: int) -> str:
    """XOR-encrypt a password with the given salt (replicates pwEnc.js)."""
    return "".join(chr(ord(c) ^ salt) for c in password)
