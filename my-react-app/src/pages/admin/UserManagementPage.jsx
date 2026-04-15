import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { api } from "@/services/api";

const roleClass = (r) =>
  r === "Admin"
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-green-50 text-green-700 border-green-200";

const statusClass = (s) =>
  s
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-gray-100 text-gray-500 border-gray-200";

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", password: "",
  phone: "", role: "StockClerk", warehouseId: "",
};

function normalizeUser(u) {
  return {
    id: u.UserID,
    firstName: u.FirstName || "",
    lastName: u.LastName || "",
    email: u.Email || "",
    phone: u.Phone || "",
    role: u.Role || "StockClerk",
    isActive: u.IsActive !== 0,
  };
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deactivateId, setDeactivateId] = useState(null);
  const [activateId, setActivateId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    api.get("/warehouses").then(setWarehouses).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/users");
      setUsers(data.map(normalizeUser));
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      firstName: u.firstName, lastName: u.lastName,
      email: u.email, password: "", phone: u.phone, role: u.role,
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.firstName.trim() || !form.email.trim()) {
      toast.error("First name and email are required");
      return;
    }
    if (!editing && !form.password.trim()) {
      toast.error("Password is required for new users");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, {
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone, role: form.role,
        });
        toast.success("User updated");
      } else {
        await api.post("/users", {
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, password: form.password,
          phone: form.phone, role: form.role,
          warehouseId: form.warehouseId || null,
        });
        toast.success("User added");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!deactivateId) return;
    try {
      await api.patch(`/users/${deactivateId}/status`, { isActive: 0 });
      toast.success("User deactivated");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to deactivate");
    } finally {
      setDeactivateId(null);
    }
  };

  const activate = async () => {
    if (!activateId) return;
    try {
      await api.patch(`/users/${activateId}/status`, { isActive: 1 });
      toast.success("User activated");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to activate");
    } finally {
      setActivateId(null);
    }
  };

  const deleteUser = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const exportXLSX = () => {
    const data = users.map((u) => ({
      Name: `${u.firstName} ${u.lastName}`, Email: u.email,
      Phone: u.phone, Role: u.role,
      Status: u.isActive ? "Active" : "Inactive",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 rounded-tl-xl">Name</th>
              <th className="hidden sm:table-cell px-4 py-3">Email</th>
              <th className="hidden md:table-cell px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-10 rounded-tr-xl"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
            )}
            {!loading && users.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                <td className="hidden sm:table-cell px-4 py-3 text-gray-500">{u.email}</td>
                <td className="hidden md:table-cell px-4 py-3 text-gray-500">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleClass(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(u.isActive)}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(u)}>Edit</DropdownMenuItem>
                      {u.isActive ? (
                        <DropdownMenuItem onClick={() => setDeactivateId(u.id)} className="text-red-600">
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setActivateId(u.id)} className="text-green-600">
                          Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setDeleteId(u.id)} className="text-red-600">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={exportXLSX}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4 text-blue-500" /> Export
        </button>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" />
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0100" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, warehouseId: "" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="StockClerk">StockClerk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label>{form.role === "StockClerk" ? "Assigned Warehouse" : "Warehouse"}</Label>
                <Select value={form.warehouseId} onValueChange={(v) => setForm({ ...form, warehouseId: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select warehouse…" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.WarehouseID} value={String(w.WarehouseID)}>
                        {w.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={!!deactivateId} onOpenChange={() => setDeactivateId(null)}
        title="Deactivate User"
        description="This user will be marked as inactive and will no longer be able to log in."
        onConfirm={deactivate} confirmLabel="Deactivate"
      />
      <ConfirmDialog
        open={!!activateId} onOpenChange={() => setActivateId(null)}
        title="Activate User"
        description="This user will be marked as active and will be able to log in again."
        onConfirm={activate} confirmLabel="Activate" destructive={false}
      />
      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete User"
        description="This will permanently delete the user. This action cannot be undone."
        onConfirm={deleteUser} confirmLabel="Delete"
      />
    </div>
  );
}
