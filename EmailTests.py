import unittest
from Email import Email

class EmailTests(unittest.TestCase):
    def __assert_equal_by_value(self, original_email_obj, new_email_obj):
        self.assertEqual(original_email_obj.sender_email, new_email_obj.sender_email)
        self.assertEqual(original_email_obj.time, new_email_obj.time)
        self.assertEqual(original_email_obj.subject, new_email_obj.subject)
        self.assertEqual(original_email_obj.content, new_email_obj.content)
        self.assertEqual(original_email_obj.links, new_email_obj.links)

    def serialize_and_deserialize(self):
        # arrange
        email = Email(
            sender_email="sender@example.com",
            time="2023-06-03 10:30 AM",
            subject="Hello",
            content="This is the email content.",
            links=["http://example.com", "http://example2.com"]
        )
        
        # act
        serialized = email.to_json()
        deserialized = Email.from_json(serialized)

        # assert
        self.__assert_equal_by_value(email, deserialized)

# Create a test suite
suite = unittest.TestSuite()
suite.addTest(EmailTests('serialize_and_deserialize'))

# Create a test runner
runner = unittest.TextTestRunner()

# Run the test suite
runner.run(suite)