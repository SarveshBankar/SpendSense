import logging
import sys


def setup_logging(level: str = "INFO") -> None:
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s  %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger("spendsense")
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.addHandler(handler)
