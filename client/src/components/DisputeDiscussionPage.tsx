import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJobs } from "./JobsContext";
import { useOrders } from "./OrdersContext";
import { useAccount } from "./AccountContext";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { MessageCircle, Clock, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner@2.0.3";

export default function DisputeDiscussionPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const { getDisputeById, getJobById, addDisputeMessage, makeDisputeOffer } = useJobs();
  const { getOrderDisputeById, addOrderDisputeMessage, makeOrderDisputeOffer, orders } = useOrders();
  const { currentUser } = useAccount();
  
  // Try to get dispute from both contexts
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [job, setJob] = useState(dispute && "jobId" in dispute ? getJobById(dispute.jobId) : undefined);
  const [order, setOrder] = useState(dispute && "orderId" in dispute ? orders.find(o => o.id === dispute.orderId) : undefined);
  const [message, setMessage] = useState("");
  const [newOffer, setNewOffer] = useState("");
  const [showMilestones, setShowMilestones] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  
  // Determine if this is an order dispute or job dispute
  const isOrderDispute = dispute && "orderId" in dispute;

  useEffect(() => {
    const jobDispute = getDisputeById(disputeId || "");
    const orderDispute = getOrderDisputeById(disputeId || "");
    const currentDispute = jobDispute || orderDispute;
    setDispute(currentDispute);
    if (currentDispute) {
      if ("jobId" in currentDispute) {
        setJob(getJobById(currentDispute.jobId));
      } else if ("orderId" in currentDispute) {
        setOrder(orders.find(o => o.id === currentDispute.orderId));
      }
    }
  }, [disputeId, getDisputeById, getOrderDisputeById, getJobById, orders]);

  // Calculate time left until team intervention
  useEffect(() => {
    if (!dispute?.teamInterventionTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const interventionTime = new Date(dispute.teamInterventionTime!).getTime();
      const diff = interventionTime - now;

      if (diff <= 0) {
        setTimeLeft("Team reviewing");
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      setTimeLeft(`${minutes} minutes`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dispute?.teamInterventionTime]);

  const handleSendMessage = () => {
    if (!message.trim() || !disputeId) return;
    if (isOrderDispute) {
      addOrderDisputeMessage(disputeId, message);
    } else {
      addDisputeMessage(disputeId, message);
    }
    setMessage("");
    toast.success("Message sent");
    // Refresh dispute
    if (isOrderDispute) {
      setDispute(getOrderDisputeById(disputeId));
    } else {
      setDispute(getDisputeById(disputeId));
    }
  };

  const handleMakeOffer = () => {
    if (!newOffer || !disputeId || !dispute) return;
    const amount = parseFloat(newOffer);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > dispute.amount) {
      toast.error(`Offer cannot exceed ${isOrderDispute ? "order" : "milestone"} amount of £${dispute.amount.toFixed(2)}`);
      return;
    }
    if (isOrderDispute) {
      makeOrderDisputeOffer(disputeId, amount);
    } else {
      makeDisputeOffer(disputeId, amount);
    }
    setNewOffer("");
    toast.success("Offer submitted");
    // Refresh dispute
    if (isOrderDispute) {
      setDispute(getOrderDisputeById(disputeId));
    } else {
      setDispute(getDisputeById(disputeId));
    }
  };

  if (!dispute || (!job && !order)) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <Nav />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-2">
            Dispute Not Found
          </h1>
          <Button
            onClick={() => navigate(isOrderDispute ? "/account?tab=orders" : "/account?tab=jobs")}
            className="mt-4 bg-[#FE8A0F] hover:bg-[#FFB347]"
          >
            Go to My {isOrderDispute ? "Orders" : "Jobs"}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isClaimant = currentUser?.id === dispute.claimantId;
  const userRole = isClaimant ? "Client (you)" : "Professional (you)";
  const otherRole = isClaimant ? `Professional (${dispute.respondentName})` : `Client (${dispute.claimantName})`;

  const userWantsToPay = isClaimant ? dispute.claimantOffer?.amount : dispute.respondentOffer?.amount;
  const otherWantsToReceive = isClaimant ? dispute.respondentOffer?.amount : dispute.claimantOffer?.amount;

  const hasUserMadeOffer = isClaimant ? !!dispute.claimantOffer : !!dispute.respondentOffer;
  const hasOtherMadeOffer = isClaimant ? !!dispute.respondentOffer : !!dispute.claimantOffer;

  const milestone = job?.milestones?.find((m) => m.id === (dispute as any).milestoneId);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Nav />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-['Poppins',sans-serif] text-[28px] text-[#2c353f]">
            {isOrderDispute ? "Order payment dispute" : "Milestone payment dispute"}
          </h1>
          {isOrderDispute && order && (
            <Button
              onClick={() => navigate(`/account?tab=orders&orderId=${order.id}`)}
              variant="ghost"
              className="font-['Poppins',sans-serif] text-[14px] text-[#3D78CB] hover:text-[#2C5AA0] hover:bg-transparent"
            >
              Go Back to Order Details
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Dispute Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    Dispute ID:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {dispute.id.replace("DISP-", "").replace("dispute-", "")}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    Case status:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-1">
                    Decided in:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-medium">
                    {dispute.claimantName} favour
                  </p>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="space-y-4">
                {dispute.messages.map((msg, index) => {
                  const isCurrentUser = msg.userId === currentUser?.id;
                  const senderName = msg.userId === dispute.claimantId ? dispute.claimantName : dispute.respondentName;
                  const isClaimant = msg.userId === dispute.claimantId;
                  const showDeadline = index === dispute.messages.length - 1 && isClaimant;

                  return (
                    <div key={msg.id} className={`border rounded-lg p-4 ${showDeadline ? 'bg-orange-50 border-orange-200' : 'border-gray-200'}`}>
                      <div className="flex gap-3">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarImage src={msg.userAvatar} />
                          <AvatarFallback className="bg-[#3D78CB] text-white">
                            {senderName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              {isClaimant && (
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1">
                                  Claimant:
                                </p>
                              )}
                              <p className="font-['Poppins',sans-serif] text-[15px] text-[#3D78CB] font-medium">
                                {senderName}
                              </p>
                              {showDeadline && (
                                <p className="font-['Poppins',sans-serif] text-[13px] text-[#d97706] mt-1">
                                  Deadline: No reply
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                            {msg.message}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] text-right">
                            {new Date(msg.timestamp).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).replace(',', '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Section */}
              {dispute.status === "open" && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="font-['Poppins',sans-serif] text-[14px] mb-3 resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif]"
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Amount Disputed Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                Total disputed {isOrderDispute ? "order" : "milestone"} <br />amount:
              </p>
              <p className="font-['Poppins',sans-serif] text-[42px] text-[#2c353f] font-bold mb-4">
                £ {dispute.amount.toFixed(0)}
              </p>
              {!isOrderDispute && milestone && (
                <button
                  onClick={() => setShowMilestones(!showMilestones)}
                  className="font-['Poppins',sans-serif] text-[13px] text-[#3D78CB] hover:underline"
                >
                  {showMilestones ? "Hide" : "Show"} Milestones
                </button>
              )}

              {!isOrderDispute && showMilestones && milestone && (
                <div className="mt-4 p-3 bg-[#f8f9fa] rounded-lg text-left">
                  <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-1">
                    Milestone:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    {milestone.description}
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mt-2">
                    £{milestone.amount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Offer Amounts */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      {isClaimant ? "Professional (you)" : "Client (you)"}<br />want to receive:
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[28px] text-[#2c353f] font-bold">
                      £{userWantsToPay !== undefined ? userWantsToPay.toFixed(2) : "0.00"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                      {isClaimant ? "Client" : "Professional"} ({isClaimant ? dispute.respondentName : dispute.claimantName})<br />wants to pay:
                    </p>
                    <p className="font-['Poppins',sans-serif] text-[28px] text-[#2c353f] font-bold">
                      £{otherWantsToReceive !== undefined ? otherWantsToReceive.toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>

                {/* Agreed Amount */}
                <div className="text-center border-t border-gray-200 pt-4">
                  <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-2">
                    Agreed:
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-bold mb-2">
                    £ 0.00
                  </p>
                  {dispute.status === "closed" && (
                    <p className="font-['Poppins',sans-serif] text-[14px] text-red-600 font-bold">
                      RESOLVED, DISPUTE CLOSED
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Offer Input Card - Only show if dispute is open */}
            {dispute.status === "open" && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3">
                  Make an offer:
                </p>
                {!hasOtherMadeOffer && (
                  <Button
                    className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 font-['Poppins',sans-serif] text-[13px]"
                    disabled
                  >
                    {isClaimant ? dispute.respondentName : dispute.claimantName} has not made an offer yet
                  </Button>
                )}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                      £
                    </span>
                    <Input
                      type="number"
                      value={newOffer}
                      onChange={(e) => setNewOffer(e.target.value)}
                      placeholder="0.00"
                      className="pl-7 font-['Poppins',sans-serif] text-[14px]"
                      step="0.01"
                      min="0"
                      max={dispute.amount}
                    />
                  </div>
                  <Button
                    onClick={handleMakeOffer}
                    disabled={!newOffer}
                    className="bg-[#3D78CB] hover:bg-[#2C5AA0] text-white font-['Poppins',sans-serif] px-6"
                  >
                    SUBMIT
                  </Button>
                </div>
                {hasUserMadeOffer && (
                  <p className="font-['Poppins',sans-serif] text-[11px] text-green-600 mt-2 text-center">
                    Your current offer: £{userWantsToPay?.toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}