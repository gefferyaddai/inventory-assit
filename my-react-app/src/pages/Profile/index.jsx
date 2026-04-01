import { useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "Kevin Lionel",
    email: "kevin.igelka@ucalgary.ca",
    role: "Admin",
  });

  const [nameForm, setNameForm] = useState({ name: user.name });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [nameSuccess, setNameSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  function handleNameSave() {
    setUser({ ...user, name: nameForm.name });
    setNameSuccess(true);
    setTimeout(() => setNameSuccess(false), 3000);
  }

  function handlePasswordSave() {
    setPasswordError("");
    if (passwordForm.oldPassword !== "password") {
      setPasswordError("Old password is incorrect.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3000);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Account Info</h2>
        <p className="text-sm text-gray-500 mb-1">Email</p>
        <p className="text-sm font-medium mb-3">{user.email}</p>
        <p className="text-sm text-gray-500 mb-1">Role</p>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary text-white">
          {user.role}
        </span>
      </div>

      {/* Edit Name */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Edit Name</h2>
        <input
          className="w-full border rounded px-3 py-2 text-sm mb-3"
          placeholder="Your name"
          value={nameForm.name}
          onChange={(e) => setNameForm({ name: e.target.value })}
        />
        {nameSuccess && <p className="text-green-600 text-sm mb-2">Name updated!</p>}
        <button
          onClick={handleNameSave}
          className="bg-primary text-white px-4 py-2 rounded text-sm"
        >
          Save Name
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        {["oldPassword", "newPassword", "confirmPassword"].map((field) => (
          <input
            key={field}
            type="password"
            className="w-full border rounded px-3 py-2 text-sm mb-3"
            placeholder={field === "oldPassword" ? "Old password" : field === "newPassword" ? "New password" : "Confirm new password"}
            value={passwordForm[field]}
            onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
          />
        ))}
        {passwordError && <p className="text-red-600 text-sm mb-2">{passwordError}</p>}
        {passwordSuccess && <p className="text-green-600 text-sm mb-2">Password changed!</p>}
        <button
          onClick={handlePasswordSave}
          className="bg-primary text-white px-4 py-2 rounded text-sm"
        >
          Change Password
        </button>
      </div>
    </div>
  );
}