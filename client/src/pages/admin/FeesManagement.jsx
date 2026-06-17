import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "@/hooks/UseApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCcw,
  Calendar,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import z from "zod";

const createSchema = z.object({
  student: z.string().min(1, "Student is required"),
  sclass: z.string().min(1, "Class is required"),
  amount: z.string().min(1, "Amount is required"),
  feeType: z.enum(["Tuition", "Library", "Exam", "Transport", "Other"], {
    message: "Fee type is required",
  }),
  totalAmount: z.string().min(1, "Total amount is required"),
  paymentStatus: z.enum(["Paid", "Pending", "Partially Paid"], {
    message: "Payment status is required",
  }),
  paymentMethod: z.enum(["Cash", "Online", "Bank Transfer"], {
    message: "Payment method is required",
  }),
  date: z.string().min(1, "Date is required"),
});

const initialFormState = {
  student: "",
  sclass: "",
  amount: "",
  feeType: "Tuition",
  totalAmount: "",
  paymentStatus: "Pending",
  paymentMethod: "Cash",
  date: new Date().toISOString().split("T")[0],
};

const FeesManagement = () => {
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();
  const [fees, setFees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch fees from backend
  const fetchFees = useCallback(async () => {
    try {
      const response = await get("/fees");
      if (response?.success && Array.isArray(response.fees)) {
        setFees(response.fees);
      } else if (Array.isArray(response)) {
        setFees(response);
      } else {
        toast.error("Unexpected fees response from backend");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load fees");
    }
  }, [get]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? "");
    window.addEventListener("adminSearch", handler);
    return () => window.removeEventListener("adminSearch", handler);
  }, []);

  // Filter fees based on search and status
  const filteredFees = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return fees.filter((fee) => {
      const matchesSearch =
        (fee.student?.name || "").toLowerCase().includes(lower) ||
        (fee.sclass?.className || "").toLowerCase().includes(lower) ||
        (fee.feeType || "").toLowerCase().includes(lower);
      const matchesStatus =
        filterStatus === "all" || fee.paymentStatus === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [fees, searchTerm, filterStatus]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setEditingFeeId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (fee) => {
    setFormState({
      student: fee.student?._id || fee.student || "",
      sclass: fee.sclass?._id || fee.sclass || "",
      amount: fee.amount?.toString() || "",
      feeType: fee.feeType || "Tuition",
      totalAmount: fee.totalAmount?.toString() || "",
      paymentStatus: fee.paymentStatus || "Pending",
      paymentMethod: fee.paymentMethod || "Cash",
      date: new Date(fee.date).toISOString().split("T")[0],
    });
    setEditingFeeId(fee._id || fee.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = createSchema.safeParse(formState);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        student: formState.student,
        sclass: formState.sclass,
        amount: parseFloat(formState.amount),
        feeType: formState.feeType,
        totalAmount: parseFloat(formState.totalAmount),
        paymentStatus: formState.paymentStatus,
        paymentMethod: formState.paymentMethod,
        date: formState.date,
      };

      let response;
      if (isEditMode && editingFeeId) {
        response = await put(`/fees/${editingFeeId}`, payload);
      } else {
        response = await post("/fees/create", payload);
      }

      if (response?.success) {
        toast.success(
          isEditMode ? "Fee updated successfully" : "Fee created successfully"
        );
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingFeeId(null);
        setFormState(initialFormState);
        await fetchFees();
      } else {
        toast.error(response?.message || "Failed to save fee");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not save fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (feeId) => {
    if (!confirm("Are you sure you want to delete this fee record?")) {
      return;
    }
    try {
      const response = await del(`/fees/${feeId}`);
      if (response?.success) {
        toast.success("Fee deleted successfully");
        await fetchFees();
      } else {
        toast.error(response?.message || "Failed to delete fee");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete fee");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchFees();
      toast.success("Fees refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "destructive";
      case "Pending":
        return "default";
      case "Partially Paid":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="pl-16 pr-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fees Management</h2>
          <p className="text-muted-foreground">
            Manage student fees and payment records
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Fee
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, class, or fee type..."
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="sm:w-[180px] bg-background border-border">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
              {filterStatus !== "all" && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  Filtered: {filterStatus}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditMode ? "Edit Fee" : "Create New Fee Record"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update fee information"
                : "Create a new fee record for a student."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Student ID</Label>
                <Input
                  id="student"
                  placeholder="Enter student ID"
                  value={formState.student}
                  onChange={(e) => handleInputChange("student", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sclass">Class ID</Label>
                <Input
                  id="sclass"
                  placeholder="Enter class ID"
                  value={formState.sclass}
                  onChange={(e) => handleInputChange("sclass", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formState.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  placeholder="Enter total amount"
                  value={formState.totalAmount}
                  onChange={(e) =>
                    handleInputChange("totalAmount", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feeType">Fee Type</Label>
                <Select
                  value={formState.feeType}
                  onValueChange={(value) =>
                    handleInputChange("feeType", value)
                  }
                >
                  <SelectTrigger id="feeType">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tuition">Tuition</SelectItem>
                    <SelectItem value="Library">Library</SelectItem>
                    <SelectItem value="Exam">Exam</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={formState.paymentStatus}
                  onValueChange={(value) =>
                    handleInputChange("paymentStatus", value)
                  }
                >
                  <SelectTrigger id="paymentStatus">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formState.paymentMethod}
                  onValueChange={(value) =>
                    handleInputChange("paymentMethod", value)
                  }
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formState.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setFormState(initialFormState);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Fee"
                    : "Create Fee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fees List */}
      {filteredFees.length > 0 ? (
        <div className="grid gap-4 grid-cols-1">
          {filteredFees.map((fee) => (
            <Card
              key={fee._id || fee.id}
              className="bg-card border-border overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg text-foreground">
                        {fee.student?.name || "Student"}
                      </CardTitle>
                      <Badge variant={getStatusColor(fee.paymentStatus)}>
                        {fee.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Class: {fee.sclass?.className || "N/A"}</span>
                      <span>{fee.feeType}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(fee)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(fee._id || fee.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {fee.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">${fee.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <p className="font-semibold">{fee.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold text-sm">
                      {formatDate(fee.date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No fees found</p>
              <p className="text-sm text-muted-foreground/70">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first fee record to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      {fees.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-foreground">
                  {fees.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-foreground">
                  {fees.filter((f) => f.paymentStatus === "Paid").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {fees.filter((f) => f.paymentStatus === "Pending").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Partial</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    fees.filter((f) => f.paymentStatus === "Partially Paid")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeesManagement;