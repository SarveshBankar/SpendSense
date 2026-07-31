import json
import logging
import logging.handlers
import sys
from pathlib import Path

from app.core.config import get_settings


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)
        return json.dumps(log_entry)


def setup_file_handler(log_dir: str, level: int) -> logging.handlers.RotatingFileHandler:
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    settings = get_settings()
    handler = logging.handlers.RotatingFileHandler(
        filename=settings.log_file,
        maxBytes=settings.log_max_bytes,
        backupCount=settings.log_backup_count,
    )
    handler.setLevel(level)
    handler.setFormatter(JSONFormatter())
    return handler


def setup_logging(level: str = "INFO") -> None:
    log_level = getattr(logging, level.upper(), logging.INFO)

    console_formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)-8s %(name)s  %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)

    root = logging.getLogger("spendsense")
    root.setLevel(log_level)
    root.addHandler(console_handler)

    try:
        file_handler = setup_file_handler("logs", log_level)
        root.addHandler(file_handler)
    except Exception:
        pass

    for logger_name in [
        "spendsense.auth",
        "spendsense.api",
        "spendsense.upload",
        "spendsense.report",
        "spendsense.error",
    ]:
        child = logging.getLogger(logger_name)
        child.setLevel(log_level)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"spendsense.{name}")
