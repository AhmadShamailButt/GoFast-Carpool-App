import React, { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";

const ResetPassword = ({ email, onClose }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    const trimmedPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: trimmedPassword }),
      });
      setSubmitting(false);

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Password reset successful.");
        onClose();
      } else {
        alert(data.error || "Failed to reset password.");
      }
    } catch (error) {
      setSubmitting(false);
      alert("An error occurred. Please try again.");
    }
  };

  const inputClass = "w-full p-2 border rounded dark:bg-gray-700 pr-10";

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800 dark:text-white">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-black">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>

        <div className="relative mb-3">
          <input
            type={showNew ? "text" : "password"}
            placeholder="New Password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <span
            className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        <div className="relative mb-4">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span
            className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        <button
          className={`w-full py-2 rounded text-white ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={handleReset}
          disabled={submitting}
        >
          {submitting ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
