from datetime import datetime, timezone


def timezone_now():
    return datetime.now(timezone.utc)
