# Rawa Quran Academy

PROJECT NAME: RAWA – رواء

Use the uploaded logo as the official brand identity for the entire platform.

================================================== PROJECT OVERVIEW

Build a complete professional Quran Academy platform called "Rawa - رواء".

This is not a simple Quran learning website.

It is a complete online Quran academy that manages:

Quran memorization

Tajweed correction

Live Quran circles (Halaqas)

Male and female divisions

Teachers

Halaqa Supervisors

General Supervisors

Platform Director

Attendance

Evaluations

Educational events

Livestreams

Parent monitoring

Student progress tracking

The platform must be scalable, secure, multilingual and production-ready.

================================================== ROLE SYSTEM

Create 5 roles:

Student

Teacher

Halaqa Supervisor

General Supervisor

Platform Director

================================================== STUDENT REGISTRATION

Allow only students (or parents) to register.

Collect:

Full Name

Parent Name (optional)

Email

Phone Number

Password

Confirm Password

Gender

Age

Country

City

Quran Level

Preferred Schedule

Quran Level options:

Beginner

Intermediate

Advanced

Gender options:

Male

Female

After registration:

role = student

status = pending_review

Students cannot choose roles.

================================================== DIRECTOR WORKFLOW

The Platform Director reviews applications.

Director can:

Approve student

Reject student

Create halaqas

Assign students

Assign teacher

Assign halaqa supervisor

Transfer students

Manage all users

Manage all settings

================================================== GENDER SEPARATION

Enforce complete separation.

Male students:

Male teachers only

Male supervisors only

Female students:

Female teachers only

Female supervisors only

No mixed halaqas.

================================================== STUDENT DASHBOARD

Student can see:

Assigned halaqa

Teacher

Supervisor

Upcoming sessions

Attendance percentage

Memorization progress

Teacher evaluations

Homework

Announcements

Events

Livestreams

================================================== PARENT DASHBOARD

Allow optional parent access.

Parent can see:

Attendance

Progress

Teacher notes

Homework

Session schedule

================================================== TEACHER DASHBOARD

Teacher focuses on academic work only.

Teacher can:

Listen to students

Correct recitation

Correct Tajweed

Conduct memorization tests

Teach Mutun

Assign homework

Create evaluations

Track learning progress

Teacher cannot:

Manage attendance

Change roles

Manage users

================================================== HALAQA SUPERVISOR DASHBOARD

Supervisor manages organization.

Supervisor can:

Mark attendance

Mark absence

Organize speaking order

Record observations

Assist students technically

Manage session flow

Supervisor cannot:

Evaluate academically

Change roles

================================================== GENERAL SUPERVISOR DASHBOARD

General Supervisor can:

Monitor multiple halaqas

Review attendance

Review teacher performance

Review supervisor performance

Generate reports

Escalate issues

================================================== PLATFORM DIRECTOR DASHBOARD

Director has full access.

Dashboard includes:

Total students

Total teachers

Total supervisors

Active halaqas

Attendance rates

Performance analytics

User management

Halaqa management

Settings

================================================== LIVE HALAQA SYSTEM

Implement live Quran halaqas.

Use Google Meet integration for MVP.

Architecture must support Zoom integration later.

Workflow:

Director creates halaqa.

Assign:

Teacher

Supervisor

Students

Schedule:

Date

Time

Generate secure meeting link.

Students join directly from dashboard.

================================================== LIVE SESSION FEATURES

Teacher Interface:

Listen

Correct Tajweed

Evaluate

Supervisor Interface:

Attendance

Student queue

Notes

Student Interface:

Join session

Raise hand

Participate

Receive evaluation

================================================== EVENTS & LIVESTREAMS

Create a separate section:

Live Events & Courses

Includes:

Workshops

Tajweed Courses

Online Conferences

Monthly Meetings

Seasonal Programs

================================================== ATTENDANCE SYSTEM

Track:

Present

Absent

Late

Generate reports.

Attendance visible to:

Student

Parent

Supervisor

Director

================================================== EVALUATION SYSTEM

Teacher can evaluate:

Tajweed

Memorization

Fluency

Participation

Store notes.

Show progress history.

================================================== MULTI LANGUAGE SYSTEM

Add language switcher.

Languages:

Arabic (default)

French

English

Translate all interface elements.

Store language preference.

Support RTL for Arabic.

================================================== AUTHENTICATION

Implement:

Login

Register

Logout

Remember Me

Forgot Password

Password Reset Email

Email Verification

Only Director can assign roles.

================================================== DATABASE

Use Supabase.

Configure:

Supabase Auth

PostgreSQL

Row Level Security

Supabase Storage

================================================== DATABASE TABLES

Users

id

full_name

email

phone

gender

age

country

city

role

status

created_at

Halaqas

id

name

gender

level

teacher_id

supervisor_id

schedule

status

Student_Halaqas

id

student_id

halaqa_id

Attendance

id

student_id

halaqa_id

date

status

Evaluations

id

student_id

teacher_id

halaqa_id

tajweed_score

memorization_score

notes

Assignments

id

student_id

teacher_id

title

description

due_date

Events

id

title

description

date

meeting_link

Notifications

id

user_id

title

content

is_read

================================================== FILE STORAGE

Use Supabase Storage.

Buckets:

quran-audio

documents

recordings

assignments

student-submissions

================================================== DESIGN SYSTEM

Use uploaded logo as primary branding.

Colors:

Primary: #5E4B7B

Secondary: #8B79A8

Gold: #C7A35C

Background: #F8F6F3

Text: #1F1F29

Secondary Text: #7B7B88

Dark: #2D1E1A

================================================== FONTS

Arabic:

Cairo

Aref Ruqaa

French & English:

Poppins

================================================== UI STYLE

Premium Islamic Academy Design.

Features:

Elegant Islamic geometric patterns

Glassmorphism effects

Soft shadows

Rounded corners

Premium cards

Smooth animations

Luxury dashboard style

Mobile-first responsive design

================================================== LANDING PAGE

Hero Section:

Title:

رحلة قرآنية تجمع بين الإتقان والتزكية

Subtitle:

منصة رواء للحلقات القرآنية الإلكترونية والتصحيح المباشر للتلاوة

Buttons:

ابدأ التسجيل

استكشف الحلقات

Include:

Animated logo

Soft glow effect

Elegant Islamic background

================================================== PAGES

Landing Page

Login

Register

Forgot Password

Student Dashboard

Parent Dashboard

Teacher Dashboard

Halaqa Supervisor Dashboard

General Supervisor Dashboard

Director Dashboard

Halaqa Page

Live Session Page

Attendance Page

Evaluations Page

Events Page

Notifications Page

Settings Page

================================================== FINAL INSTRUCTION

Generate the complete platform from scratch.

Build:

Frontend

Backend

Database

Authentication

Role system

Live halaqa system

Attendance tracking

Evaluation workflows

Language system

Responsive UI

Production-ready architecture

The final result must feel like a world-class Islamic Quran Academy platform.

"Use the uploaded logo exactly as the brand identity and generate a complete design system, database schema, Supabase integration, and all dashboards."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rawa-quran-academy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/26ef3c98-01f9-4b1c-904e-d092007cf793).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
