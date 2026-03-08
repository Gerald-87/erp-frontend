import React, { useState } from "react";
import { createHoliday } from "../../../../api/HolidayApi";
import HrDateInput from "../../HrDateInput";
import { XCircle } from "lucide-react";

export const HolidayListForm: React.FC<{
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================
     CREATE HOLIDAY
  ========================= */
  const handleSave = async () => {
    if (!name || !fromDate || !toDate) {
      alert("All fields required");
      return;
    }

    try {
      setLoading(true);

      await createHoliday({
        name,
        fromDate,
        toDate,
      });

      onSuccess?.(); // refresh list
      onClose(); // close modal
    } catch (err) {
      console.error("Create failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-theme rounded-2xl overflow-hidden">
      {/* HEADER */}
      <div className="p-6 flex items-center justify-between border-b border-theme">
        <h2 className="text-xl font-bold text-main">New Holiday</h2>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
        >
          <XCircle size={18} />
        </button>
      </div>

      {/* FORM */}
      <div className="p-6 space-y-4">
        <input
          type="text"
          placeholder="Holiday Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl"
        />

        <HrDateInput
          value={fromDate}
          onChange={(v) => setFromDate(v)}
          placeholder="DD/MM/YYYY"
          inputClassName="px-4 py-3 border rounded-xl"
        />

        <HrDateInput
          value={toDate}
          onChange={(v) => setToDate(v)}
          placeholder="DD/MM/YYYY"
          inputClassName="px-4 py-3 border rounded-xl"
        />

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="px-6 py-3 border rounded-xl cursor-pointer">
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-3 bg-primary rounded-xl cursor-pointer"
          >
            Save Holiday
          </button>
        </div>
      </div>
    </div>
  );
};
