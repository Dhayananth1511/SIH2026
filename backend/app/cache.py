import time
from typing import Any, Optional, Dict

class FastMemoryCache:
    def __init__(self, default_ttl: float = 30.0):
        self._cache: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            if time.time() < self._expiry.get(key, 0):
                return self._cache[key]
            else:
                self.delete(key)
        return None

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        self._cache[key] = value
        self._expiry[key] = time.time() + (ttl if ttl is not None else self.default_ttl)

    def delete(self, key: str) -> None:
        self._cache.pop(key, None)
        self._expiry.pop(key, None)

    def clear(self) -> None:
        self._cache.clear()
        self._expiry.clear()

cache = FastMemoryCache(default_ttl=30.0)
