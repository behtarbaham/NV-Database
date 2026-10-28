
import { AppError } from './errors.js';
const fail = (message) => { throw new AppError(message, 400, 'INVALID_TIMETABLE'); };
const text = (value, max = 50) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail('اطلاعات اتاق یا تقسیم اوقات درست نیست.');
  return value.trim();
};
const uniqueIds = (items) => {
  if (new Set(items.map((item) => item.id)).size !== items.length) fail('شناسهٔ تکراری در تقسیم اوقات یا اتاق‌ها وجود دارد.');
};
export function normalizeScheduling(input) {
  if (!Array.isArray(input.rooms) || !Array.isArray(input.timetable)) fail('فهرست اتاق‌ها و تقسیم اوقات درست نیست.');
  const rooms = input.rooms.map((room) => ({ id: text(room.id), name: text(room.name, 100) }));
  uniqueIds(rooms);
  if (new Set(rooms.map((room) => room.name.toLocaleLowerCase())).size !== rooms.length) fail('نام اتاق درسی تکراری است.');
  const timetable = input.timetable.map((entry) => {
    const result = { id: text(entry.id), teacherId: text(entry.teacherId), courseId: text(entry.courseId), roomId: text(entry.roomId), startTime: text(entry.startTime), endTime: text(entry.endTime) };
    if (![result.startTime, result.endTime].every((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) || result.startTime >= result.endTime) fail('تایم ختم باید بعد از تایم شروع باشد.');
    if (!input.teachers.some((teacher) => teacher.id === result.teacherId) || !input.courses.some((course) => course.id === result.courseId) || !rooms.some((room) => room.id === result.roomId)) fail('استاد، مضمون یا اتاق انتخاب‌شده موجود نیست.');
    return result;
  });
  uniqueIds(timetable);
  for (let i = 0; i < timetable.length; i++) {
    for (let j = i + 1; j < timetable.length; j++) {
      const a = timetable[i], b = timetable[j];
      if (a.startTime < b.endTime && b.startTime < a.endTime && (a.roomId === b.roomId || a.teacherId === b.teacherId)) fail('تایم درسی با برنامهٔ دیگر این استاد یا اتاق تداخل دارد.');
    }
  }
  return { rooms, timetable };
}
