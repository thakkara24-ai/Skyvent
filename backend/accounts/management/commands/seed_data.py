from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from memberships.models import MembershipPlan, Membership
from finance.models import Payment, Transaction
from notifications.models import Notification

class Command(BaseCommand):
    help = "Seed Member 1 authentication and membership demo data"
    def handle(self,*args,**kwargs):
        User=get_user_model()
        demo=[('member@skyvent.demo','Demo Member','MEMBER'),('president@skyvent.demo','Demo President','PRESIDENT')]
        for email,name,role in demo:
            u=User.objects.filter(email=email).first()
            if not u:
                u=User.objects.create_user(email=email,name=name,password='Skyvent@2026',role=role,is_email_verified=True,student_id='SKY-1001')
            else:
                u.set_password('Skyvent@2026'); u.is_email_verified=True; u.save()
        plan,_=MembershipPlan.objects.get_or_create(name='Student Pro',defaults={'description':'Demo student membership','price':999,'duration_days':365,'benefits':['Member ticket pricing','Merchandise discounts'],'discount_percentage':40})
        u=User.objects.get(email='member@skyvent.demo')
        Membership.objects.get_or_create(user=u,plan=plan,defaults={'start_date':timezone.now().date(),'end_date':timezone.now().date()+timedelta(days=365),'status':'ACTIVE'})
        Notification.objects.get_or_create(user=u,title='Welcome to SKYVENT',defaults={'message':'Your membership workspace is ready.','notification_type':'SYSTEM'})
        self.stdout.write(self.style.SUCCESS('Member 1 demo data ready.'))
