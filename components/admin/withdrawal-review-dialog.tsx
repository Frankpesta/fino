"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AmountDisplay } from "@/components/ui/amount-display";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Currency } from "@/lib/currency";

type WithdrawalWithEmail = Doc<"withdrawals"> & { userEmail: string };

export function WithdrawalReviewDialog({
  withdrawal,
  open,
  onOpenChange,
}: {
  withdrawal: WithdrawalWithEmail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const approve = useMutation(api.withdrawals.approve);
  const reject = useMutation(api.withdrawals.reject);
  const recordPayoutTxHash = useMutation(api.withdrawals.recordPayoutTxHash);

  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [payoutTxHash, setPayoutTxHash] = useState(withdrawal.payoutTxHash ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApprove() {
    setError(null);
    setIsSubmitting(true);
    try {
      await approve({ withdrawalId: withdrawal._id });
      toast.success("Withdrawal approved", { description: `${withdrawal.userEmail}'s balance was deducted.` });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error("Couldn't approve withdrawal", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    setError(null);
    if (rejectionReason.trim().length === 0) {
      setError("A rejection reason is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await reject({ withdrawalId: withdrawal._id, rejectionReason: rejectionReason.trim() });
      toast.success("Withdrawal rejected");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error("Couldn't reject withdrawal", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveTxHash() {
    setError(null);
    setIsSubmitting(true);
    try {
      await recordPayoutTxHash({ withdrawalId: withdrawal._id, payoutTxHash });
      toast.success("Payout tx hash saved");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error("Couldn't save tx hash", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdrawal from {withdrawal.userEmail}</DialogTitle>
          <DialogDescription>
            Requested {new Date(withdrawal.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <AmountDisplay amount={withdrawal.amount} currency={withdrawal.currency as Currency} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={withdrawal.status} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Destination</span>
            <span className="truncate font-mono text-xs">{withdrawal.destinationAddress}</span>
          </div>
          {withdrawal.note && (
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">Note</span>
              <span className="text-right text-xs">{withdrawal.note}</span>
            </div>
          )}
        </div>

        {withdrawal.status === "approved" && (
          <div className="space-y-2">
            <Label htmlFor="payout-tx-hash">
              Payout tx hash{" "}
              <span className="text-xs text-muted-foreground">
                (paste after sending funds externally -- this system doesn&apos;t broadcast payouts
                itself)
              </span>
            </Label>
            <Input
              id="payout-tx-hash"
              value={payoutTxHash}
              onChange={(e) => setPayoutTxHash(e.target.value)}
              className="font-mono"
            />
          </div>
        )}

        {showRejectForm && (
          <div className="space-y-2">
            <Label htmlFor="withdrawal-rejection-reason">Rejection reason</Label>
            <Textarea
              id="withdrawal-rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Destination address failed verification"
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="gap-2 sm:justify-between">
          {withdrawal.status === "pending" &&
            (showRejectForm ? (
              <>
                <Button variant="ghost" onClick={() => setShowRejectForm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" disabled={isSubmitting} onClick={handleReject}>
                  {isSubmitting ? "Rejecting..." : "Confirm rejection"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setShowRejectForm(true)}
                >
                  Reject
                </Button>
                <Button disabled={isSubmitting} onClick={handleApprove}>
                  {isSubmitting ? "Approving..." : "Approve"}
                </Button>
              </>
            ))}
          {withdrawal.status === "approved" && (
            <Button disabled={isSubmitting} onClick={handleSaveTxHash} className="ml-auto">
              {isSubmitting ? "Saving..." : "Save tx hash"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
