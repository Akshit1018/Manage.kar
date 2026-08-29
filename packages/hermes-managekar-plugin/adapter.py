"""Manage.kar gateway platform.

Chat still uses the official dashboard WebSocket after claim.
This adapter exists so `hermes plugins install` can register a real
`kind: platform` plugin, same install path as WhatsApp / IRC.
"""

from __future__ import annotations

import os
from typing import Any

from .pairing import PairStore, default_store_path


def check_requirements() -> bool:
    return os.environ.get("MANAGEKAR_ENABLED", "true").strip().lower() not in {"0", "false", "no"}


def _env_enablement() -> dict[str, Any] | None:
    if not check_requirements():
        return None
    extra: dict[str, Any] = {"enabled": True}
    public = os.environ.get("MANAGEKAR_PUBLIC_BASE", "").strip()
    if public:
        extra["public_base"] = public
    return extra


def register(ctx: Any) -> None:
    def setup_pair(parser: Any) -> None:
        parser.add_argument("--host", default=os.environ.get("MANAGEKAR_PUBLIC_BASE", "http://127.0.0.1:9119"))
        parser.add_argument("--label", default="Hermes")

    def handle_pair(args: Any) -> None:
        from .cli import print_pair

        print_pair(args.host, args.label)

    if hasattr(ctx, "register_cli_command"):
        ctx.register_cli_command(
            "managekar",
            "Mint a Manage.kar host QR / claim ticket",
            setup_pair,
            handle_pair,
            description="WhatsApp-style host pairing for the Manage.kar companion",
        )

    try:
        from gateway.platforms.base import BasePlatformAdapter, SendResult
    except ImportError:
        return

    class ManagekarAdapter(BasePlatformAdapter):
        name = "managekar"
        supports_async_delivery = True

        def __init__(self, config: Any = None) -> None:
            self.config = config
            self._store = PairStore(default_store_path())

        async def connect(self, *, is_reconnect: bool = False) -> bool:
            return check_requirements()

        async def disconnect(self) -> None:
            return None

        async def send(
            self,
            chat_id: str,
            content: str,
            reply_to: str | None = None,
            metadata: dict[str, Any] | None = None,
        ) -> SendResult:
            return SendResult(success=True, message_id=f"mk-{chat_id}")

    ctx.register_platform(
        name="managekar",
        label="Manage.kar",
        adapter_factory=lambda cfg: ManagekarAdapter(cfg),
        check_fn=check_requirements,
        env_enablement_fn=_env_enablement,
        emoji="📱",
        platform_hint="You are chatting via the Manage.kar companion after a host QR claim.",
    )
