from pathlib import Path

from pypdf import PdfReader
from pypdf._encryption import PasswordType
from pypdf.errors import FileNotDecryptedError, PdfReadError


class PDFPasswordRequiredError(Exception):
    """Raised when a PDF is encrypted but no password was provided."""


class PDFIncorrectPasswordError(Exception):
    """Raised when the password provided for an encrypted PDF is wrong."""


def is_pdf_encrypted(file_path: str | Path) -> bool:
    """Return True if the PDF at the given path requires a password."""
    try:
        reader = PdfReader(str(file_path))
        return bool(reader.is_encrypted)
    except Exception:
        return False


def open_pdf(file_path: str | Path, password: str | None = None) -> PdfReader:
    """Open a PDF, decrypting it in memory when a password is supplied.

    Raises:
        PDFPasswordRequiredError: PDF is encrypted and no password was given.
        PDFIncorrectPasswordError: The supplied password is incorrect.
        PdfReadError: The file is not a readable PDF.
    """
    reader = PdfReader(str(file_path))

    if reader.is_encrypted:
        if not password:
            raise PDFPasswordRequiredError(
                "This PDF is password protected. Please provide the password to parse it."
            )
        result = reader.decrypt(password)
        if result == PasswordType.NOT_DECRYPTED:
            raise PDFIncorrectPasswordError(
                "The password provided is incorrect. Please try again."
            )

    try:
        reader.pages  # force lazy decryption check
    except FileNotDecryptedError:
        if not password:
            raise PDFPasswordRequiredError(
                "This PDF is password protected. Please provide the password to parse it."
            )
        raise PDFIncorrectPasswordError(
            "The password provided is incorrect. Please try again."
        )

    return reader
