from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import secrets

from accounts.models import User
from memberships.models import MembershipPlan, Membership
from events.models import Event
from tickets.models import Ticket
from attendance.models import Attendance
from merchandise.models import Product
from orders.models import Order, OrderItem
from announcements.models import Announcement
from fundraisers.models import Fundraiser, FundraiserTask
from finance.models import Payment, Transaction, Expense
from notifications.models import Notification
from common.models import AuditLog

class Command(BaseCommand):
    help = 'Seeds realistic SKYVENT university organization data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting SKYVENT database seeding..."))
        now = timezone.now()
        today = now.date()

        # ==========================================
        # 1. USERS & DEMO ACCOUNTS
        # ==========================================
        self.stdout.write("Seeding demo and student user accounts...")
        default_pwd = "Skyvent@2026"

        users_data = [
            # Super Admin
            {
                "email": "admin@skyvent.demo",
                "name": "Prof. Arthur Sterling",
                "role": "SUPER_ADMIN",
                "student_id": "FAC-001",
                "department": "Faculty Directorate",
                "is_staff": True,
                "is_superuser": True
            },
            # Merchandise Manager
            {
                "email": "merchandise@skyvent.demo",
                "name": "Elena Rostova",
                "role": "MERCHANDISE",
                "student_id": "STU-2023-0104",
                "department": "Design & Merchandising",
                "is_staff": True
            },
            # Treasurer
            {
                "email": "treasurer@skyvent.demo",
                "name": "Marcus Vance",
                "role": "TREASURER",
                "student_id": "STU-2023-0288",
                "department": "Finance & Accounting",
                "is_staff": True
            },
            # Volunteers
            {
                "email": "volunteer@skyvent.demo",
                "name": "Maya Patel",
                "role": "VOLUNTEER",
                "student_id": "STU-2024-0412",
                "department": "Computer Science & Engineering",
                "is_staff": False
            },
            {
                "email": "volunteer2@skyvent.demo",
                "name": "Liam Gallagher",
                "role": "VOLUNTEER",
                "student_id": "STU-2024-0551",
                "department": "Media & Communications",
                "is_staff": False
            },
            # Primary Demo Member
            {
                "email": "member@skyvent.demo",
                "name": "Lucas Henderson",
                "role": "MEMBER",
                "student_id": "STU-2024-0899",
                "department": "Computer Science",
                "is_staff": False
            },
            # Additional Campus Members
            {
                "email": "elena.rostova@campus.edu",
                "name": "Elena Rostova",
                "role": "MEMBER",
                "student_id": "STU-2023-0341",
                "department": "Biomedical Sciences"
            },
            {
                "email": "aarav.sharma@campus.edu",
                "name": "Aarav Sharma",
                "role": "MEMBER",
                "student_id": "STU-2023-0719",
                "department": "Mechanical Engineering"
            },
            {
                "email": "chloe.dupont@campus.edu",
                "name": "Chloe Dupont",
                "role": "MEMBER",
                "student_id": "STU-2024-0182",
                "department": "Design & Visual Arts"
            },
            {
                "email": "daniel.kim@campus.edu",
                "name": "Daniel Kim",
                "role": "MEMBER",
                "student_id": "STU-2024-0623",
                "department": "Information Systems"
            },
            {
                "email": "sophia.chen@campus.edu",
                "name": "Sophia Chen",
                "role": "MEMBER",
                "student_id": "STU-2023-0944",
                "department": "Architecture & Urban Planning"
            },
            {
                "email": "priya.nair@campus.edu",
                "name": "Priya Nair",
                "role": "MEMBER",
                "student_id": "STU-2024-0377",
                "department": "Economics & Data Analytics"
            },
            {
                "email": "ethan.reynolds@campus.edu",
                "name": "Ethan Reynolds",
                "role": "MEMBER",
                "student_id": "STU-2023-0810",
                "department": "Electrical Engineering"
            },
            {
                "email": "zara.almansoor@campus.edu",
                "name": "Zara Al-Mansoor",
                "role": "MEMBER",
                "student_id": "STU-2024-0732",
                "department": "Law & Public Policy"
            }
        ]

        created_users = {}
        for udata in users_data:
            user, created = User.objects.get_or_create(
                email=udata["email"],
                defaults={
                    "name": udata["name"],
                    "role": udata["role"],
                    "student_id": udata.get("student_id", ""),
                    "department": udata.get("department", ""),
                    "is_email_verified": True,
                    "is_staff": udata.get("is_staff", False),
                    "is_superuser": udata.get("is_superuser", False)
                }
            )
            user.set_password(default_pwd)
            user.is_email_verified = True
            user.save()
            created_users[udata["email"]] = user

        admin_user = created_users["admin@skyvent.demo"]
        merchandise_user = created_users["merchandise@skyvent.demo"]
        treasurer_user = created_users["treasurer@skyvent.demo"]
        volunteer_user = created_users["volunteer@skyvent.demo"]
        demo_member = created_users["member@skyvent.demo"]

        # ==========================================
        # 2. MEMBERSHIP PLANS
        # ==========================================
        self.stdout.write("Seeding membership plans...")
        plan_standard, _ = MembershipPlan.objects.get_or_create(
            name="Standard Student Pass",
            defaults={
                "description": "Essential student membership for active campus involvement and event savings.",
                "price": Decimal("499.00"),
                "duration_days": 365,
                "discount_percentage": Decimal("25.00"),
                "benefits": [
                    "25% discount on all campus events & galas",
                    "Access to members-only workshops & seminars",
                    "Early bird ticket registration 48h in advance",
                    "Voting rights in annual student committee elections"
                ],
                "is_active": True
            }
        )

        plan_scholar, _ = MembershipPlan.objects.get_or_create(
            name="Premium Campus Scholar",
            defaults={
                "description": "All-access premium membership including exclusive merchandise perks and networking galas.",
                "price": Decimal("899.00"),
                "duration_days": 365,
                "discount_percentage": Decimal("40.00"),
                "benefits": [
                    "40% discount on all campus events",
                    "10% discount on official merchandise orders",
                    "VIP front-row seating at keynote festivals",
                    "Exclusive alumni networking dinner access",
                    "Free welcome membership kit & lanyard"
                ],
                "is_active": True
            }
        )

        plan_alumni, _ = MembershipPlan.objects.get_or_create(
            name="Alumni & Supporter Club",
            defaults={
                "description": "For graduating students and alumni supporters fostering university growth and student mentorship.",
                "price": Decimal("1499.00"),
                "duration_days": 365,
                "discount_percentage": Decimal("50.00"),
                "benefits": [
                    "50% discount on flagship events",
                    "Recognition on organization annual report",
                    "Access to guest lectures & mentorship circles",
                    "Annual President's Circle reception invite"
                ],
                "is_active": True
            }
        )

        # Assign active membership to demo_member and several students
        for member_email in ["member@skyvent.demo", "elena.rostova@campus.edu", "aarav.sharma@campus.edu", "chloe.dupont@campus.edu"]:
            u = created_users[member_email]
            if not u.has_active_membership:
                pay = Payment.objects.create(
                    user=u,
                    amount=plan_scholar.price,
                    currency="INR",
                    provider="Demo Payment Provider",
                    reference=f"PAY-MEM-{secrets.token_hex(4).upper()}",
                    status="SUCCESS"
                )
                Membership.objects.create(
                    user=u,
                    plan=plan_scholar,
                    start_date=today - timedelta(days=30),
                    end_date=today + timedelta(days=335),
                    status="ACTIVE",
                    payment=pay
                )
                Transaction.objects.create(
                    transaction_type="INCOME",
                    category="MEMBERSHIP",
                    amount=plan_scholar.price,
                    description=f"Membership: {plan_scholar.name} - {u.name}",
                    reference_type="MEMBERSHIP",
                    created_by=u
                )

        # Seed 2 memberships expiring within 7 days (to trigger NEEDS ATTENTION engine dynamically)
        for member_email in ["daniel.kim@campus.edu", "sophia.chen@campus.edu"]:
            u = created_users[member_email]
            Membership.objects.get_or_create(
                user=u,
                plan=plan_standard,
                defaults={
                    "start_date": today - timedelta(days=360),
                    "end_date": today + timedelta(days=5),
                    "status": "ACTIVE"
                }
            )

        # ==========================================
        # 3. EVENTS
        # ==========================================
        self.stdout.write("Seeding campus events...")
        events_info = [
            {
                "title": "Spring Grand Campus Gala 2026",
                "description": "The premier cultural celebration of the academic year featuring live orchestral performances, student theater, dinner banquet, and awards ceremonies.",
                "category": "CULTURAL",
                "venue": "Grand University Auditorium & Lawn",
                "start_datetime": now + timedelta(days=12, hours=4),
                "end_datetime": now + timedelta(days=12, hours=9),
                "capacity": 250,
                "member_price": Decimal("300.00"),
                "non_member_price": Decimal("500.00"),
                "registration_open": now - timedelta(days=10),
                "registration_close": now + timedelta(days=11),
                "status": "PUBLISHED",
                "cover_image": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
            },
            {
                "title": "TechSprint Hackathon 2026",
                "description": "36-hour intense hackathon bringing together programmers, designers, and innovators to solve pressing university and sustainability challenges.",
                "category": "TECHNICAL",
                "venue": "Engineering Innovation Center, Hall A",
                "start_datetime": now + timedelta(days=18, hours=2),
                "end_datetime": now + timedelta(days=20, hours=4),
                "capacity": 80,
                "member_price": Decimal("0.00"),
                "non_member_price": Decimal("250.00"),
                "registration_open": now - timedelta(days=7),
                "registration_close": now + timedelta(days=16),
                "status": "PUBLISHED",
                "cover_image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80"
            },
            {
                "title": "Design Systems & UI/UX Masterclass",
                "description": "An interactive, hands-on workshop on crafting human-centric design tokens, accessibility, and modern interactive web experiences.",
                "category": "WORKSHOP",
                "venue": "Design Media Lab, Studio 3",
                "start_datetime": now + timedelta(days=5, hours=3),
                "end_datetime": now + timedelta(days=5, hours=6),
                "capacity": 40,
                "member_price": Decimal("150.00"),
                "non_member_price": Decimal("350.00"),
                "registration_open": now - timedelta(days=5),
                "registration_close": now + timedelta(days=4),
                "status": "PUBLISHED",
                "cover_image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80"
            },
            {
                "title": "Campus Music & Acoustic Festival",
                "description": "An outdoor evening of acoustic music, local student indie bands, food trucks, and vibrant student community bonding.",
                "category": "SOCIAL",
                "venue": "North Quad Lawn Amphitheater",
                "start_datetime": now + timedelta(days=25, hours=5),
                "end_datetime": now + timedelta(days=25, hours=10),
                "capacity": 300,
                "member_price": Decimal("200.00"),
                "non_member_price": Decimal("400.00"),
                "registration_open": now - timedelta(days=2),
                "registration_close": now + timedelta(days=24),
                "status": "PUBLISHED",
                "cover_image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80"
            },
            {
                "title": "Alumni Leadership & Career Forum",
                "description": "Direct networking and panel discussions with distinguished university alumni in tech, finance, diplomacy, and entrepreneurship.",
                "category": "CAREER",
                "venue": "Alumni Memorial Hall",
                "start_datetime": now + timedelta(days=32, hours=3),
                "end_datetime": now + timedelta(days=32, hours=7),
                "capacity": 100,
                "member_price": Decimal("100.00"),
                "non_member_price": Decimal("300.00"),
                "registration_open": now - timedelta(days=1),
                "registration_close": now + timedelta(days=30),
                "status": "PUBLISHED",
                "cover_image": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80"
            }
        ]

        created_events = []
        for edata in events_info:
            evt, _ = Event.objects.get_or_create(
                title=edata["title"],
                defaults={**edata, "created_by": admin_user}
            )
            created_events.append(evt)

        gala_event = created_events[0]
        hackathon_event = created_events[1]
        workshop_event = created_events[2]

        # ==========================================
        # 4. TICKETS & ATTENDANCE SEEDING
        # ==========================================
        self.stdout.write("Seeding tickets and check-in records...")
        # Create tickets for students for Gala and Masterclass
        sample_attendees = [
            ("elena.rostova@campus.edu", True, True),
            ("aarav.sharma@campus.edu", True, True),
            ("chloe.dupont@campus.edu", True, False),
            ("priya.nair@campus.edu", False, False),
            ("ethan.reynolds@campus.edu", False, False)
        ]

        for email, is_member, check_in in sample_attendees:
            u = created_users[email]
            price = gala_event.member_price if is_member else gala_event.non_member_price
            
            if not Ticket.objects.filter(event=gala_event, user=u).exists():
                pay = Payment.objects.create(
                    user=u,
                    amount=price,
                    currency="INR",
                    provider="Demo Payment Provider",
                    reference=f"PAY-GALA-{secrets.token_hex(4).upper()}",
                    status="SUCCESS"
                )
                ticket_no = Ticket.generate_ticket_number(gala_event.id)
                qr_token = Ticket.generate_qr_token()
                t = Ticket.objects.create(
                    ticket_number=ticket_no,
                    event=gala_event,
                    user=u,
                    ticket_type="MEMBER" if is_member else "NON_MEMBER",
                    price=price,
                    payment=pay,
                    qr_token=qr_token,
                    status="USED" if check_in else "CONFIRMED"
                )
                Transaction.objects.create(
                    transaction_type="INCOME",
                    category="EVENT_TICKET",
                    amount=price,
                    description=f"Ticket #{t.ticket_number} - {gala_event.title} ({u.name})",
                    reference_type="EVENT_TICKET",
                    reference_id=str(t.id),
                    created_by=u
                )
                if check_in:
                    Attendance.objects.create(
                        event=gala_event,
                        ticket=t,
                        user=u,
                        checked_in_by=volunteer_user,
                        method="QR"
                    )

        # Seed 34 tickets for the Workshop (capacity 40 -> 34 sold = 85% full to trigger NEEDS ATTENTION engine!)
        for i in range(1, 35):
            fake_email = f"workshop.student{i}@campus.edu"
            u_fake, _ = User.objects.get_or_create(
                email=fake_email,
                defaults={"name": f"Workshop Participant {i}", "department": "Design", "is_email_verified": True}
            )
            if not Ticket.objects.filter(event=workshop_event, user=u_fake).exists():
                Ticket.objects.create(
                    ticket_number=f"SKY-EVT-2026-WK-{i:03d}",
                    event=workshop_event,
                    user=u_fake,
                    ticket_type="MEMBER",
                    price=workshop_event.member_price,
                    qr_token=f"SKY_QR_WS_{i:03d}_{secrets.token_hex(8)}",
                    status="CONFIRMED"
                )

        # ==========================================
        # 5. MERCHANDISE PRODUCTS
        # ==========================================
        self.stdout.write("Seeding merchandise catalog...")
        merch_data = [
            {
                "name": "SKYVENT Official Heavyweight Hoodie",
                "description": "Premium 380 GSM fleece hoodie with embroidered campus crest and signature coffee-brown drawstring accents.",
                "category": "APPAREL",
                "price": Decimal("1199.00"),
                "sku": "SKY-HOOD-01",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "stock_quantity": 8, # Low stock trigger!
                "low_stock_threshold": 10,
                "image": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Campus Classic Club T-Shirt",
                "description": "100% organic combed cotton t-shirt with screen-printed organization typography on sand background.",
                "category": "APPAREL",
                "price": Decimal("499.00"),
                "sku": "SKY-TEE-01",
                "sizes": ["S", "M", "L", "XL"],
                "stock_quantity": 42,
                "low_stock_threshold": 10,
                "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Heritage Corduroy Strapback Cap",
                "description": "Unstructured 6-panel corduroy cap with brass buckle and subtle tonal crest embroidery.",
                "category": "ACCESSORIES",
                "price": Decimal("349.00"),
                "sku": "SKY-CAP-01",
                "sizes": ["Adjustable Strap"],
                "stock_quantity": 28,
                "low_stock_threshold": 8,
                "image": "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Minimalist Hardcover Campus Journal",
                "description": "A5 dot-grid hardcover notebook with ink-proof 120 GSM paper, elastic band, and bookmark ribbon.",
                "category": "STATIONERY",
                "price": Decimal("249.00"),
                "sku": "SKY-BOOK-01",
                "sizes": ["A5 Hardcover", "B5 Spiral"],
                "stock_quantity": 60,
                "low_stock_threshold": 10,
                "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Stainless Steel Thermal Travel Tumbler",
                "description": "Double-wall vacuum insulated 750ml bottle keeping beverages cold for 24h or warm for 12h.",
                "category": "ACCESSORIES",
                "price": Decimal("599.00"),
                "sku": "SKY-BTL-01",
                "sizes": ["500 ml", "750 ml"],
                "stock_quantity": 24,
                "low_stock_threshold": 8,
                "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Enamel Crest Pin & Matte Sticker Pack",
                "description": "Die-struck gold enamel lapel pin with durable clutch and 5 waterproof matte vinyl stickers.",
                "category": "COLLECTIBLES",
                "price": Decimal("149.00"),
                "sku": "SKY-PIN-01",
                "sizes": ["Standard Pack", "Deluxe Pack"],
                "stock_quantity": 85,
                "low_stock_threshold": 15,
                "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
            }
        ]

        created_products = []
        for mdata in merch_data:
            p, _ = Product.objects.get_or_create(sku=mdata["sku"], defaults=mdata)
            created_products.append(p)

        # ==========================================
        # 6. ANNOUNCEMENTS
        # ==========================================
        self.stdout.write("Seeding campus announcements...")
        announcements_data = [
            {
                "title": "Welcome to Academic Year 2026-2027!",
                "content": "A warm welcome to all new and returning students. SKYVENT has launched our unified student portal. Explore upcoming events, activate your student membership, and check out new official club merchandise.",
                "audience": "ALL",
                "priority": "HIGH"
            },
            {
                "title": "Annual Gala Early-Bird Member Passes Active",
                "content": "All registered members can now claim discounted Gala tickets at ₹300 (standard price ₹500). Please secure your spots early before capacity fills.",
                "audience": "MEMBERS",
                "priority": "MEDIUM"
            },
            {
                "title": "Volunteer Briefing for Spring Gala Check-In",
                "content": "All event check-in volunteers are requested to attend the quick briefing this Thursday at 4 PM in Auditorium Room 102. Familiarize yourselves with the digital QR scanning desk.",
                "audience": "VOLUNTEERS",
                "priority": "HIGH"
            },
            {
                "title": "Quarterly Budget & Expense Filing Deadline",
                "content": "Treasurers and sub-committee heads must submit all pending expense receipts for Q1 operations before the 25th of this month for auditing.",
                "audience": "TREASURERS",
                "priority": "MEDIUM"
            },
            {
                "title": "Design Systems Workshop Seats Nearly Full",
                "content": "Over 85% of seats for the UI/UX Masterclass have been booked. Only 6 seats remain. Register today to secure your participant badge.",
                "audience": "ALL",
                "priority": "LOW"
            }
        ]

        for adata in announcements_data:
            Announcement.objects.get_or_create(
                title=adata["title"],
                defaults={**adata, "created_by": admin_user}
            )

        # ==========================================
        # 7. FUNDRAISERS & TASKS
        # ==========================================
        self.stdout.write("Seeding fundraisers and volunteer task board...")
        fr1, _ = Fundraiser.objects.get_or_create(
            title="Campus Innovation & Maker Lab Fund",
            defaults={
                "description": "Crowdfunding campaign to purchase high-precision 3D printers, VR testing kits, and robotics prototyping tools for student-led projects.",
                "goal_amount": Decimal("100000.00"),
                "raised_amount": Decimal("64500.00"),
                "start_date": today - timedelta(days=20),
                "end_date": today + timedelta(days=40),
                "status": "ACTIVE",
                "created_by": treasurer_user
            }
        )

        fr2, _ = Fundraiser.objects.get_or_create(
            title="Student Emergency Aid & Book Grant",
            defaults={
                "description": "Providing rapid relief micro-grants for textbooks, laboratory supplies, and unexpected emergencies for deserving students.",
                "goal_amount": Decimal("50000.00"),
                "raised_amount": Decimal("38000.00"),
                "start_date": today - timedelta(days=15),
                "end_date": today + timedelta(days=15),
                "status": "ACTIVE",
                "created_by": treasurer_user
            }
        )

        # Seed Tasks
        tasks_data = [
            {
                "fundraiser": fr1,
                "title": "Corporate Sponsor Outreach & Pitch Deck",
                "description": "Finalize the sponsorship deck and send email proposals to alumni tech companies.",
                "assignee": volunteer_user,
                "status": "IN_PROGRESS",
                "priority": "HIGH",
                "due_date": today + timedelta(days=4),
                "progress": 65
            },
            {
                "fundraiser": fr1,
                "title": "Restock Heavyweight Hoodies & Store Inventory",
                "description": "Review winter hoodie inventory levels and place replenishment order with embroidery vendor.",
                "assignee": merchandise_user,
                "status": "IN_PROGRESS",
                "priority": "HIGH",
                "due_date": today + timedelta(days=3),
                "progress": 50
            },
            {
                "fundraiser": fr1,
                "title": "Social Media Campaign & Video Showcase",
                "description": "Film 60-second video testimonials of students explaining project prototypes.",
                "assignee": created_users["volunteer2@skyvent.demo"],
                "status": "TODO",
                "priority": "MEDIUM",
                "due_date": today + timedelta(days=8),
                "progress": 10
            },
            {
                "fundraiser": fr1,
                "title": "Maker Lab Vendor Quotations",
                "description": "Collect 3 comparable quotes for resin 3D printers and soldering stations.",
                "assignee": treasurer_user,
                "status": "COMPLETED",
                "priority": "HIGH",
                "due_date": today - timedelta(days=3),
                "progress": 100
            },
            {
                "fundraiser": fr1,
                "title": "Alumni Donation Portal Testing",
                "description": "Verify reconciliation of digital donation transactions with treasurer accounts.",
                "assignee": volunteer_user,
                "status": "TODO",
                "priority": "URGENT",
                "due_date": today - timedelta(days=2), # Overdue task for NEEDS ATTENTION demonstration!
                "progress": 20
            }
        ]

        for tdata in tasks_data:
            FundraiserTask.objects.get_or_create(
                fundraiser=tdata["fundraiser"],
                title=tdata["title"],
                defaults=tdata
            )

        # ==========================================
        # 8. EXPENSES & FINANCIAL TRANSACTIONS
        # ==========================================
        self.stdout.write("Seeding expenses, reimbursements, and financial records...")
        expenses_data = [
            {
                "title": "Auditorium Acoustic Setup & Stage Lighting",
                "amount": Decimal("12500.00"),
                "category": "OPERATIONS",
                "description": "Audio console rental, stage spotlights, and microphone sets for Spring Gala.",
                "submitted_by": volunteer_user,
                "approved_by": treasurer_user,
                "status": "PAID"
            },
            {
                "title": "Volunteer Refreshments & Gala Printing",
                "amount": Decimal("3200.00"),
                "category": "REIMBURSEMENT",
                "description": "Laminated volunteer lanyards, stage posters, and snack boxes for crew during rehearsals.",
                "submitted_by": volunteer_user,
                "approved_by": None,
                "status": "PENDING" # Pending reimbursement to show in NEEDS ATTENTION
            },
            {
                "title": "TechSprint Hackathon Pizza Catering",
                "amount": Decimal("6800.00"),
                "category": "CATERING",
                "description": "Midnight meal and energy drinks for 80 hackathon participants.",
                "submitted_by": created_users["volunteer2@skyvent.demo"],
                "approved_by": None,
                "status": "PENDING" # Another pending claim
            },
            {
                "title": "Campus Promotional Banners & Quad Stands",
                "amount": Decimal("2400.00"),
                "category": "MARKETING",
                "description": "Eco-friendly fabric banners for quad noticeboards.",
                "submitted_by": volunteer_user,
                "approved_by": treasurer_user,
                "status": "PAID"
            }
        ]

        for edata in expenses_data:
            exp, _ = Expense.objects.get_or_create(
                title=edata["title"],
                defaults=edata
            )
            if exp.status == 'PAID':
                Transaction.objects.get_or_create(
                    reference_type="EXPENSE",
                    reference_id=str(exp.id),
                    defaults={
                        "transaction_type": "EXPENSE",
                        "category": exp.category,
                        "amount": exp.amount,
                        "description": f"Paid Expense: {exp.title}",
                        "created_by": treasurer_user
                    }
                )

        # Record general donations and income
        Transaction.objects.get_or_create(
            description="Innovation Lab Campaign Alumni Donations Batch 1",
            defaults={
                "transaction_type": "INCOME",
                "category": "FUNDRAISER",
                "amount": Decimal("64500.00"),
                "reference_type": "FUNDRAISER",
                "created_by": treasurer_user
            }
        )

        # ==========================================
        # 9. AUDIT LOGS
        # ==========================================
        AuditLog.objects.create(
            user=admin_user,
            action="SYSTEM_INITIALIZED",
            entity="System",
            entity_id="1",
            metadata={"version": "1.0.0", "build": "production"}
        )

        AuditLog.objects.create(
            user=admin_user,
            action="EVENT_PUBLISHED",
            entity="Event",
            entity_id=str(gala_event.id),
            metadata={"title": gala_event.title}
        )

        self.stdout.write(self.style.SUCCESS("[SUCCESS] SKYVENT seed data created successfully!"))
        self.stdout.write(self.style.SUCCESS(
            "\nDemo Accounts Available:\n"
            "* Super Admin : admin@skyvent.demo / Skyvent@2026\n"
            "* Merchandise : merchandise@skyvent.demo / Skyvent@2026\n"
            "* Treasurer   : treasurer@skyvent.demo / Skyvent@2026\n"
            "* Volunteer   : volunteer@skyvent.demo / Skyvent@2026\n"
            "* Member      : member@skyvent.demo / Skyvent@2026\n"
        ))
