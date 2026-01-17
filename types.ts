import React from 'react';

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  classId: string;
  email: string;
  phone: string;
  photoUrl: string;
  points: number; // For achievement/violation system
  status: 'Active' | 'Inactive';
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  email: string;
  phone: string;
  isHomeroom: boolean;
}

export interface ClassSession {
  id: string;
  subject: string;
  teacherName: string;
  room: string;
  startTime: string;
  endTime: string;
  day: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
}

// New Schema Types matching 'master_schema_update.sql'
export interface Kelas {
  id: number;
  nama_kelas: string;
  tingkat: 'X' | 'XI' | 'XII';
  jurusan: string;
}

export interface MataPelajaran {
  id: number;
  nama_mapel: string;
  kode_mapel: string;
  kelas_id: number;
  guru_id?: number;
}

export interface Siswa {
  id: number;
  nama_lengkap: string;
  nis: string;
  kelas_id: number;
  foto?: string;
  status: string;
}

export interface AbsensiRecord {
  id?: number;
  siswa_id: number;
  mapel_id: number;
  tanggal: string; // YYYY-MM-DD
  sesi: number;
  status: 'hadir' | 'sakit' | 'izin' | 'alfa';
  keterangan?: string;
}