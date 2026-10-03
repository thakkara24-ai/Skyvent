from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import json

from accounts.models import User, OTPVerification
from memberships.models import MembershipPlan, Membership
from events.models import Event
from tickets.models import Ticket
from attendance.models import Attendance
from merchandise.models import Product
from orders.models import Order
from finance.models import Payment, Transaction, Expense

class SkyventFullWorkflowIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin
        self.admin_user = User.objects.create_superuser(
            email='admin@skyvent.demo',
            password='Password@123',
            name='Admin User'
        )

        # Create Member Plan
        self.plan = MembershipPlan.objects.create(
            name='Student Pro',
            description='Exclusive student membership',
            price=Decimal('500.00'),
            duration_days=365,
            discount_percentage=Decimal('20.00'),
            is_active=True
        )

        # Create Event
        self.event = Event.objects.create(
            title='Campus Gala Night',
            description='Annual Gala Night',
            category='CULTURAL',
            venue='Main Hall',
            start_datetime=timezone.now() + timedelta(days=5),
            end_datetime=timezone.now() + timedelta(days=5, hours=4),
            capacity=10,
            member_price=Decimal('300.00'),
            non_member_price=Decimal('500.00'),
            registration_open=timezone.now() - timedelta(days=1),
            registration_close=timezone.now() + timedelta(days=4),
            status='PUBLISHED',
            created_by=self.admin_user
        )

        # Create Merchandise Product
        self.product = Product.objects.create(
            name='Skyvent Vintage Hoodie',
            description='Official Hoodie',
            category='APPAREL',
            price=Decimal('1000.00'),
            sku='HOOD-001',
            stock_quantity=5,
            low_stock_threshold=2
        )

    def test_complete_golden_workflow(self):
        # 1. User Registration
        reg_resp = self.client.post('/api/auth/register/', {
            'name': 'Lucas Vance',
            'email': 'lucas@campus.edu',
            'password': 'Password@123',
            'student_id': 'STU-9901',
            'department': 'Computer Science'
        })
        self.assertEqual(reg_resp.status_code, status.HTTP_201_CREATED)
        self.assertFalse(User.objects.get(email='lucas@campus.edu').is_email_verified)

        # 2. OTP Verification (Real OTP generated and hashed)
        otp_rec = OTPVerification.objects.filter(email='lucas@campus.edu', purpose='REGISTER').first()
        self.assertIsNotNone(otp_rec)
        
        # Test invalid OTP
        inv_verify = self.client.post('/api/auth/verify-otp/', {
            'email': 'lucas@campus.edu',
            'otp': '000000',
            'purpose': 'REGISTER'
        })
        self.assertEqual(inv_verify.status_code, status.HTTP_400_BAD_REQUEST)

        # Test valid OTP
        # Simulate knowing the valid OTP by generating a known one
        valid_otp = OTPVerification.generate_otp('lucas@campus.edu', purpose='REGISTER')
        val_verify = self.client.post('/api/auth/verify-otp/', {
            'email': 'lucas@campus.edu',
            'otp': valid_otp,
            'purpose': 'REGISTER'
        })
        self.assertEqual(val_verify.status_code, status.HTTP_200_OK)
        user = User.objects.get(email='lucas@campus.edu')
        self.assertTrue(user.is_email_verified)

        # 3. User Login
        login_resp = self.client.post('/api/auth/login/', {
            'email': 'lucas@campus.edu',
            'password': 'Password@123'
        })
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        token = login_resp.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # 4. Check Non-Member Price on Event
        self.assertFalse(user.has_active_membership)
        event_resp = self.client.get(f'/api/events/{self.event.id}/')
        self.assertEqual(event_resp.data['data']['applicable_price'], 500.0)

        # 5. Purchase Membership Plan
        mem_resp = self.client.post('/api/memberships/', {'plan_id': self.plan.id})
        self.assertEqual(mem_resp.status_code, status.HTTP_201_CREATED)
        user.refresh_from_db()
        self.assertTrue(user.has_active_membership)

        # 6. Check Member Price on Event after Membership (Server calculates ₹300)
        event_resp_after = self.client.get(f'/api/events/{self.event.id}/')
        self.assertEqual(event_resp_after.data['data']['applicable_price'], 300.0)

        # 7. Purchase Ticket with Member Discount
        ticket_resp = self.client.post(f'/api/events/{self.event.id}/tickets/')
        self.assertEqual(ticket_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(ticket_resp.data['data']['price']), 300.0)
        ticket_id = ticket_resp.data['data']['id']
        qr_token = ticket_resp.data['data']['qr_token']
        ticket_no = ticket_resp.data['data']['ticket_number']

        # Verify financial income transaction created
        self.assertTrue(Transaction.objects.filter(category='EVENT_TICKET', reference_id=str(ticket_id)).exists())

        # 8. Duplicate Ticket Purchase Prevention
        dup_resp = self.client.post(f'/api/events/{self.event.id}/tickets/')
        self.assertEqual(dup_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(dup_resp.data['code'], 'DUPLICATE_TICKET')

        # 9. QR Check-In via Volunteer / Staff
        volunteer = User.objects.create_user(
            email='volunteer@campus.edu',
            password='Password@123',
            name='Volunteer Dan',
            role='VOLUNTEER'
        )
        vol_login = self.client.post('/api/auth/login/', {
            'email': 'volunteer@campus.edu',
            'password': 'Password@123'
        })
        vol_token = vol_login.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {vol_token}')

        # Perform valid QR check-in
        checkin_resp = self.client.post('/api/attendance/check-in/', {
            'qr_token': qr_token,
            'event_id': self.event.id,
            'method': 'QR'
        })
        self.assertEqual(checkin_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(Attendance.objects.filter(ticket_id=ticket_id).exists())

        # Test duplicate check-in rejection
        dup_checkin = self.client.post('/api/attendance/check-in/', {
            'qr_token': qr_token,
            'event_id': self.event.id,
            'method': 'QR'
        })
        self.assertEqual(dup_checkin.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(dup_checkin.data['code'], 'ALREADY_CHECKED_IN')

        # 10. Merchandise Order & Inventory Decrease
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        order_resp = self.client.post('/api/orders/', {
            'items': [
                {'product_id': self.product.id, 'quantity': 2, 'size': 'L'}
            ],
            'delivery_notes': 'Deliver to Campus Desk'
        }, format='json')
        self.assertEqual(order_resp.status_code, status.HTTP_201_CREATED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 3) # Decreased from 5 to 3

        # 11. Finance Dashboard Balance Calculation
        admin_login = self.client.post('/api/auth/login/', {
            'email': 'admin@skyvent.demo',
            'password': 'Password@123'
        })
        admin_token = admin_login.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

        fin_resp = self.client.get('/api/finance/summary/')
        self.assertEqual(fin_resp.status_code, status.HTTP_200_OK)
        self.assertGreater(fin_resp.data['data']['total_income'], 0)
        self.assertEqual(fin_resp.data['data']['net_balance'], fin_resp.data['data']['total_income'] - fin_resp.data['data']['total_expenses'])

        # 12. Dynamic NEEDS ATTENTION Engine
        dash_resp = self.client.get('/api/dashboard/admin/')
        self.assertEqual(dash_resp.status_code, status.HTTP_200_OK)
        self.assertIn('needs_attention', dash_resp.data['data'])

    def test_expense_rbac_and_approval_workflow(self):
        # Create normal member, treasurer, and submit expense
        member = User.objects.create_user(
            email='submitter@campus.edu',
            password='Password@123',
            name='Club Volunteer'
        )
        treasurer = User.objects.create_user(
            email='treasurer_test@campus.edu',
            password='Password@123',
            name='Treasurer User',
            role='TREASURER'
        )

        # Login as member and submit expense
        self.client.force_authenticate(user=member)
        exp_resp = self.client.post('/api/expenses/', {
            'title': 'Sound System Rental',
            'amount': '4500.00',
            'category': 'OPERATIONS',
            'description': 'Stage audio setup for welcome orientation'
        })
        self.assertEqual(exp_resp.status_code, status.HTTP_201_CREATED)
        expense_id = exp_resp.data['data']['id']

        # Member tries to approve own expense -> Should be Forbidden (403)
        approve_resp_unauthorized = self.client.patch(f'/api/expenses/{expense_id}/', {
            'status': 'APPROVED'
        })
        self.assertEqual(approve_resp_unauthorized.status_code, status.HTTP_403_FORBIDDEN)

        # Treasurer logs in and approves expense -> Should succeed (200) and create financial transaction
        self.client.force_authenticate(user=treasurer)
        approve_resp = self.client.patch(f'/api/expenses/{expense_id}/', {
            'status': 'APPROVED'
        })
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_resp.data['data']['status'], 'APPROVED')

        # Check expense transaction created in finance ledger
        self.assertTrue(Transaction.objects.filter(transaction_type='EXPENSE', reference_id=str(expense_id)).exists())

    def test_event_capacity_limit_enforcement(self):
        # Create a small capacity event (capacity = 1)
        small_event = Event.objects.create(
            title='VIP Networking Roundtable',
            description='Limited capacity roundtable',
            category='ACADEMIC',
            venue='Conference Room 4B',
            start_datetime=timezone.now() + timedelta(days=2),
            end_datetime=timezone.now() + timedelta(days=2, hours=2),
            capacity=1,
            member_price=Decimal('100.00'),
            non_member_price=Decimal('200.00'),
            registration_open=timezone.now() - timedelta(days=1),
            registration_close=timezone.now() + timedelta(days=1),
            status='PUBLISHED',
            created_by=self.admin_user
        )

        u1 = User.objects.create_user(email='u1@campus.edu', password='Password@123', name='User One')
        u2 = User.objects.create_user(email='u2@campus.edu', password='Password@123', name='User Two')

        # First ticket purchase succeeds
        self.client.force_authenticate(user=u1)
        r1 = self.client.post(f'/api/events/{small_event.id}/tickets/')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        # Second ticket purchase fails because capacity is full
        self.client.force_authenticate(user=u2)
        r2 = self.client.post(f'/api/events/{small_event.id}/tickets/')
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r2.data['code'], 'EVENT_FULL')

