import json
import os
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


def get_content_path():
    """Get the path to the content directory."""
    return os.path.join(settings.BASE_DIR, '..', 'api', 'content')


@api_view(['GET'])
@permission_classes([AllowAny])
def species_list(request):
    """Get all species from JSON files."""
    species_dir = os.path.join(get_content_path(), 'species')
    
    if not os.path.exists(species_dir):
        return Response({'error': 'Species data not found'}, status=status.HTTP_404_NOT_FOUND)
    
    species_list = []
    
    for filename in os.listdir(species_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(species_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    species_data = json.load(f)
                    # Add an ID based on filename
                    species_id = os.path.splitext(filename)[0]
                    species_data['id'] = species_id
                    species_list.append(species_data)
            except Exception as e:
                continue
    
    return Response({
        'count': len(species_list),
        'results': species_list
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def species_detail(request, species_id):
    """Get specific species by ID."""
    species_file = os.path.join(get_content_path(), 'species', f'{species_id}.json')
    
    if not os.path.exists(species_file):
        return Response({'error': 'Species not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        with open(species_file, 'r', encoding='utf-8') as f:
            species_data = json.load(f)
            species_data['id'] = species_id
            return Response(species_data)
    except Exception as e:
        return Response({'error': 'Error loading species data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def classes_list(request):
    """Get all classes from JSON files."""
    classes_dir = os.path.join(get_content_path(), 'classes')
    
    if not os.path.exists(classes_dir):
        return Response({'error': 'Classes data not found'}, status=status.HTTP_404_NOT_FOUND)
    
    classes_list = []
    
    for filename in os.listdir(classes_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(classes_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    class_data = json.load(f)
                    class_id = os.path.splitext(filename)[0]
                    class_data['id'] = class_id
                    classes_list.append(class_data)
            except Exception as e:
                continue
    
    return Response({
        'count': len(classes_list),
        'results': classes_list
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def classes_detail(request, class_id):
    """Get specific class by ID."""
    class_file = os.path.join(get_content_path(), 'classes', f'{class_id}.json')
    
    if not os.path.exists(class_file):
        return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        with open(class_file, 'r', encoding='utf-8') as f:
            class_data = json.load(f)
            class_data['id'] = class_id
            return Response(class_data)
    except Exception as e:
        return Response({'error': 'Error loading class data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def backgrounds_list(request):
    """Get all backgrounds from JSON files."""
    backgrounds_dir = os.path.join(get_content_path(), 'backgrounds')
    
    if not os.path.exists(backgrounds_dir):
        return Response({'error': 'Backgrounds data not found'}, status=status.HTTP_404_NOT_FOUND)
    
    backgrounds_list = []
    
    for filename in os.listdir(backgrounds_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(backgrounds_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    background_data = json.load(f)
                    background_id = os.path.splitext(filename)[0]
                    background_data['id'] = background_id
                    backgrounds_list.append(background_data)
            except Exception as e:
                continue
    
    return Response({
        'count': len(backgrounds_list),
        'results': backgrounds_list
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def backgrounds_detail(request, background_id):
    """Get specific background by ID."""
    background_file = os.path.join(get_content_path(), 'backgrounds', f'{background_id}.json')
    
    if not os.path.exists(background_file):
        return Response({'error': 'Background not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        with open(background_file, 'r', encoding='utf-8') as f:
            background_data = json.load(f)
            background_data['id'] = background_id
            return Response(background_data)
    except Exception as e:
        return Response({'error': 'Error loading background data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)