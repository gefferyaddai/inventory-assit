import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

function initials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-card rounded-xl border border-border p-5 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-sm font-semibold text-foreground">{children}</h2>;
}

function Alert({ type, message }) {
  const isError = type === "error";
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isError ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
      {isError
        ? <AlertCircle className="h-4 w-4 shrink-0" />
        : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [nameInput,   setNameInput]   = useState(user?.name ?? "");
  const [nameStatus,  setNameStatus]  = useState(null);

  const [pwForm,   setPwForm]   = useState({ old: "", new: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  function handleNameSave() {
    if (!nameInput.trim()) return;
    setDisplayName(nameInput.trim());
    setNameStatus({ type: "success", message: "Name updated successfully." });
    setTimeout(() => setNameStatus(null), 3000);
  }

  async function handlePasswordSave() {
    setPwStatus(null);
    if (pwForm.new.length < 6) {
      setPwStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }
    if (pwForm.new !== pwForm.confirm) {
      setPwStatus({ type: "error", message: "New passwords do not match." });
      return;
    }
    setPwSaving(true);
    try {
      await api.put(`/users/${user.id}/password`, {
        currentPassword: pwForm.old,
        newPassword: pwForm.new,
      });
      setPwForm({ old: "", new: "", confirm: "" });
      setPwStatus({ type: "success", message: "Password changed successfully." });
      setTimeout(() => setPwStatus(null), 3000);
    } catch (err) {
      setPwStatus({ type: "error", message: err.message || "Failed to change password." });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* ── Account card ── */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-accent">{initials(displayName)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <Badge
              variant="outline"
              className={`mt-1 text-xs capitalize ${
                user?.role === "Admin"
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-success/10 text-success border-success/20"
              }`}
            >
              {user?.role}
            </Badge>
          </div>
        </div>
      </Card>

      {/* ── Edit name ── */}
      <Card>
        <SectionTitle>Edit Name</SectionTitle>
        <div className="space-y-1.5">
          <Label>Display Name</Label>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your full name"
          />
        </div>
        {nameStatus && <Alert type={nameStatus.type} message={nameStatus.message} />}
        <Button
          onClick={handleNameSave}
          disabled={!nameInput.trim() || nameInput.trim() === displayName}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Save Name
        </Button>
      </Card>

      {/* ── Change password ── */}
      <Card>
        <SectionTitle>Change Password</SectionTitle>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={pwForm.old}
              onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input
              type="password"
              value={pwForm.new}
              onChange={(e) => setPwForm({ ...pwForm, new: e.target.value })}
              placeholder="At least 6 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="Repeat new password"
            />
          </div>
        </div>
        {pwStatus && <Alert type={pwStatus.type} message={pwStatus.message} />}
        <Button
          onClick={handlePasswordSave}
          disabled={pwSaving || !pwForm.old || !pwForm.new || !pwForm.confirm}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {pwSaving ? "Saving…" : "Change Password"}
        </Button>
      </Card>

    </div>
  );
}
