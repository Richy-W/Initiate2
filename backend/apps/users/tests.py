from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


class UserProfileThemePreferenceTests(APITestCase):
	def setUp(self):
		self.user_model = get_user_model()
		self.user = self.user_model.objects.create_user(
			username='theme-user',
			email='theme@example.com',
			password='strong-pass-123',
			first_name='Theme',
			last_name='Tester',
		)
		self.client.force_authenticate(user=self.user)
		self.profile_url = '/api/v1/users/profile/'

	def test_profile_get_includes_default_theme_preference(self):
		response = self.client.get(self.profile_url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['theme_preference'], self.user_model.THEME_TAVERN_LIGHT)

	def test_profile_patch_updates_theme_preference(self):
		response = self.client.patch(
			self.profile_url,
			{'theme_preference': self.user_model.THEME_DARK},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.user.refresh_from_db()
		self.assertEqual(self.user.theme_preference, self.user_model.THEME_DARK)

	def test_profile_patch_rejects_invalid_theme_preference(self):
		response = self.client.patch(
			self.profile_url,
			{'theme_preference': 'invalid-theme'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('theme_preference', response.data.get('errors', {}))

	def test_profile_get_normalizes_invalid_stored_theme_preference(self):
		self.user_model.objects.filter(pk=self.user.pk).update(theme_preference='legacy-value')
		self.user.refresh_from_db()

		response = self.client.get(self.profile_url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['theme_preference'], self.user_model.THEME_TAVERN_LIGHT)
		self.user.refresh_from_db()
		self.assertEqual(self.user.theme_preference, self.user_model.THEME_TAVERN_LIGHT)

	def test_profile_get_returns_allowed_theme_preference_value(self):
		response = self.client.get(self.profile_url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn(
			response.data['theme_preference'],
			{self.user_model.THEME_DARK, self.user_model.THEME_TAVERN_LIGHT},
		)
