import json
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import AuditLog

logger = logging.getLogger(__name__)

def create_audit_log(user, action, entity, entity_id=None, metadata=None):
    """
    Creates an immutable audit log record.
    """
    try:
        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            metadata=metadata or {}
        )
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")

def broadcast_ws_event(event_type, payload):
    """
    Broadcasts real-time events over Django Channels group 'skyvent_live'.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "skyvent_live",
                {
                    "type": "skyvent.event",
                    "event": event_type,
                    "data": payload
                }
            )
    except Exception as e:
        logger.warning(f"Could not broadcast websocket event {event_type}: {e}")
