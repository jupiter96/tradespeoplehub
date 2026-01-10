import React, { useState, useEffect } from "react";
import { Search, Loader2, Eye, Ban, CheckCircle2, MoreVertical, ArrowUpDown, XCircle, AlertCircle, ChevronLeft, ChevronRight, FileText, Clock } from "lucide-react";
import AdminPageLayout from "./AdminPageLayout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { resolveApiUrl } from "../../config/api";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import { useAdminPermissions } from "../../hooks/useAdminPermissions";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Service {
  _id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  priceUnit: string;
  status: "pending" | "required_modification" | "denied" | "paused" | "inactive" | "approved";
  modificationReason?: string;
  serviceCategory?: {
    _id: string;
    name: string;
    sector?: {
      _id: string;
      name: string;
    };
  };
  professional?: {
    _id: string;
    firstName: string;
    lastName: string;
    tradingName?: string;
    email: string;
  };
  rating?: number;
  reviewCount?: number;
  completedTasks?: number;
  createdAt: string;
  updatedAt: string;
}

// Sortable Header Component
function SortableHeader({ column, label, currentSort, sortDirection, onSort }: {
  column: string;
  label: string;
  currentSort: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  return (
    <TableHead className="text-[#FE8A0F] font-semibold">
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-2 hover:text-[#FFB347] transition-colors"
      >
        {label}
        <ArrowUpDown className="w-4 h-4" />
        {currentSort === column && (
          <span className="text-xs">
            {sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    </TableHead>
  );
}

type AdminServicesPageProps = {
  /** Which approval tab should be selected initially */
  initialTab?: "all" | "pending" | "required_modification" | "approved" | "rejected";
  /** Override page title */
  title?: string;
  /** Override page description */
  description?: string;
  /** Hide status filter selector */
  hideStatusFilter?: boolean;
};

export default function AdminServicesPage({
  initialTab = "all",
  title = "Services Management",
  description = "Review and manage professional services, approve or request modifications",
  hideStatusFilter = false,
}: AdminServicesPageProps) {
  useAdminRouteGuard();
  const navigate = useNavigate();
  const { isSuperAdmin, hasPermission } = useAdminPermissions();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>(initialTab || "all");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [modificationReason, setModificationReason] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | "request_modification">("approve");
  const [newStatus, setNewStatus] = useState<"pending" | "required_modification" | "denied" | "paused" | "inactive" | "approved">("approved");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Get approval status filter based on filter selection
  const getApprovalStatusFilter = () => {
    if (approvalStatusFilter === "all") {
      return undefined;
    }
    return approvalStatusFilter;
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());
      params.append("sortBy", sortField);
      params.append("sortOrder", sortDirection);
      // Always fetch all services (including inactive) for admin page
      params.append("activeOnly", "false");
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      // Note: filterStatus is now removed as we use unified status filter

      // Add status filter (unified status field) - only if not "all"
      const statusFilter = getApprovalStatusFilter();
      if (statusFilter && approvalStatusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        resolveApiUrl(`/api/services?${params.toString()}`),
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
        setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
        setTotalCount(data.totalCount || data.pagination?.total || 0);
      } else {
        toast.error("Failed to fetch services");
        setServices([]);
      }
    } catch (error) {
      // console.error("Error fetching services:", error);
      toast.error("Error fetching services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, sortField, sortDirection, searchQuery, approvalStatusFilter]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedService) return;

    try {
      const response = await fetch(
        resolveApiUrl(`/api/services/${selectedService._id}`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Service deleted successfully");
        fetchServices();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete service");
      }
    } catch (error) {
      // console.error("Error deleting service:", error);
      toast.error("Error deleting service");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    }
  };

  const handleStatusChange = (service: Service, newStatus: "pending" | "required_modification" | "denied" | "paused" | "inactive" | "approved") => {
    setSelectedService(service);
    setNewStatus(newStatus as any);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedService) return;

    try {
      // Map legacy status to unified status if needed
      let statusToSet = newStatus;
      if (newStatus === "active") {
        statusToSet = "approved";
      }

      // For required_modification, use approval endpoint to allow modificationReason
      if (statusToSet === "required_modification") {
        const response = await fetch(
          resolveApiUrl(`/api/services/${selectedService._id}/approval`),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ 
              status: statusToSet,
              modificationReason: modificationReason || "Status changed to Required Modification"
            }),
          }
        );

        if (response.ok) {
          const updatedService = await response.json();
          toast.success(`Service status updated to ${getStatusLabel(statusToSet)}`);
          // Immediately update the service in the local state
          setServices(prevServices => 
            prevServices.map(s => 
              s._id === selectedService._id 
                ? { ...s, status: statusToSet, modificationReason: updatedService.service?.modificationReason || s.modificationReason }
                : s
            )
          );
          // Remove from current list if status doesn't match current filter
          const currentFilter = getApprovalStatusFilter();
          if (currentFilter && statusToSet !== currentFilter) {
            setServices(prevServices => prevServices.filter(s => s._id !== selectedService._id));
            setTotalCount(prev => Math.max(0, prev - 1));
          }
          // Refresh from server to ensure consistency
          await fetchServices();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update service status");
        }
      } else {
        const response = await fetch(
          resolveApiUrl(`/api/services/${selectedService._id}`),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ status: statusToSet }),
          }
        );

        if (response.ok) {
          const updatedService = await response.json();
          toast.success(`Service status updated to ${getStatusLabel(statusToSet)}`);
          // Immediately update the service in the local state
          setServices(prevServices => 
            prevServices.map(s => 
              s._id === selectedService._id 
                ? { ...s, status: statusToSet }
                : s
            )
          );
          // Remove from current list if status doesn't match current filter
          const currentFilter = getApprovalStatusFilter();
          if (currentFilter && statusToSet !== currentFilter) {
            setServices(prevServices => prevServices.filter(s => s._id !== selectedService._id));
            setTotalCount(prev => Math.max(0, prev - 1));
          }
          // Refresh from server to ensure consistency
          await fetchServices();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update service status");
        }
      }
    } catch (error) {
      // console.error("Error updating service status:", error);
      toast.error("Error updating service status");
    } finally {
      setIsStatusDialogOpen(false);
      setIsModificationDialogOpen(false);
      setSelectedService(null);
      setModificationReason("");
    }
  };

  const handleApproval = (service: Service, action: "approve" | "reject" | "request_modification") => {
    setSelectedService(service);
    setApprovalAction(action);
    if (action === "request_modification") {
      setIsModificationDialogOpen(true);
    } else {
      setIsApprovalDialogOpen(true);
    }
  };

  const confirmApproval = async () => {
    if (!selectedService) return;

    try {
      // Map approval actions to unified status values
      let newStatus: string;
      if (approvalAction === "approve") {
        newStatus = "approved";
      } else if (approvalAction === "reject") {
        newStatus = "denied";
      } else {
        newStatus = "required_modification";
      }

      const updateData: any = {
        status: newStatus,
      };

      if (approvalAction === "request_modification" && modificationReason) {
        updateData.modificationReason = modificationReason;
      }

      const response = await fetch(
        resolveApiUrl(`/api/services/${selectedService._id}/approval`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const updatedService = await response.json();
        const actionText = approvalAction === "approve" ? "approved" : approvalAction === "reject" ? "denied" : "marked for modification";
        toast.success(`Service ${actionText} successfully`);
        // Immediately update the service in the local state
        setServices(prevServices => 
          prevServices.map(s => 
            s._id === selectedService._id 
              ? { ...s, status: newStatus, modificationReason: updatedService.service?.modificationReason || s.modificationReason }
              : s
          )
        );
        // Remove from current list if status doesn't match current filter
        const currentFilter = getApprovalStatusFilter();
        if (currentFilter && newStatus !== currentFilter) {
          setServices(prevServices => prevServices.filter(s => s._id !== selectedService._id));
          setTotalCount(prev => Math.max(0, prev - 1));
        } else {
          // Refresh to get latest data including any other changes
          fetchServices();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${approvalAction} service`);
      }
    } catch (error) {
      // console.error("Error updating service approval:", error);
      toast.error("Error updating service approval");
    } finally {
      setIsApprovalDialogOpen(false);
      setIsModificationDialogOpen(false);
      setSelectedService(null);
      setModificationReason("");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      required_modification: "bg-orange-100 text-orange-700 border-orange-200",
      denied: "bg-red-100 text-red-700 border-red-200",
      paused: "bg-blue-100 text-blue-700 border-blue-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      // Legacy support
      active: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      required_modification: "Required Modification",
      denied: "Denied",
      paused: "Paused",
      inactive: "Inactive",
      approved: "Approved",
      // Legacy support
      active: "Active",
      rejected: "Rejected",
    };
    return labels[status] || status || "Unknown";
  };

  // Count services by status
  const getServiceCounts = async () => {
    try {
      const counts: Record<string, number> = {
        pending: 0,
        required_modification: 0,
        approved: 0,
        rejected: 0, // For denied status
      };

      // Count by status (unified status field)
      for (const status of ['pending', 'required_modification', 'approved']) {
        const response = await fetch(
          resolveApiUrl(`/api/services?status=${status}&limit=1&activeOnly=false`),
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          counts[status] = data.totalCount || data.pagination?.total || 0;
        }
      }

      // Count denied (rejected) services
      const deniedResponse = await fetch(
        resolveApiUrl(`/api/services?status=denied&limit=1&activeOnly=false`),
        { credentials: "include" }
      );
      if (deniedResponse.ok) {
        const deniedData = await deniedResponse.json();
        counts.rejected = deniedData.totalCount || deniedData.pagination?.total || 0;
      }

      return counts;
    } catch (error) {
      // console.error("Error fetching service counts:", error);
      return {
        pending: 0,
        required_modification: 0,
        approved: 0,
        rejected: 0,
      };
    }
  };

  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({
    pending: 0,
    required_modification: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    getServiceCounts().then(setServiceCounts);
  }, [services.length]);

  const totalAll =
    (serviceCounts.pending || 0) +
    (serviceCounts.required_modification || 0) +
    (serviceCounts.approved || 0) +
    (serviceCounts.rejected || 0);

  return (
    <>
      <AdminPageLayout
        title={title}
        description={description}
      >
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search services by title, description, or professional..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#FE8A0F] focus:ring-[#FE8A0F]"
              />
            </div>
            {!hideStatusFilter && (
              <select
                value={approvalStatusFilter}
                onChange={(e) => setApprovalStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:border-[#FE8A0F] focus:ring-[#FE8A0F]"
              >
                <option value="all">All Status ({totalAll})</option>
                <option value="pending">Pending ({serviceCounts.pending})</option>
                <option value="required_modification">Required Modification ({serviceCounts.required_modification})</option>
                <option value="denied">Denied ({serviceCounts.rejected})</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
                <option value="approved">Approved ({serviceCounts.approved})</option>
              </select>
            )}
          </div>

            {/* Services Table */}
            <div className="rounded-3xl border-0 bg-white dark:bg-black p-6 shadow-xl shadow-[#FE8A0F]/20">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FE8A0F] mr-2" />
                  <span className="text-black dark:text-white">Loading services...</span>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-black dark:text-white">No services found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-0 hover:bg-transparent shadow-sm">
                          <SortableHeader
                            column="title"
                            label="Service Title"
                            currentSort={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                          />
                          <TableHead className="text-[#FE8A0F] font-semibold">Category</TableHead>
                          <TableHead className="text-[#FE8A0F] font-semibold">Professional</TableHead>
                          <SortableHeader
                            column="price"
                            label="Price"
                            currentSort={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                          />
                          <TableHead className="text-[#FE8A0F] font-semibold">Rating</TableHead>
                          <TableHead className="text-[#FE8A0F] font-semibold">Status</TableHead>
                          <SortableHeader
                            column="createdAt"
                            label="Created"
                            currentSort={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                          />
                          <TableHead className="text-[#FE8A0F] font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map((service) => (
                          <TableRow
                            key={service._id}
                            className="border-0 hover:bg-[#FE8A0F]/5 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <TableCell className="text-black dark:text-white">
                              <div>
                                <p className="font-medium">{service.title}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              {service.serviceCategory ? (
                                <div>
                                  <p className="text-sm font-medium">{service.serviceCategory.name}</p>
                                  {service.serviceCategory.sector && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{service.serviceCategory.sector.name}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              {service.professional ? (
                                <div>
                                  <p className="text-sm font-medium">
                                    {service.professional.tradingName || `${service.professional.firstName} ${service.professional.lastName}`}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{service.professional.email}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              <div>
                                {(() => {
                                  // Check if service has packages (package service)
                                  const hasPackages = service.packages && Array.isArray(service.packages) && service.packages.length > 0;
                                  
                                  if (hasPackages) {
                                    // For package services, show price range
                                    let minPrice = Infinity;
                                    let maxPrice = 0;
                                    
                                    service.packages.forEach((pkg: any) => {
                                      const pkgPrice = parseFloat(String(pkg.originalPrice || pkg.price || 0)) || 0;
                                      if (pkgPrice > 0) {
                                        if (pkgPrice < minPrice) minPrice = pkgPrice;
                                        if (pkgPrice > maxPrice) maxPrice = pkgPrice;
                                      }
                                    });
                                    
                                    if (minPrice === Infinity || maxPrice === 0) {
                                      return <span className="text-gray-400">N/A</span>;
                                    }
                                    
                                    if (minPrice === maxPrice) {
                                      return (
                                        <>
                                          <p className="font-medium">£{minPrice.toFixed(2)}</p>
                                          {service.priceUnit && service.priceUnit !== "fixed" && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">/{service.priceUnit.replace("per ", "")}</p>
                                          )}
                                        </>
                                      );
                                    }
                                    
                                    return (
                                      <>
                                        <p className="font-medium">£{minPrice.toFixed(2)} to £{maxPrice.toFixed(2)}</p>
                                        {service.priceUnit && service.priceUnit !== "fixed" && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400">/{service.priceUnit.replace("per ", "")}</p>
                                        )}
                                      </>
                                    );
                                  } else {
                                    // For single services, show regular price
                                    if (service.price === undefined || service.price === null) {
                                      return <span className="text-gray-400">N/A</span>;
                                    }
                                    
                                    return (
                                      <>
                                        <p className="font-medium">£{Number(service.price).toFixed(2)}</p>
                                {service.originalPrice && (
                                          <p className="text-sm text-gray-500 dark:text-gray-400 line-through">£{Number(service.originalPrice).toFixed(2)}</p>
                                )}
                                {service.priceUnit && service.priceUnit !== "fixed" && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">/{service.priceUnit.replace("per ", "")}</p>
                                )}
                                      </>
                                    );
                                  }
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">{service.rating?.toFixed(1) || "0.0"}</span>
                                <span className="text-[#FE8A0F]">★</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">({service.reviewCount || 0})</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              <Badge className={`${getStatusBadge(service.status)} border text-xs`}>
                                {getStatusLabel(service.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-black dark:text-white">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(service.createdAt).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="hover:bg-[#FE8A0F]/10">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Check if user is admin or has service management permission
                                      const isAdmin = isSuperAdmin || hasPermission('service');
                                      
                                      if (isAdmin) {
                                        // Admin can view any service regardless of status
                                        const serviceIdentifier = service.slug || service._id;
                                        window.open(`/service/${serviceIdentifier}?admin=true`, '_blank');
                                      } else if (service.status === 'approved') {
                                        // Non-admin users can only view approved services
                                        const serviceIdentifier = service.slug || service._id;
                                        window.open(`/service/${serviceIdentifier}`, '_blank');
                                      } else {
                                        toast.error(`This service is ${service.status.replace('_', ' ')} and cannot be viewed. Only approved services can be viewed.`);
                                      }
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Service
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                                    Change Status
                                  </div>
                                  {service.status !== "pending" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(service, "pending")}
                                      className="text-yellow-600"
                                    >
                                      <Clock className="w-4 h-4 mr-2" />
                                      Set to Pending
                                    </DropdownMenuItem>
                                  )}
                                  {service.status !== "required_modification" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedService(service);
                                        setNewStatus("required_modification");
                                        setIsModificationDialogOpen(true);
                                      }}
                                      className="text-orange-600"
                                    >
                                      <AlertCircle className="w-4 h-4 mr-2" />
                                      Set to Required Modification
                                    </DropdownMenuItem>
                                  )}
                                  {service.status !== "denied" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(service, "denied")}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Set to Denied
                                    </DropdownMenuItem>
                                  )}
                                  {service.status !== "paused" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(service, "paused")}
                                      className="text-blue-600"
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Set to Paused
                                    </DropdownMenuItem>
                                  )}
                                  {service.status !== "inactive" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(service, "inactive")}
                                      className="text-gray-600"
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Set to Inactive
                                    </DropdownMenuItem>
                                  )}
                                  {service.status !== "approved" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(service, "approved")}
                                      className="text-green-600"
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Set to Approved
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(service)}
                                    className="text-red-600"
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-0 shadow-sm">
                      <p className="text-sm text-black dark:text-white">
                        Page <span className="text-[#FE8A0F] font-semibold">{page}</span> of <span className="text-[#FE8A0F] font-semibold">{totalPages}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="border-0 shadow-md shadow-gray-200 dark:shadow-gray-800 text-[#FE8A0F] hover:bg-[#FE8A0F]/10 hover:shadow-lg hover:shadow-[#FE8A0F]/30 disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
        </div>
      </AdminPageLayout>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-[18px] text-[#2c353f]">Delete Service</DialogTitle>
            <DialogDescription className="text-[14px] text-[#6b6b6b]">
              Are you sure you want to delete "{selectedService?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="font-['Poppins',sans-serif]">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="font-['Poppins',sans-serif]">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-[18px] text-[#2c353f]">Change Service Status</DialogTitle>
            <DialogDescription className="text-[14px] text-[#6b6b6b]">
              Are you sure you want to change the status of "{selectedService?.title}" to {getStatusLabel(newStatus)}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} className="font-['Poppins',sans-serif]">
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} className="bg-[#FE8A0F] hover:bg-[#FFB347] font-['Poppins',sans-serif]">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="font-['Poppins',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-[18px] text-[#2c353f]">
              {approvalAction === "approve" ? "Approve Service" : "Reject Service"}
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#6b6b6b]">
              Are you sure you want to {approvalAction === "approve" ? "approve" : "reject"} "{selectedService?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)} className="font-['Poppins',sans-serif]">
              Cancel
            </Button>
            <Button
              onClick={confirmApproval}
              className={`font-['Poppins',sans-serif] ${
                approvalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {approvalAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Modification Dialog */}
      <Dialog open={isModificationDialogOpen} onOpenChange={setIsModificationDialogOpen}>
        <DialogContent className="font-['Poppins',sans-serif] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] text-[#2c353f]">Request Modification</DialogTitle>
            <DialogDescription className="text-[14px] text-[#6b6b6b]">
              Please provide a reason for requesting modifications to "{selectedService?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="modificationReason" className="text-[14px] text-[#2c353f] mb-2 block">
                Modification Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="modificationReason"
                value={modificationReason}
                onChange={(e) => setModificationReason(e.target.value)}
                placeholder="Please specify what needs to be modified..."
                className="min-h-[120px] font-['Poppins',sans-serif] text-[14px] border-gray-300 focus:border-[#FE8A0F] focus:ring-[#FE8A0F]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModificationDialogOpen(false)} className="font-['Poppins',sans-serif]">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newStatus === "required_modification") {
                  confirmStatusChange();
                } else {
                  confirmApproval();
                }
              }}
              disabled={!modificationReason.trim()}
              className="bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white font-['Poppins',sans-serif] disabled:opacity-50"
            >
              Change Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
