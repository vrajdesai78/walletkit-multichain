import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConnectionDialog } from "@/hooks/useConnectionDialog";
import { DialogType } from "@/types";

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
  const {
    handleApproveProposal,
    handleRejectProposal,
    getMessage,
    handleApproveSignRequest,
  } = useConnectionDialog(type, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {type === "proposal" ? "Approve Connection" : "Sign Message"}
          </DialogTitle>
        </DialogHeader>
        <div className='max-h-[200px] overflow-y-auto'>
          <p className='break-words whitespace-pre-wrap overflow-hidden text-wrap text-muted-foreground'>
            {type === "proposal"
              ? "Do you want to approve this connection request?"
              : `Sign the message: ${getMessage()}`}
          </p>
        </div>
        <DialogFooter className='flex flex-col sm:flex-row gap-2 w-full'>
          <Button
            variant='destructive'
            onClick={handleRejectProposal}
            className='flex-1'
          >
            Reject
          </Button>
          <Button
            onClick={() => {
              if (type === "proposal") {
                handleApproveProposal();
              } else {
                handleApproveSignRequest();
              }
            }}
            className='flex-1'
          >
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
