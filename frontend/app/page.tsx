"use client"
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Clock, AlertTriangle, CalendarDays, Send, MessageSquare, BarChart3, Filter } from 'lucide-react';

interface Employee {
  emp_id: string;
  name: string;
  department: string;
  days_present: number;
  days_late: number;
  days_absent: number;
  days_leave: number;
}

export default function EmployeeDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // State สำหรับตั้งค่ากราฟ
  const [chartDept, setChartDept] = useState('All');
  const [chartSort, setChartSort] = useState('default');
  const [chartLimit, setChartLimit] = useState(10);

  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'bot', text: 'สวัสดีครับ มีข้อมูลพนักงานส่วนไหนให้ผมช่วยสรุปไหมครับ?' }
  ]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error(err));
  }, []);

  // สรุปข้อมูล KPI รวม
  const totalEmployees = employees.length;
  const totalLate = employees.reduce((sum, emp) => sum + emp.days_late, 0);
  const totalAbsent = employees.reduce((sum, emp) => sum + emp.days_absent, 0);
  const totalLeave = employees.reduce((sum, emp) => sum + emp.days_leave, 0);

  // ดึงรายชื่อแผนกทั้งหมดแบบไม่ซ้ำ เพื่อนำมาใส่ Dropdown
  const uniqueDepartments = ['All', ...Array.from(new Set(employees.map(emp => emp.department)))];

  // ฟังก์ชันเตรียมข้อมูลสำหรับกราฟ (Filter -> Sort -> Limit)
  const getProcessedChartData = () => {
    let data = [...employees];

    // 1. กรองตามแผนก
    if (chartDept !== 'All') {
      data = data.filter(emp => emp.department === chartDept);
    }

    // 2. จัดเรียงข้อมูล
    if (chartSort === 'late') {
      data.sort((a, b) => b.days_late - a.days_late); // คนมาสายเยอะสุดขึ้นก่อน
    } else if (chartSort === 'absent') {
      data.sort((a, b) => b.days_absent - a.days_absent); // คนขาดงานเยอะสุดขึ้นก่อน
    } else if (chartSort === 'leave') {
      data.sort((a, b) => b.days_leave - a.days_leave); // คนลาเยอะสุดขึ้นก่อน
    }

    // 3. ตัดจำนวนตามที่เลือก
    return data.slice(0, chartLimit);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newLog = [...chatLog, { sender: 'user', text: chatInput }];
    setChatLog(newLog);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput })
      });
      const data = await res.json();
      setChatLog([...newLog, { sender: 'bot', text: data.reply }]);
    } catch (error) {
      setChatLog([...newLog, { sender: 'bot', text: 'ขออภัยครับ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' }]);
    }
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">HR Analytics Dashboard</h1>
            <p className="text-slate-500 mt-1">ภาพรวมข้อมูลและการเข้างานของพนักงานประจำเดือน</p>
          </div>
        </div>

        {/* --- KPI Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={28} /></div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">พนักงานทั้งหมด</h3>
              <p className="text-3xl font-bold text-slate-800">{totalEmployees} <span className="text-base font-normal text-slate-400">คน</span></p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-500 rounded-xl"><Clock size={28} /></div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">มาสายรวม</h3>
              <p className="text-3xl font-bold text-slate-800">{totalLate} <span className="text-base font-normal text-slate-400">วัน</span></p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-red-50 text-red-500 rounded-xl"><AlertTriangle size={28} /></div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">ขาดงานรวม</h3>
              <p className="text-3xl font-bold text-slate-800">{totalAbsent} <span className="text-base font-normal text-slate-400">วัน</span></p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-xl"><CalendarDays size={28} /></div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">ลารวม</h3>
              <p className="text-3xl font-bold text-slate-800">{totalLeave} <span className="text-base font-normal text-slate-400">วัน</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- กราฟ Visualization พร้อมระบบ Filter --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="text-slate-400" size={20} />
                สถิติการขาด ลา มาสาย
              </h3>
              
              {/* Control Panel สำหรับตั้งค่ากราฟ */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Filter size={16} className="text-slate-400" />
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-black"
                  value={chartDept}
                  onChange={(e) => setChartDept(e.target.value)}
                >
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept === 'All' ? 'ทุกแผนก' : `แผนก ${dept}`}</option>
                  ))}
                </select>

                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-black"
                  value={chartSort}
                  onChange={(e) => setChartSort(e.target.value)}
                >
                  <option value="default">เรียงตามรหัส (ปกติ)</option>
                  <option value="late">เรียงคนมาสายมากสุด</option>
                  <option value="absent">เรียงคนขาดงานมากสุด</option>
                  <option value="leave">เรียงคนลามากสุด</option>
                </select>

                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-black"
                  value={chartLimit}
                  onChange={(e) => setChartLimit(Number(e.target.value))}
                >
                  <option value={5}>แสดง 5 คน</option>
                  <option value={10}>แสดง 10 คน</option>
                  <option value={20}>แสดง 20 คน</option>
                  <option value={999}>แสดงทั้งหมด</option>
                </select>
              </div>
            </div>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {/* เปลี่ยนจาก employees.slice เป็นข้อมูลที่ผ่านการประมวลผลแล้ว */}
                <BarChart data={getProcessedChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="days_late" fill="#f59e0b" name="มาสาย" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="days_absent" fill="#ef4444" name="ขาดงาน" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="days_leave" fill="#10b981" name="ลา" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- Chatbot --- */}
          <div className="flex flex-col h-[430px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full"><MessageSquare size={20} /></div>
              <div>
                <h3 className="font-semibold leading-tight">HR Assistant</h3>
                <p className="text-indigo-200 text-xs">Online</p>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
              {chatLog.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] text-sm px-4 py-2.5 rounded-2xl whitespace-pre-wrap ${
                    msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
              <input 
                type="text" 
                className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-black" 
                placeholder="พิมพ์คำถามที่นี่..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex-shrink-0">
                <Send size={18} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- ตารางสรุปข้อมูล --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">รายชื่อพนักงานทั้งหมด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th className="px-6 py-4">แผนก</th>
                  <th className="px-6 py-4 text-center">มาทำงาน (วัน)</th>
                  <th className="px-6 py-4 text-center">มาสาย (วัน)</th>
                  <th className="px-6 py-4 text-center">ขาด (วัน)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.emp_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{emp.emp_id}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{emp.days_present}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`${emp.days_late > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                        {emp.days_late}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`${emp.days_absent > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        {emp.days_absent}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}