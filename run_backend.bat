@echo off
cd backend
python manage.py migrate
python manage.py runserver 8001
