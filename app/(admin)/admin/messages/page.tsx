"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPicker, type Recipient } from "@/components/admin/user-picker";
import { ADMIN_MESSAGE_LIMITS } from "@/lib/adminMessage";
import { Mail, Megaphone, Send, User } from "lucide-react";

export default function AdminMessagesPage() {
  const [mode, setMode] = useState<"all" | "one">("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const recipientCount = useQuery(api.adminMessages.recipientCount);
  const broadcastToAllUsers = useMutation(api.adminMessages.broadcastToAllUsers);
  const sendToUser = useMutation(api.adminMessages.sendToUser);

  const subjectValid = subject.trim().length > 0 && subject.length <= ADMIN_MESSAGE_LIMITS.subject;
  const messageValid = message.trim().length >= 10 && message.length <= ADMIN_MESSAGE_LIMITS.message;
  const canSubmit = subjectValid && messageValid && (mode === "all" || recipient !== null);

  function resetForm() {
    setSubject("");
    setMessage("");
    setRecipient(null);
  }

  async function handleSendToUser() {
    if (!recipient) return;
    setSending(true);
    try {
      await sendToUser({ userId: recipient._id, subject: subject.trim(), message: message.trim() });
      toast.success(`Email sent to ${recipient.email}`);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }

  async function handleBroadcast() {
    setSending(true);
    try {
      const result = await broadcastToAllUsers({ subject: subject.trim(), message: message.trim() });
      toast.success(`Email queued for ${result.recipientCount} user${result.recipientCount === 1 ? "" : "s"}`);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Send email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compose a message to broadcast to every user, or send it to one person.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recipients</CardTitle>
          <CardDescription>Choose who should receive this email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "all" | "one")}>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="all" className="gap-1.5">
                <Megaphone className="size-4" /> All users
              </TabsTrigger>
              <TabsTrigger value="one" className="gap-1.5">
                <User className="size-4" /> Specific user
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Megaphone className="size-4" />
                </span>
                <p className="text-muted-foreground">
                  This will email{" "}
                  <span className="font-medium text-foreground">
                    {recipientCount === undefined ? <Skeleton className="inline-block h-4 w-8 align-middle" /> : recipientCount}
                  </span>{" "}
                  user{recipientCount === 1 ? "" : "s"} — every registered account, admins excluded.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="one" className="mt-4 space-y-2">
              <Label>Recipient</Label>
              <UserPicker value={recipient} onChange={setRecipient} />
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What's this about?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={ADMIN_MESSAGE_LIMITS.subject}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message…"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={ADMIN_MESSAGE_LIMITS.message}
            />
            <p className="text-right text-xs text-muted-foreground">
              {message.length} / {ADMIN_MESSAGE_LIMITS.message}
            </p>
          </div>

          <Button
            className="w-full"
            disabled={!canSubmit || sending}
            onClick={() => (mode === "all" ? setConfirmOpen(true) : handleSendToUser())}
          >
            <Send /> {mode === "all" ? "Review and send to all users" : "Send email"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-4" /> Send to all users?
            </DialogTitle>
            <DialogDescription>
              This will immediately queue an email to{" "}
              <span className="font-medium text-foreground">
                {recipientCount ?? "…"} user{recipientCount === 1 ? "" : "s"}
              </span>
              . This can&apos;t be undone once sent.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{subject || "(no subject)"}</p>
            <p className="mt-1 line-clamp-3 text-muted-foreground">{message}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleBroadcast} disabled={sending}>
              {sending ? "Sending…" : "Send to all users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
