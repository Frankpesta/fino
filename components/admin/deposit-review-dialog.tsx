"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AmountDisplay } from "@/components/ui/amount-display";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Currency } from "@/lib/currency";

type DepositWithEmail = Doc<"deposits"> & { userEmail: string };

export function DepositReviewDialog({
  deposit,
  open,
  onOpenChange,
}: {
  deposit: DepositWithEmail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const proofUrl = useQuery(api.deposits.getProofUrl, { depositId: deposit._id });
  const approve = useMutation(api.deposits.approve);
  const reject = useMutation(api.deposits.reject);

  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApprove() {
    setError(null);
    setIsSubmitting(true);
    try {
      await approve({ depositId: deposit._id });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
      await reject({ depositId: deposit._id, rejectionReason: rejectionReason.trim() });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit from {deposit.userEmail}</DialogTitle>
          <DialogDescription>
            Submitted {new Date(deposit.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <AmountDisplay amount={deposit.amount} currency={deposit.currency as Currency} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={deposit.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Receiving address shown</span>
            <span className="font-mono text-xs">{deposit.destinationWalletAddress}</span>
          </div>
          {deposit.txHash && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tx hash</span>
              <span className="font-mono text-xs">{deposit.txHash}</span>
            </div>
          )}
          {deposit.proofFileId && (
            <div>
              <p className="mb-1 text-muted-foreground">Proof of payment</p>
              {proofUrl === undefined ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : proofUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proofUrl}
                  alt="Proof of payment"
                  className="max-h-64 w-full rounded-md border object-contain"
                />
              ) : (
                <p className="text-xs text-muted-foreground">Could not load proof image.</p>
              )}
            </div>
          )}
        </div>

        {showRejectForm && (
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection reason</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Proof does not match the amount submitted"
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {deposit.status === "pending" && (
          <DialogFooter className="gap-2 sm:justify-between">
            {showRejectForm ? (
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
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
