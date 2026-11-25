import React, { useState, useEffect } from 'react';
import { SemesterPlan, User } from '../types';
import { api } from '../services/api';
import {
  GraduationCap,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface SemesterPlannerViewProps {
  user: User;
}

export const SemesterPlannerView: React.FC<SemesterPlannerViewProps> = ({ user }) => {
  const [plans, setPlans] = useState<SemesterPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<SemesterPlan | null>(null);

  // Form edit state
  const [formData, setFormData] = useState({
    semester_name: 'Fall 2026 Semester',
    start_date: '2026-09-01',
    end_date: '2027-01-31',
    expected_monthly_allowance: '25000',
    scholarship_salary: '15000',
    tuition_exam_fee: '75000',
    hostel_rent: '42500',
    food_transport_est: '55000',
    books_materials: '12000',
    other_expenses: '8000',
    notes: 'Aiming for 15% end-of-semester emergency reserve.',
  });

  // Interactive Scenario Simulator state
  const [allowanceAdjustment, setAllowanceAdjustment] = useState<number>(0); // e.g. -20% or +10%
  const [emergencyShock, setEmergencyShock] = useState<number>(0); // e.g. Rs 15,000
  const [freelanceBoost, setFreelanceBoost] = useState<number>(0); // e.g. Rs 10,000

  const currency = user.currency || 'PKR';
  const formatMoney = (amt: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.getSemesterPlans();
      setPlans(res.data);
      if (res.data.length > 0) {
        setActivePlan(res.data[0]);
        setFormData({
          semester_name: res.data[0].semester_name,
          start_date: res.data[0].start_date,
          end_date: res.data[0].end_date,
          expected_monthly_allowance: String(res.data[0].expected_monthly_allowance),
          scholarship_salary: String(res.data[0].scholarship_salary),
          tuition_exam_fee: String(res.data[0].tuition_exam_fee),
          hostel_rent: String(res.data[0].hostel_rent),
          food_transport_est: String(res.data[0].food_transport_est),
          books_materials: String(res.data[0].books_materials),
          other_expenses: String(res.data[0].other_expenses),
          notes: res.data[0].notes || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load semester plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Compute calculated metrics
  const start = new Date(formData.start_date || '2026-09-01');
  const end = new Date(formData.end_date || '2027-01-31');
  const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalMonths = Math.max(1, Math.round(diffDays / 30));
  const totalWeeks = Math.max(1, Math.round(diffDays / 7));

  const monthlyAllowance = Number(formData.expected_monthly_allowance) || 0;
  const scholarship = Number(formData.scholarship_salary) || 0;

  // Base income & expenses
  const baseIncome = monthlyAllowance * totalMonths + scholarship;
  const baseExpenses =
    Number(formData.tuition_exam_fee || 0) +
    Number(formData.hostel_rent || 0) +
    Number(formData.food_transport_est || 0) +
    Number(formData.books_materials || 0) +
    Number(formData.other_expenses || 0);

  // Simulated adjustments
  const adjustedMonthlyAllowance = monthlyAllowance * (1 + allowanceAdjustment / 100);
  const simulatedTotalIncome = adjustedMonthlyAllowance * totalMonths + scholarship + freelanceBoost;
  const simulatedTotalExpenses = baseExpenses + emergencyShock;
  const simulatedNet = simulatedTotalIncome - simulatedTotalExpenses;
  const simulatedWeeklyAllowance = Math.round(
    Math.max(
      0,
      (simulatedTotalIncome - Number(formData.tuition_exam_fee || 0) - Number(formData.hostel_rent || 0)) /
        totalWeeks
    )
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<SemesterPlan> = {
        semester_name: formData.semester_name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        expected_monthly_allowance: Number(formData.expected_monthly_allowance),
        scholarship_salary: Number(formData.scholarship_salary),
        tuition_exam_fee: Number(formData.tuition_exam_fee),
        hostel_rent: Number(formData.hostel_rent),
        food_transport_est: Number(formData.food_transport_est),
        books_materials: Number(formData.books_materials),
        other_expenses: Number(formData.other_expenses),
        notes: formData.notes,
      };

      if (activePlan) {
        await api.saveSemesterPlan({ ...payload, id: activePlan.id });
      } else {
        await api.saveSemesterPlan(payload);
      }
      alert('Semester survival plan saved successfully!');
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to save semester plan');
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Student Budget Manager Pro', 20, 20);
    doc.setFontSize(14);
    doc.text(`Semester Survival Plan: ${formData.semester_name}`, 20, 30);
    doc.setFontSize(10);
    doc.text(`Student: ${user.name} (${user.university})`, 20, 38);
    doc.text(`Timeline: ${formData.start_date} to ${formData.end_date} (${totalMonths} months / ${totalWeeks} weeks)`, 20, 44);

    doc.line(20, 48, 190, 48);

    doc.setFontSize(12);
    doc.text('Projected Income Breakdown', 20, 58);
    doc.setFontSize(10);
    doc.text(`Expected Monthly Allowance: ${formatMoney(monthlyAllowance)}/mo (Total: ${formatMoney(monthlyAllowance * totalMonths)})`, 25, 66);
    doc.text(`Scholarship / Salary: ${formatMoney(scholarship)}`, 25, 72);
    doc.text(`Total Semester Inflows: ${formatMoney(baseIncome)}`, 25, 78);

    doc.setFontSize(12);
    doc.text('Projected Expense Commitments', 20, 92);
    doc.setFontSize(10);
    doc.text(`Tuition & Examination Fees: ${formatMoney(Number(formData.tuition_exam_fee))}`, 25, 100);
    doc.text(`Hostel / Room Rent: ${formatMoney(Number(formData.hostel_rent))}`, 25, 106);
    doc.text(`Food & Transport Estimate: ${formatMoney(Number(formData.food_transport_est))}`, 25, 112);
    doc.text(`Books & Materials: ${formatMoney(Number(formData.books_materials))}`, 25, 118);
    doc.text(`Other Outflows: ${formatMoney(Number(formData.other_expenses))}`, 25, 124);
    doc.text(`Total Semester Expenses: ${formatMoney(baseExpenses)}`, 25, 130);

    doc.line(20, 136, 190, 136);
    doc.setFontSize(12);
    doc.text(`Projected Net Margin: ${formatMoney(baseIncome - baseExpenses)}`, 20, 146);
    doc.text(`Weekly Safe Spending Allowance: ${formatMoney(simulatedWeeklyAllowance)}/week`, 20, 154);
    doc.text(`Daily Burn Rate: ${formatMoney(baseExpenses / diffDays)}/day`, 20, 162);

    doc.setFontSize(8);
    doc.text('Generated via PaisaTrack AI — Smart Personal & Business Wealth Platform.', 20, 270);
    doc.save(`wealth_target_plan_${formData.semester_name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Target & Goals Planner
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Forecast your monthly & quarterly income, business runway, fixed expenses, and emergency reserve goals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Plan (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main KPI Snapshot for Semester */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Semester Inflow</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {formatMoney(simulatedTotalIncome)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {totalMonths} months duration
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Fixed & Est. Outflow</span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            {formatMoney(simulatedTotalExpenses)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Tuition, mess, rent & books
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Projected Margin</span>
          <div
            className={`text-2xl font-extrabold mt-1 ${
              simulatedNet >= 0 ? 'text-indigo-950' : 'text-rose-600'
            }`}
          >
            {simulatedNet >= 0 ? '+' : ''}
            {formatMoney(simulatedNet)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {simulatedNet >= 0 ? 'Available for savings' : 'High deficit risk!'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200/80 shadow-xs">
          <span className="text-xs font-bold text-indigo-900">Safe Weekly Allowance</span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            {formatMoney(simulatedWeeklyAllowance)}
          </div>
          <span className="text-[11px] text-indigo-700 font-medium block mt-0.5">
            After paying fees & rent
          </span>
        </div>
      </div>

      {/* Two Column Layout: Setup Form & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Semester Configuration Form (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Semester Financial Parameters</h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semester Name</label>
                <input
                  type="text"
                  required
                  value={formData.semester_name}
                  onChange={(e) => setFormData({ ...formData, semester_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-900 block mb-2">Expected Inflows</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Expected Monthly Allowance ({currency})
                  </label>
                  <input
                    type="number"
                    value={formData.expected_monthly_allowance}
                    onChange={(e) =>
                      setFormData({ ...formData, expected_monthly_allowance: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Scholarship / Salary Lump Sum ({currency})
                  </label>
                  <input
                    type="number"
                    value={formData.scholarship_salary}
                    onChange={(e) =>
                      setFormData({ ...formData, scholarship_salary: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-900 block mb-2">
                Fixed & Estimated Outflows
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Tuition & Exam Fees ({currency})
                  </label>
                  <input
                    type="number"
                    value={formData.tuition_exam_fee}
                    onChange={(e) =>
                      setFormData({ ...formData, tuition_exam_fee: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Hostel & Rent for Entire Semester ({currency})
                  </label>
                  <input
                    type="number"
                    value={formData.hostel_rent}
                    onChange={(e) => setFormData({ ...formData, hostel_rent: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Food & Transport Total Est. ({currency})
                  </label>
                  <input
                    type="number"
                    value={formData.food_transport_est}
                    onChange={(e) =>
                      setFormData({ ...formData, food_transport_est: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Books, Stationery & Project Prints ({currency})
                  </label>
                  <input
                    type="number"
                    value={formData.books_materials}
                    onChange={(e) =>
                      setFormData({ ...formData, books_materials: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-3 text-xs font-bold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              Update Semester Baseline
            </button>
          </form>
        </div>

        {/* Interactive Simulation Sandbox (1 col) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Stress Test Scenarios</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Simulate shocks before they occur: What if your allowance drops or an unexpected repair happens?
            </p>

            <div className="space-y-4">
              {/* Scenario 1: Allowance cut */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Allowance Adjustment:</span>
                  <span className={allowanceAdjustment < 0 ? 'text-rose-600' : 'text-slate-700'}>
                    {allowanceAdjustment}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={allowanceAdjustment}
                  onChange={(e) => setAllowanceAdjustment(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>-50% Cut</span>
                  <span>Baseline</span>
                  <span>+50% Hike</span>
                </div>
              </div>

              {/* Scenario 2: Emergency shock */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Emergency Shock (Laptop / Medical):</span>
                  <span className="text-rose-600">{formatMoney(emergencyShock)}</span>
                </div>
                <div className="flex gap-2">
                  {[0, 8000, 15000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setEmergencyShock(amt)}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                        emergencyShock === amt
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {amt === 0 ? 'None' : formatMoney(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scenario 3: Freelance boost */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Extra Freelance / Tutoring Income:</span>
                  <span className="text-emerald-600">{formatMoney(freelanceBoost)}</span>
                </div>
                <div className="flex gap-2">
                  {[0, 10000, 20000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFreelanceBoost(amt)}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                        freelanceBoost === amt
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {amt === 0 ? 'None' : formatMoney(amt)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Outcome card */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="font-bold text-slate-900">Scenario Outcome:</div>
            <div className="flex justify-between">
              <span className="text-slate-500">Weekly Safe Spending:</span>
              <span className="font-bold text-indigo-700">
                {formatMoney(simulatedWeeklyAllowance)}/week
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">End-of-Semester Net:</span>
              <span
                className={`font-bold ${
                  simulatedNet >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatMoney(simulatedNet)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
