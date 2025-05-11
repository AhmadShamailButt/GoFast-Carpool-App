import React, { useState } from "react";
import ResetCode from "./ResetCode";
import { X } from "lucide-react";

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [proceedToCode, setProceedToCode] = useState(false);
  const [sending, setSending] = useState(false);

  const validateEmail = (email) => /^[\w.-]+@lhr\.nu\.edu\.pk$/.test(email);

  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      alert("Enter a valid @lhr.nu.edu.pk email.");
      return;
    }
    try {
      setSending(true);
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSending(false);
      if (res.ok) setProceedToCode(true);
      else alert(await res.text() || "Email not registered.");
    } catch (err) {
      setSending(false);
      alert("Something went wrong. Please try again.");
    }
  };

  if (proceedToCode) return <ResetCode email={email} onClose={onClose} />;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800 dark:text-white">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-black">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">Forgot Password</h2>
        <input
          type="email"
          className="w-full p-2 border rounded mb-4 dark:bg-gray-700"
          placeholder="Enter your university email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailValid(validateEmail(e.target.value));
          }}
        />
        <button
          className={`w-full py-2 rounded text-white ${
            sending || !emailValid
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={handleSendCode}
          disabled={!emailValid || sending}
        >
          {sending ? "Sending..." : "Send Verification Code"}
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
