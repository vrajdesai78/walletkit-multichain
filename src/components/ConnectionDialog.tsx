import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConnectionDialog } from "@/hooks/useConnectionDialog";
import { useWalletStore } from "@/store/wallet";
import { DialogType } from "@/types";
import { formatUnits } from "viem";
import { useState } from "react";

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DialogType;
}

export function ConnectionDialog({
  open,
  onOpenChange,
  type,
}: ConnectionDialogProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  const {
    handleApproveProposal,
    handleRejectProposal,
    handleRejectRequest,
    getMessage,
    handleApproveSignRequest,
  } = useConnectionDialog(type, onOpenChange);

  const { data } = useWalletStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {type === "proposal"
              ? "Approve Connection"
              : type === "sendTransaction"
              ? "Approve Transaction"
              : "Sign Message"}
          </DialogTitle>
        </DialogHeader>
        <div className='max-h-[200px] overflow-y-auto'>
          <p className='break-words whitespace-pre-wrap overflow-hidden text-wrap text-muted-foreground'>
            {type === "proposal"
              ? "Do you want to approve this connection request?"
              : type === "sendTransaction"
              ? "Do you want to approve this transaction?"
              : `Do you want to sign the message?`}
          </p>
          {type === "sendTransaction" && (
            <div className='mt-4 space-y-2 border rounded-lg p-3'>
              <h3 className='font-semibold'>USDC Transfer Details</h3>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium'>Amount:</span>{" "}
                  {formatUnits(BigInt(data?.txnData?.amount ?? 0), 6)} USDC
                </p>
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium'>To:</span>{" "}
                  <span className='break-all'>{data?.txnData?.to}</span>
                </p>
              </div>
            </div>
          )}
          {type === "request" && (
            <div className='mt-4 space-y-2 border rounded-lg p-3'>
              <h3 className='font-semibold'>Message</h3>
              <p className='break-words whitespace-pre-wrap overflow-hidden text-wrap text-muted-foreground'>
                {getMessage()}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className='flex flex-col sm:flex-row gap-2 w-full'>
          <Button
            variant='destructive'
            onClick={() => {
              if (type === "proposal") {
                handleRejectProposal();
              } else {
                handleRejectRequest();
              }
            }}
            className='flex-1'
            disabled={isAccepting}
          >
            Reject
          </Button>
          <Button
            onClick={async () => {
              setIsAccepting(true);
              try {
                if (type === "proposal") {
                  await handleApproveProposal();
                } else {
                  await handleApproveSignRequest();
                }
              } finally {
                setIsAccepting(false);
              }
            }}
            className='flex-1'
            disabled={isAccepting}
          >
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
