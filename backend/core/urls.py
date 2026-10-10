from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    blog_comments,
    blog_create,
    blog_detail,
    blog_like,
    blog_list,
    comment_detail,
    logout,
    register,
)

urlpatterns = [
    path('register/', register, name='register'),
    path('logout/', logout, name='logout'),
    path('blogs/', blog_list, name='blog-list'),
    path('blogs/create/', blog_create, name='blog-create'),
    path('blogs/<int:pk>/', blog_detail, name='blog-detail'),
    path('blogs/<int:pk>/comments/', blog_comments, name='blog-comments'),
    path('blogs/<int:pk>/comments/<int:comment_id>/', comment_detail, name='comment-detail'),
    path('blogs/<int:pk>/like/', blog_like, name='blog-like'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)