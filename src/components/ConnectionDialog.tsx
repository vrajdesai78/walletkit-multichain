import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const { handleAccept, handleReject, getMessage } = useConnectionDialog(
    type,
    onOpenChange
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {type === "proposal" ? "Approve Connection" : "Sign Message"}
          </DialogTitle>
          <DialogDescription>
            {type === "proposal"
              ? "Do you want to approve this connection request?"
              : `Sign the message: ${getMessage()}`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex gap-2'>
          <Button variant='destructive' onClick={handleReject}>
            Reject
          </Button>
          <Button onClick={handleAccept}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
