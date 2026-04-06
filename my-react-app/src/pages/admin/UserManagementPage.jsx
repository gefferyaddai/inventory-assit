import { useState } from "react";
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
import { appUsers as initialUsers } from "@/data/mockData";

const roleClass = (r) =>
  r === "admin"
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-green-50 text-green-700 border-green-200";

const statusClass = (s) =>
  s === "Active"
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-gray-100 text-gray-500 border-gray-200";

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", password: "",
  role: "clerk", department: "", accessLevel: "",
  assignedShift: "Morning", hireDate: "",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deactivateId, setDeactivateId] = useState(null);
  const [activateId, setActivateId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      firstName: u.firstName, lastName: u.lastName, email: u.email, password: "",
      role: u.role, department: u.department || "", accessLevel: u.accessLevel || "",
      assignedShift: u.assignedShift || "Morning", hireDate: u.hireDate || "",
    });
    setFormOpen(true);
  };

  const save = () => {
    if (!form.firstName.trim() || !form.email.trim()) {
      toast.error("First name and email are required");
      return;
    }
    if (editing) {
      setUsers((prev) => prev.map((u) =>
        u.id === editing.id ? {
          ...u,
          firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role,
          department: form.role === "admin" ? form.department : undefined,
          accessLevel: form.role === "admin" ? form.accessLevel : undefined,
          assignedShift: form.role === "clerk" ? form.assignedShift : undefined,
          hireDate: form.role === "clerk" ? form.hireDate : undefined,
        } : u
      ));
      toast.success("User updated");
    } else {
      setUsers((prev) => [{
        id: `u-${Date.now()}`,
        firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role,
        department: form.role === "admin" ? form.department : undefined,
        accessLevel: form.role === "admin" ? form.accessLevel : undefined,
        assignedShift: form.role === "clerk" ? form.assignedShift : undefined,
        hireDate: form.role === "clerk" ? form.hireDate : undefined,
        dateCreated: new Date().toISOString().split("T")[0],
        status: "Active", phone: "",
      }, ...prev]);
      toast.success("User added");
    }
    setFormOpen(false);
  };

  const deactivate = () => {
    if (!deactivateId) return;
    setUsers((prev) => prev.map((u) => u.id === deactivateId ? { ...u, status: "Inactive" } : u));
    toast.success("User deactivated");
    setDeactivateId(null);
  };

  const activate = () => {
    if (!activateId) return;
    setUsers((prev) => prev.map((u) => u.id === activateId ? { ...u, status: "Active" } : u));
    toast.success("User activated");
    setActivateId(null);
  };

  const deleteUser = () => {
    if (!deleteId) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteId));
    toast.success("User deleted");
    setDeleteId(null);
  };

  const exportXLSX = () => {
    const data = users.map((u) => ({
      Name: `${u.firstName} ${u.lastName}`, Email: u.email, Role: u.role,
      "Dept / Shift": u.department || u.assignedShift || "",
      Created: u.dateCreated, Status: u.status,
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
              <th className="px-4 py-3">Role</th>
              <th className="hidden md:table-cell px-4 py-3">Dept / Shift</th>
              <th className="hidden lg:table-cell px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-10 rounded-tr-xl"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
            )}
            {users.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className={`px-4 py-3 font-medium text-gray-900 ${u.status === "Inactive" ? "opacity-50" : ""}`}>{u.firstName} {u.lastName}</td>
                <td className={`hidden sm:table-cell px-4 py-3 text-gray-500 ${u.status === "Inactive" ? "opacity-50" : ""}`}>{u.email}</td>
                <td className={`px-4 py-3 ${u.status === "Inactive" ? "opacity-50" : ""}`}>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleClass(u.role)}`}>
                    {u.role === "admin" ? "Admin" : "StockClerk"}
                  </span>
                </td>
                <td className={`hidden md:table-cell px-4 py-3 text-gray-500 ${u.status === "Inactive" ? "opacity-50" : ""}`}>
                  {u.department || u.assignedShift || "—"}
                </td>
                <td className={`hidden lg:table-cell px-4 py-3 text-xs text-gray-400 ${u.status === "Inactive" ? "opacity-50" : ""}`}>{u.dateCreated}</td>
                <td className={`px-4 py-3 ${u.status === "Inactive" ? "opacity-50" : ""}`}>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(u.status)}`}>
                    {u.status}
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
                      {u.status === "Active" ? (
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
              <Label>Role</Label>
              <div className="w-full">
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="clerk">StockClerk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.role === "admin" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Operations" />
                </div>
                <div className="space-y-1.5">
                  <Label>Access Level</Label>
                  <Input value={form.accessLevel} onChange={(e) => setForm({ ...form, accessLevel: e.target.value })} placeholder="e.g. Full" />
                </div>
              </div>
            )}
            {form.role === "clerk" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Shift</Label>
                  <div className="w-full">
                    <Select value={form.assignedShift} onValueChange={(v) => setForm({ ...form, assignedShift: v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Evening">Evening</SelectItem>
                        <SelectItem value="Night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Hire Date</Label>
                  <Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <button
              onClick={save}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Save
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
