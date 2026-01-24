import { useState } from "react";
import { Search, Filter, ShoppingBag, Package, CheckCircle2, XCircle, AlertTriangle, Eye, MessageCircle, MoreVertical, Star } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { Order } from "./types";
import { formatDate, getStatusBadge, getStatusIcon, getStatusLabelForTable, resolveAvatarUrl } from "./utils";

interface ProfessionalOrderListProps {
  orders: Order[];
  allOrders: Order[];
  inProgressOrders: Order[];
  completedOrders: Order[];
  cancelledOrders: Order[];
  disputedOrders: Order[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  onViewOrder: (orderId: string) => void;
  onStartConversation: (params: {
    id: string;
    name: string;
    avatar?: string;
    online?: boolean;
    jobId?: string;
    jobTitle?: string;
  }) => void;
}

export default function ProfessionalOrderList({
  orders,
  allOrders,
  inProgressOrders,
  completedOrders,
  cancelledOrders,
  disputedOrders,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  activeTab,
  onActiveTabChange,
  onViewOrder,
  onStartConversation,
}: ProfessionalOrderListProps) {
  const handleStartChat = (order: Order) => {
    if (order.client && order.clientId) {
      onStartConversation({
        id: order.clientId,
        name: order.client,
        avatar: order.clientAvatar,
        online: true,
        jobId: order.id,
        jobTitle: order.service,
      });
    } else {
      toast.error("Unable to start chat - client information not available");
    }
  };

  const renderOrderTable = (orderList: Order[]) => {
    if (orderList.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            No orders
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-['Poppins',sans-serif]">Service</TableHead>
              <TableHead className="font-['Poppins',sans-serif]">Client</TableHead>
              <TableHead className="font-['Poppins',sans-serif]">Order Date</TableHead>
              <TableHead className="font-['Poppins',sans-serif]">Amount</TableHead>
              <TableHead className="font-['Poppins',sans-serif]">Status</TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderList.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]" title={order.service}>
                      {order.service && order.service.length > 30 
                        ? `${order.service.substring(0, 30)}...` 
                        : order.service}
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      {resolveAvatarUrl(order.clientAvatar) && (
                        <AvatarImage src={resolveAvatarUrl(order.clientAvatar)} />
                      )}
                      <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                        {order.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-['Poppins',sans-serif] text-[13px]">{order.client}</span>
                  </div>
                </TableCell>
                <TableCell className="font-['Poppins',sans-serif] text-[13px]">
                  {formatDate(order.date)}
                </TableCell>
                <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                  {order.amount}
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusBadge(order.status)} font-['Poppins',sans-serif] text-[11px]`}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {getStatusLabelForTable(order.status)}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewOrder(order.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStartChat(order)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderCompletedTable = (orderList: Order[]) => {
    if (orderList.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            No completed orders
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-['Poppins',sans-serif]">Service</TableHead>
              <TableHead className="font-['Poppins',sans-serif]">Client</TableHead>
              <TableHead className="font-['Poppins',sans-serif]">Order Date</TableHead>
              <TableHead className="font-['Poppins',sans-serif]">Amount</TableHead>
              <TableHead className="font-['Poppins',sans-serif]">Rating</TableHead>
              <TableHead className="font-['Poppins',sans-serif] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderList.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">{order.service}</p>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">{order.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      {resolveAvatarUrl(order.clientAvatar) && (
                        <AvatarImage src={resolveAvatarUrl(order.clientAvatar)} />
                      )}
                      <AvatarFallback className="bg-[#3D78CB] text-white font-['Poppins',sans-serif] text-[11px]">
                        {order.client?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-['Poppins',sans-serif] text-[13px]">{order.client}</span>
                  </div>
                </TableCell>
                <TableCell className="font-['Poppins',sans-serif] text-[13px]">
                  {formatDate(order.date)}
                </TableCell>
                <TableCell className="font-['Poppins',sans-serif] text-[14px] text-[#FE8A0F]">
                  {order.amount}
                </TableCell>
                <TableCell>
                  {order.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#FE8A0F] text-[#FE8A0F]" />
                      <span className="font-['Poppins',sans-serif] text-[13px]">{order.rating}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewOrder(order.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStartChat(order)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4 md:mb-6">
        <div>
          <h2 className="font-['Poppins',sans-serif] text-[20px] sm:text-[22px] md:text-[24px] text-[#2c353f] mb-2">
            My Orders
          </h2>
          <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
            Manage orders received from clients
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-9 w-full font-['Poppins',sans-serif] text-[13px]"
            />
          </div>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-full sm:w-40 font-['Poppins',sans-serif] text-[13px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="amount">Sort by Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="flex lg:grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        {/* Total Orders */}
        <div 
          className="rounded-2xl p-5 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0 shadow-[0_8px_24px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.35)] transition-all duration-300 transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
        >
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-white/90 mb-2 md:mb-3 font-medium">
            Total Orders
          </p>
          <p className="font-['Poppins',sans-serif] text-[32px] md:text-[40px] text-white font-bold">
            {orders.length}
          </p>
        </div>

        {/* In Progress */}
        <div 
          className="rounded-2xl p-5 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0 shadow-[0_8px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.35)] transition-all duration-300 transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
        >
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-white/90 mb-2 md:mb-3 font-medium">
            In Progress
          </p>
          <p className="font-['Poppins',sans-serif] text-[32px] md:text-[40px] text-white font-bold">
            {inProgressOrders.length}
          </p>
        </div>

        {/* Completed */}
        <div 
          className="rounded-2xl p-5 md:p-6 min-w-[200px] lg:min-w-0 flex-shrink-0 shadow-[0_8px_24px_rgba(16,185,129,0.25)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.35)] transition-all duration-300 transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
        >
          <p className="font-['Poppins',sans-serif] text-[13px] md:text-[14px] text-white/90 mb-2 md:mb-3 font-medium">
            Completed
          </p>
          <p className="font-['Poppins',sans-serif] text-[32px] md:text-[40px] text-white font-bold">
            {completedOrders.length}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={onActiveTabChange}>
        <div className="overflow-x-auto mb-4 md:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full justify-start gap-1">
            <TabsTrigger
              value="all"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              All ({allOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="In Progress"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <Package className="w-4 h-4 mr-2" />
              In Progress ({inProgressOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="Completed"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="Cancelled"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelled ({cancelledOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="disputed"
              className="font-['Poppins',sans-serif] text-[13px] whitespace-nowrap flex-shrink-0"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Disputed ({disputedOrders.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          {renderOrderTable(allOrders)}
        </TabsContent>

        <TabsContent value="In Progress" className="space-y-4">
          {inProgressOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No in progress orders
              </p>
            </div>
          ) : (
            renderOrderTable(inProgressOrders)
          )}
        </TabsContent>

        <TabsContent value="Completed" className="space-y-4">
          {renderCompletedTable(completedOrders)}
        </TabsContent>

        <TabsContent value="Cancelled" className="space-y-4">
          {cancelledOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No cancelled orders
              </p>
            </div>
          ) : (
            renderOrderTable(cancelledOrders)
          )}
        </TabsContent>

        <TabsContent value="disputed" className="space-y-4">
          {disputedOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                No disputed orders
              </p>
            </div>
          ) : (
            renderOrderTable(disputedOrders)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
