import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateServerForm } from "@/features/dashboard/components/create-server-form";

interface Props {
  trigger: React.ReactElement;
}

export function CrateServerDialog({ trigger }: Props) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />

      <DialogContent className="max-h-[90vh] sm:max-h-[95vh] sm:max-w-[95vw] lg:max-w-[70vw]">
        <DialogHeader>
          <DialogTitle>Create New Server</DialogTitle>

          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
          <CreateServerForm />
        </div>

        <DialogFooter className="">
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="create-server-form">
            Create server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
