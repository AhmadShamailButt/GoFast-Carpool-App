import React, { useState } from "react";
import ResetPassword from "./ResetPassword";
import { X } from "lucide-react";

const ResetCode = ({ email, onClose }) => {
  const [code, setCode] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const verifyCode = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return alert("Please enter the verification code.");

    try {
      setVerifying(true);
      const res = await fetch("http://localhost:5000/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: trimmedCode }),
      });
      setVerifying(false);
      if (res.ok) setShowResetPassword(true);
      else alert("Invalid or expired verification code.");
    } catch (error) {
      setVerifying(false);
      alert("Something went wrong. Please try again.");
    }
  };

  if (showResetPassword) return <ResetPassword email={email} onClose={onClose} />;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800 dark:text-white">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-black">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">Enter Verification Code</h2>
        <input
          type="text"
          className="w-full p-2 border rounded mb-4 dark:bg-gray-700"
          placeholder="Enter the code sent to your email"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          className={`w-full py-2 rounded text-white ${
            verifying || !code.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={verifyCode}
          disabled={verifying || !code.trim()}
        >
          {verifying ? "Verifying..." : "Verify and Continue"}
        </button>
      </div>
    </div>
  );
};

export default ResetCode;
