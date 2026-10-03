from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        message = "An error occurred"
        code = "API_ERROR"

        if isinstance(response.data, dict):
            # Extract most descriptive error message
            if 'detail' in response.data:
                message = str(response.data['detail'])
                code = getattr(exc, 'default_code', 'ERROR').upper()
            elif 'non_field_errors' in response.data:
                message = str(response.data['non_field_errors'][0])
                code = "VALIDATION_ERROR"
            else:
                first_key = next(iter(response.data))
                first_val = response.data[first_key]
                if isinstance(first_val, list) and first_val:
                    message = f"{first_key}: {first_val[0]}"
                else:
                    message = f"{first_key}: {first_val}"
                code = "VALIDATION_ERROR"
        elif isinstance(response.data, list) and response.data:
            message = str(response.data[0])
            code = "VALIDATION_ERROR"

        custom_data = {
            "success": False,
            "message": message,
            "code": code,
            "errors": response.data
        }
        response.data = custom_data
        return response

    logger.exception("Unhandled server exception: %s", str(exc))
    return Response(
        {
            "success": False,
            "message": "A server error occurred. Please try again later.",
            "code": "SERVER_ERROR"
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
