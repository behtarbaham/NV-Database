import type { Student, Teacher, Course, Payment, Expense, Income, Exam, ExamResult } from '../types';
import { formatDisplayDate, generateId, toDateInputValue, toEnglishDigits } from '../utils';
export type ExcelData = { students: Student[]; teachers: Teacher[]; courses: Course[]; payments: Payment[]; expenses: Expense[]; incomes: Income[]; exams: Exam[]; results: ExamResult[] };
export type ImportKind = 'students' | 'payments' | 'expenses' | 'incomes';
export type ImportPlan = { kind: ImportKind; additions: (Student | Payment | Expense | Income)[]; updates: (Student | Payment | Expense | Income)[]; courses: Course[]; skipped: number; errors: string[] };
const normalize = (value: unknown) => String(value ?? '').trim().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').toLocaleLowerCase();
const schemas: Record<string, [string, string][]> = {
 students: [['id','شناسه'],['firstName','نام'],['lastName','تخلص'],['fatherName','نام پدر'],['phone','شماره تماس'],['courseId','شناسه مضمون'],['courseName','مضمون'],['joinDate','تاریخ ثبت‌نام'],['monthlyFee','فیس ماهانه'],['feePaid','مبلغ پرداختی'],['lastPaymentDate','آخرین پرداخت'],['nextPaymentDate','پرداخت بعدی'],['isActive','فعال']],
 payments: [['id','شناسه'],['studentId','شناسه شاگرد'],['studentName','نام شاگرد'],['month','ماه'],['totalAmount','مبلغ کل'],['paidAmount','مبلغ پرداختی'],['remainingAmount','باقی‌مانده'],['paymentDate','تاریخ پرداخت'],['status','وضعیت']],
 expenses: [['id','شناسه'],['title','عنوان'],['category','دسته'],['amount','مبلغ'],['date','تاریخ'],['paidTo','پرداخت به'],['description','توضیحات']],
 incomes: [['id','شناسه'],['title','عنوان'],['source','منبع'],['amount','مبلغ'],['date','تاریخ'],['description','توضیحات']],
 teachers: [['id','شناسه'],['firstName','نام'],['lastName','تخلص'],['specialty','تخصص'],['phone','شماره تماس'],['salary','معاش'],['hireDate','تاریخ استخدام'],['isActive','فعال']],
 courses: [['id','شناسه'],['name','نام مضمون'],['teacherId','شناسه استاد'],['teacherName','نام استاد'],['duration','مدت'],['monthlyFee','فیس ماهانه'],['level','سطح']],
 exams: [['id','شناسه'],['title','عنوان'],['courseId','شناسه مضمون'],['date','تاریخ'],['totalScore','نمره کل'],['studentCount','تعداد شاگردان']],
 results: [['id','شناسه'],['studentId','شناسه شاگرد'],['examId','شناسه امتحان'],['score','نمره'],['grade','درجه'],['description','توضیحات']],
};
export const sheetNames: Record<string,string> = { students:'شاگردان',payments:'پرداخت‌ها',expenses:'مصارف',incomes:'درآمدها',teachers:'استادان',courses:'مضامین',exams:'امتحان‌ها',results:'نمرات' };
const dateFields = new Set(['joinDate','lastPaymentDate','nextPaymentDate','paymentDate','hireDate','date']);
async function workbook() { const module = await import('exceljs'); return new module.default.Workbook(); }
export async function buildExcel(data: ExcelData, template = false) {
 const book = await workbook();
 for (const [kind, columns] of Object.entries(schemas)) {
  const sheet = book.addWorksheet(sheetNames[kind], { views:[{rightToLeft:true,state:'frozen',ySplit:1}] });
  sheet.columns = columns.map(([key,header])=>({ key, header, width: key==='description'?40:22 }));
  if (!template) for (const original of data[kind as keyof ExcelData]) {
   const row:any={...original};
   if ('courseId' in row) row.courseName=data.courses.find(c=>c.id===row.courseId)?.name || '';
   if ('teacherId' in row) { const teacher=data.teachers.find(t=>t.id===row.teacherId);row.teacherName=teacher ? teacher.firstName+' '+teacher.lastName : ''; }
   if ('studentId' in row) { const student=data.students.find(s=>s.id===row.studentId);row.studentName=student ? student.firstName+' '+student.lastName : ''; }
   for(const [key] of columns) { if(dateFields.has(key)) row[key]=row[key] ? formatDisplayDate(row[key]) : ''; if(key==='isActive')row[key]=row[key]?'بله':'خیر'; }
   sheet.addRow(row);
  }
  sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF2563EB'}};
  sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(sheet.rowCount,1),column:columns.length}};
  for(const [index,[key]] of columns.entries())if(key==='phone'||key.endsWith('Id')||key==='id'||dateFields.has(key)) sheet.getColumn(index+1).numFmt='@';
 }
 return book.xlsx.writeBuffer();
}
export function downloadExcel(buffer: ArrayBuffer | Uint8Array, name: string) {
 const blob=new Blob([buffer as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function readExcel(file: File, kind: ImportKind): Promise<Record<string,unknown>[]> {
 if(file.size>10*1024*1024)throw Error('حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.');
 if(!file.name.toLowerCase().endsWith('.xlsx'))throw Error('فایل باید با فرمت xlsx باشد.');
 const book=await workbook();await book.xlsx.load(await file.arrayBuffer());
 const sheet=book.getWorksheet(sheetNames[kind]) || book.worksheets[0];if(!sheet)throw Error('فایل اکسل برگه ندارد.');
 if(sheet.rowCount>5001)throw Error('در هر بار حداکثر ۵۰۰۰ ردیف وارد کنید.');
 const aliases:Record<string,string>={};for(const [key,title]of schemas[kind]){aliases[normalize(key)]=key;aliases[normalize(title)]=key;}
 if(kind==='students')Object.assign(aliases,Object.fromEntries([['اسم','firstName'],['فرزند','fatherName'],['فیس','monthlyFee'],['تاریخ پرداخت','lastPaymentDate']].map(([a,b])=>[normalize(a),b])));
 const headers=new Map<number,string>();sheet.getRow(1).eachCell((cell,index)=>{const key=aliases[normalize(cell.value)];if(key){if([...headers.values()].includes(key))throw Error('ستون تکراری در فایل وجود دارد.');headers.set(index,key);}});
 if(!headers.size)throw Error('ستون‌های فایل شناخته نشد؛ قالب اکسل را دریافت کنید.');
 const rows:Record<string,unknown>[]=[];
 for(let index=2;index<=sheet.rowCount;index++){
  const row:Record<string,unknown>={};let nonempty=false;
  for(const [column,key] of headers){const value=sheet.getRow(index).getCell(column).value;if(value!==null&&value!==undefined&&value!=='')nonempty=true;if(value&&typeof value==='object'&&!(value instanceof Date))throw Error('ردیف '+index+': سلول دارای فرمول، لینک یا ساختار پشتیبانی‌نشده است.');row[key]=value;}
  if(nonempty){row.__row=index;rows.push(row);}
 }
 if(!rows.length)throw Error('فایل ردیف اطلاعات ندارد.');return rows;
}
export function planExcelImport(kind: ImportKind, rows: Record<string,unknown>[], data: ExcelData): ImportPlan {
 const plan:ImportPlan={kind,additions:[],updates:[],courses:[],skipped:0,errors:[]};
 const seenIds=new Set<string>();
 const existingById=new Map<string, Student | Payment | Expense | Income>(data[kind].map(item=>[item.id,item] as const));
 const studentKey=(s:Student)=>[s.firstName,s.lastName,s.fatherName,s.courseId].map(normalize).join('|');
 const students=new Set(data.students.map(studentKey));
 const text=(value:unknown,max=255)=>{const result=String(value??'').trim();if(result.length>max)throw Error('متن بیش از حد طولانی است.');return result;};
 const num=(value:unknown)=>{const raw=toEnglishDigits(text(value)).replace(/[,،\s]/g,'');const n=raw===''?0:Number(raw);if(!Number.isFinite(n)||n<0)throw Error('مبلغ یا عدد نامعتبر است.');return n;};
 const date=(value:unknown)=>{if(!value)return '';if(value instanceof Date)return value.toISOString().slice(0,10);const result=toDateInputValue(toEnglishDigits(text(value)));if(!result)throw Error('تاریخ نامعتبر است؛ تاریخ شمسی را سال/ماه/روز وارد کنید.');return result;};
 const required=(value:unknown)=>{const result=text(value,100);if(!result)throw Error('فیلد الزامی خالی است.');return result;};
 for(const [index,input]of rows.entries())try{
  const id=text(input.id,50);
  if(id && seenIds.has(id)) throw Error("شناسه در فایل تکراری است؛ هر شناسه فقط یک ردیف داشته باشد.");
  if(id) seenIds.add(id);
  const existing=id ? existingById.get(id) : undefined;
  const row:Record<string,unknown>={...existing,...input};
  let record:Student|Payment|Expense|Income;
  if(kind==='students'){
   const firstName=required(row.firstName),lastName=text(row.lastName,100),fatherName=text(row.fatherName,100);
   let courseId=text(row.courseId,50);const name=text(row.courseName,255);
   if(courseId){
    const byId=data.courses.concat(plan.courses).find(c=>c.id===courseId);
    if(byId&&name&&normalize(byId.name)!==normalize(name))throw Error('نام مضمون با شناسه آن مطابقت ندارد.');
    if(!byId){
      if(!name)throw Error('شناسه مضمون موجود نیست.');
      const byName=data.courses.concat(plan.courses).find(c=>normalize(c.name)===normalize(name));
      if(byName)courseId=byName.id;
      else plan.courses.push({id:courseId,name,teacherId:'',duration:'',monthlyFee:0,level:''});
    }
   }
   if(!courseId){if(!name)throw Error('مضمون شاگرد مشخص نشده است.');let course=data.courses.concat(plan.courses).find(c=>normalize(c.name)===normalize(name));if(!course){course={id:generateId('CRS'),name,teacherId:'',duration:'',monthlyFee:0,level:''};plan.courses.push(course);}courseId=course.id;}
   const flag=normalize(row.isActive);if(flag&&!['بله','خیر','فعال','غیرفعال','true','false','1','0'].includes(flag))throw Error('وضعیت فعال نامعتبر است.');
   record={id:id||generateId('STU'),firstName,lastName,fatherName,phone:text(row.phone,50),courseId,joinDate:date(row.joinDate),feePaid:num(row.feePaid),monthlyFee:num(row.monthlyFee),lastPaymentDate:date(row.lastPaymentDate),nextPaymentDate:date(row.nextPaymentDate),isActive:!['خیر','غیرفعال','false','0'].includes(flag)};
   const key=studentKey(record);if(!existing && students.has(key)){plan.skipped++;continue;}students.add(key);
  }else if(kind==='payments'){
   const studentId=required(row.studentId);if(!data.students.some(s=>s.id===studentId))throw Error('شناسه شاگرد موجود نیست.');const totalAmount=num(row.totalAmount),paidAmount=num(row.paidAmount);if(paidAmount>totalAmount)throw Error('پرداخت از مبلغ کل بیشتر است.');const remainingAmount=totalAmount-paidAmount;const paymentDate=date(row.paymentDate);if(!paymentDate)throw Error('تاریخ پرداخت الزامی است.');record={id:id||generateId('PAY'),studentId,month:required(row.month),totalAmount,paidAmount,remainingAmount,paymentDate,status:remainingAmount===0?'completed':paidAmount>0?'partial':'unpaid'};
   if(!existing && data.payments.concat(plan.additions as Payment[]).some(p=>p.studentId===studentId&&p.month===(record as Payment).month&&p.paymentDate===paymentDate&&p.totalAmount===totalAmount&&p.paidAmount===paidAmount)){plan.skipped++;continue;}
  }else{
   const common={id:id||generateId(kind==='expenses'?'EXP':'INC'),title:required(row.title),amount:num(row.amount),date:date(row.date),description:text(row.description,5000)};if(!common.date)throw Error('تاریخ الزامی است.');
   record=kind==='expenses'?{...common,category:required(row.category),paidTo:text(row.paidTo)}:{...common,source:required(row.source)};
   if(!existing && data[kind].concat(plan.additions as any).some((item:any)=>item.title===common.title&&item.date===common.date&&item.amount===common.amount&&item.description===common.description&&(kind==='expenses'?item.category===(record as Expense).category&&item.paidTo===(record as Expense).paidTo:item.source===(record as Income).source))){plan.skipped++;continue;}
  }
  if(existing){
   const changed=Object.entries(record).some(([key,value])=>{
    const previous=(existing as any)[key];
    return value !== (previous ?? (typeof value==='number'?0:typeof value==='boolean'?true:''));
   });
   if(changed) plan.updates.push(record); else plan.skipped++;
  }else plan.additions.push(record);
 }catch(error){plan.errors.push('ردیف '+(input.__row||index+2)+': '+(error instanceof Error?error.message:'اطلاعات نامعتبر'));}
 return plan;
}
