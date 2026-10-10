from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken 
from rest_framework_simplejwt.exceptions import TokenError
from .models import Blog, Comment, Like
from .serializers import BlogSerializer, CommentSerializer, RegisterSerializer

@api_view(["POST"]) 
@permission_classes([AllowAny]) 
def logout(request): 
    try:
        refresh_token = request.data.get("refresh") 
        if not refresh_token: 
            return Response( {"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST, ) 
        RefreshToken(refresh_token).blacklist() 
        return Response(status=status.HTTP_205_RESET_CONTENT) 
    except TokenError: 
        return Response( {"detail": "Invalid or expired refresh token."}, status=status.HTTP_400_BAD_REQUEST, )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def blog_list(request):
    blogs = Blog.objects.all()
    serializer = BlogSerializer(blogs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blog_create(request):
    serializer = BlogSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def blog_detail(request, pk):
    blog = get_object_or_404(Blog, pk=pk)

    if request.method == 'GET':
        serializer = BlogSerializer(blog)
        return Response(serializer.data)

    if not request.user or not request.user.is_authenticated:
        return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.user != blog.author:
        if request.method == 'PUT':
            return Response({'detail': 'You do not have permission to update this blog.'}, status=status.HTTP_403_FORBIDDEN)
        return Response({'detail': 'You do not have permission to delete this blog.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = BlogSerializer(blog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    blog.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def blog_comments(request, pk):
    blog = get_object_or_404(Blog, pk=pk)

    if request.method == 'GET':
        comments = blog.comments.select_related('user')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    if not request.user.is_authenticated:
        return Response(
            {'detail': 'Authentication required.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    serializer = CommentSerializer(data=request.data)
    if serializer.is_valid():
        comment = serializer.save(blog=blog, user=request.user)
        return Response(
            CommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def comment_detail(request, pk, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id, blog_id=pk)
    if request.user != comment.user:
        return Response(
            {'detail': 'You do not have permission to modify this comment.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'DELETE':
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = CommentSerializer(
        comment,
        data=request.data,
        partial=request.method == 'PATCH',
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def blog_like(request, pk):
    blog = get_object_or_404(Blog, pk=pk)
    if request.method == 'DELETE':
        Like.objects.filter(blog=blog, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    _, created = Like.objects.get_or_create(blog=blog, user=request.user)
    return Response(
        {'liked': True, 'created': created, 'like_count': blog.likes.count()},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )
