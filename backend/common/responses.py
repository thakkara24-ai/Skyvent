from rest_framework.response import Response
from rest_framework import status

def success_response(data=None, message="Success", status_code=status.HTTP_200_OK):
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    return Response(payload, status=status_code)

def error_response(message="An error occurred", code="BAD_REQUEST", status_code=status.HTTP_400_BAD_REQUEST, errors=None):
    payload = {
        "success": False,
        "message": message,
        "code": code,
    }
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)
