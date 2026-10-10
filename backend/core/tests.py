from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Blog


class BlogDetailPermissionTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(username='author', password='password')
        self.other_user = User.objects.create_user(username='other', password='password')
        self.blog = Blog.objects.create(
            author=self.author,
            title='Original title',
            description='Original description',
        )
        self.url = reverse('blog-detail', args=[self.blog.pk])

    def test_blog_can_be_read_without_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_only_author_can_update_blog(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.put(self.url, {'title': 'Changed title'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.blog.refresh_from_db()
        self.assertEqual(self.blog.title, 'Original title')

    def test_author_can_update_blog(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.put(self.url, {'title': 'Changed title'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.blog.refresh_from_db()
        self.assertEqual(self.blog.title, 'Changed title')

    def test_only_author_can_delete_blog(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Blog.objects.filter(pk=self.blog.pk).exists())

    def test_author_can_delete_blog(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Blog.objects.filter(pk=self.blog.pk).exists())

    def test_unauthenticated_user_cannot_update_or_delete_blog(self):
        update_response = self.client.put(
            self.url,
            {'title': 'Changed title'},
            format='json',
        )
        delete_response = self.client.delete(self.url)

        self.assertEqual(update_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(delete_response.status_code, status.HTTP_401_UNAUTHORIZED)
