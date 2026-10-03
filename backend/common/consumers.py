import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer

class SkyventLiveConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group_name = "skyvent_live"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        # Send initial connected handshake
        await self.send_json({
            "event": "connected",
            "message": "Connected to SKYVENT Realtime Stream"
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        # Ping / Pong support
        if content.get("type") == "ping":
            await self.send_json({"type": "pong"})

    async def skyvent_event(self, event):
        await self.send_json({
            "event": event.get("event"),
            "data": event.get("data")
        })
