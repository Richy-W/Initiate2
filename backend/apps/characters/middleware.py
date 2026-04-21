import json

class DebugMiddleware:
    """Middleware to debug incoming requests."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log all API requests  
        if request.path.startswith('/api/v1/characters'):
            print(f"\n=== CHARACTER API REQUEST DEBUG ===")
            print(f"Path: {request.path}")
            print(f"Method: {request.method}")
            
            # Safely check for user (might not be available yet)
            user_info = "Not authenticated yet"
            if hasattr(request, 'user'):
                user_info = f"{request.user} (authenticated: {getattr(request.user, 'is_authenticated', False)})"
            print(f"User: {user_info}")
            
            print(f"Content Type: {request.content_type}")
            
            if request.method == 'POST':
                try:
                    body = request.body.decode('utf-8')
                    if body:
                        print(f"Request body: {body}")
                        try:
                            json_data = json.loads(body)
                            print(f"Parsed JSON: {json_data}")
                        except:
                            print("Could not parse JSON")
                except:
                    print(f"Could not decode body")
            
            print("================================\n")
        
        response = self.get_response(request)
        
        # Log response for character API
        if request.path.startswith('/api/v1/characters'):
            print(f"\n=== CHARACTER API RESPONSE DEBUG ===")
            print(f"Status: {response.status_code}")
            if hasattr(response, 'content'):
                content = response.content.decode('utf-8')[:500]
                print(f"Response content (first 500 chars): {content}")
            print("===================================\n")
        
        return response