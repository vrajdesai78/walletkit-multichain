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
      <DialogContent className='sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto px-4 sm:px-6 rounded-lg'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl text-center'>
            {type === "proposal"
              ? "Approve Connection"
              : type === "sendTransaction"
              ? "Approve Transaction"
              : "Sign Message"}
          </DialogTitle>
        </DialogHeader>
        <div className='max-h-[50vh] sm:max-h-[400px] overflow-y-auto rounded-lg'>
          <p className='text-sm sm:text-base break-words whitespace-pre-wrap overflow-hidden text-wrap text-muted-foreground rounded-lg'>
            {type === "proposal"
              ? "Do you want to approve this connection request?"
              : type === "sendTransaction"
              ? "Do you want to approve this transaction?"
              : `Do you want to sign the message?`}
          </p>
          {type === "sendTransaction" && (
            <div className='mt-3 sm:mt-4 space-y-2 border rounded-lg p-2 sm:p-3 bg-muted/50'>
              <h3 className='text-sm sm:text-base font-semibold'>
                Transaction Details
              </h3>
              <pre className='text-xs sm:text-sm text-muted-foreground font-mono overflow-x-auto p-2 sm:p-4 rounded-lg max-h-[200px] sm:max-h-[300px]'>
                {JSON.stringify(
                  data?.txnData ?? data?.requestEvent?.params?.request,
                  null,
                  2
                )}
              </pre>
            </div>
          )}
          {type === "request" && (
            <div className='mt-3 sm:mt-4 space-y-2 border rounded-lg p-2 sm:p-3'>
              <h3 className='text-sm sm:text-base font-semibold'>Message</h3>
              <p className='text-sm sm:text-base break-words whitespace-pre-wrap overflow-hidden text-wrap text-muted-foreground'>
                {getMessage()}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className='flex flex-col sm:flex-row gap-2 w-full mt-4'>
          <Button
            variant='destructive'
            onClick={() => {
              if (type === "proposal") {
                handleRejectProposal();
              } else {
                handleRejectRequest();
              }
            }}
            className='flex-1 rounded-lg'
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
            className='flex-1 rounded-lg'
            disabled={isAccepting}
          >
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
