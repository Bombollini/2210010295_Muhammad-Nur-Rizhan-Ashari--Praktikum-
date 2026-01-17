import { Student, Teacher, ClassSession } from './types';

export const APP_NAME = "EduCore";

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    nis: '2023001',
    classId: '10-A',
    email: 'sarah.j@student.edu',
    phone: '081234567890',
    photoUrl: 'https://picsum.photos/200',
    points: 85,
    status: 'Active'
  },
  {
    id: '2',
    name: 'Michael Chen',
    nis: '2023002',
    classId: '10-A',
    email: 'm.chen@student.edu',
    phone: '081234567891',
    photoUrl: 'https://picsum.photos/201',
    points: 92,
    status: 'Active'
  },
  {
    id: '3',
    name: 'Jessica Pratama',
    nis: '2023003',
    classId: '11-B',
    email: 'jess.p@student.edu',
    phone: '081234567892',
    photoUrl: 'https://picsum.photos/202',
    points: 70,
    status: 'Inactive'
  },
  {
    id: '4',
    name: 'David Smith',
    nis: '2023004',
    classId: '12-Science',
    email: 'david.s@student.edu',
    phone: '081234567893',
    photoUrl: 'https://picsum.photos/203',
    points: 65,
    status: 'Active'
  },
  {
    id: '5',
    name: 'Ayu Lestari',
    nis: '2023005',
    classId: '10-A',
    email: 'ayu.l@student.edu',
    phone: '081234567894',
    photoUrl: 'https://picsum.photos/204',
    points: 100,
    status: 'Active'
  }
];

export const MOCK_SCHEDULE: ClassSession[] = [
  { id: '1', subject: 'Mathematics', teacherName: 'Mr. Anderson', room: 'R-101', startTime: '08:00', endTime: '09:30', day: 'Monday' },
  { id: '2', subject: 'Physics', teacherName: 'Mrs. Curie', room: 'Lab-A', startTime: '10:00', endTime: '11:30', day: 'Monday' },
  { id: '3', subject: 'English', teacherName: 'Ms. Rowling', room: 'R-102', startTime: '13:00', endTime: '14:30', day: 'Monday' },
];

export const ATTENDANCE_DATA = [
  { name: 'Mon', present: 95, absent: 5 },
  { name: 'Tue', present: 92, absent: 8 },
  { name: 'Wed', present: 98, absent: 2 },
  { name: 'Thu', present: 90, absent: 10 },
  { name: 'Fri', present: 88, absent: 12 },
];
